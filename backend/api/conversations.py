from threading import Event, Lock
from time import monotonic
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, Header, HTTPException, status, File, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_current_user
from backend.db.database import get_db
from backend.db.models import (
    Conversation,
    ConversationDocument,
    Document,
    Message,
    User,
    UserSettings
)
from backend.db.schemas import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    ChatResponse,
    UserSettingsRequest,
    UserSettingsResponse
)
from backend.services.vector_search import search_conversation_chunks
from backend.services.document_processor import (
    attach_existing_document,
    save_documents,
)
from datetime import datetime, timezone
from backend.services.chat_generation import GenerativeGPT

router = APIRouter(tags=["Conversations"])
_active_requests: dict[str, Event] = {}
_cancelled_request_ids: dict[str, float] = {}
_active_requests_lock = Lock()


def _settings_values(settings: UserSettings | None) -> dict[str, object] | None:
    if settings is None:
        return None
    return {
        "llm_provider": settings.llm_provider,
        "llm_model": settings.llm_model,
        "api_base_url": settings.api_base_url,
    }


def _register_request(request_id: str) -> Event:
    cancellation = Event()
    with _active_requests_lock:
        cutoff = monotonic() - 60
        expired_ids = [
            request_id
            for request_id, cancelled_at in _cancelled_request_ids.items()
            if cancelled_at < cutoff
        ]
        for expired_id in expired_ids:
            _cancelled_request_ids.pop(expired_id, None)
        if request_id in _cancelled_request_ids:
            cancellation.set()
            _cancelled_request_ids.pop(request_id, None)
        _active_requests[request_id] = cancellation
    return cancellation


def _remove_request(request_id: str) -> None:
    with _active_requests_lock:
        _active_requests.pop(request_id, None)
        _cancelled_request_ids.pop(request_id, None)


def _cancel_request(request_id: str) -> bool:
    with _active_requests_lock:
        cancellation = _active_requests.get(request_id)
        _cancelled_request_ids[request_id] = monotonic()
        if cancellation is not None:
            cancellation.set()
            return True
    return False


def _raise_if_cancelled(cancellation: Event) -> None:
    if cancellation.is_set():
        raise HTTPException(
            status_code=499,
            detail="Message generation was cancelled",
        )

class QuestionRequest(BaseModel):
    question: str
    improv_answer: str | None = None
    top_k: int | None = Field(default=None, gt=0, le=50)

def get_context(
    conversation_id: UUID,
    question: str,
    current_user: User,
    db: Session,
    top_k: int,
) -> str:
    chunks = search_conversation_chunks(
        conversation_id=conversation_id,
        question=question,
        user_id=current_user.id,
        db=db,
        top_k=top_k,
    )

    if not chunks:
        raise HTTPException(
            status_code=404,
            detail="No processed document chunks found",
        )

    return "\n".join(
        f"- {chunk.content}"
        for chunk in chunks
    )


@router.get(
    "/conversations",
    response_model=list[ConversationResponse],
)
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    statement = (
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(
            Conversation.updated_id.desc(),
            Conversation.created_id.desc(),
        )
    )

    conversations = db.scalars(statement).all()

    return [
        ConversationResponse(
            id=conversation.id,
            title=conversation.title,
            created_at=conversation.created_id,
            updated_at=conversation.updated_id,
        )
        for conversation in conversations
    ]


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = Conversation(
        user_id=current_user.id,
        title=conversation_data.title,
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_id,
        updated_at=conversation.updated_id,
    )


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    db.delete(conversation)
    db.commit()
    return {"message": "Conversation deleted successfully"}


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
def get_conversation_messages(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    messages = db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    ).all()

    return [
        MessageResponse(
            id=message.id,
            conversation_id=message.conversation_id,
            role=message.role,
            content=message.content,
            created_id=message.created_at,
        )
        for message in messages
    ]


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=ChatResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_conversation_message(
    conversation_id: UUID,
    message_data: MessageCreate,
    request_id: str | None = Header(default=None, alias="X-Request-ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request_id = request_id or str(uuid4())
    cancellation = _register_request(request_id)
    conversation = db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )

    if conversation is None:
        _remove_request(request_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    if not message_data.content.strip():
        _remove_request(request_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty",
        )

    processed_document = db.scalar(
        select(Document.id)
        .join(
            ConversationDocument,
            ConversationDocument.document_id == Document.id,
        )
        .where(
            ConversationDocument.conversation_id == conversation_id,
            Document.user_id == current_user.id,
            Document.status == "processed",
        )
        .limit(1)
    )

    if processed_document is None:
        _remove_request(request_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This conversation has no processed documents",
        )

    previous_messages = db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    ).all()
    user_settings = db.scalar(
        select(UserSettings).where(UserSettings.user_id == current_user.id)
    )
    generator = GenerativeGPT(_settings_values(user_settings))

    conversation_history = "\n".join(
        f"{message.role.capitalize()}: {message.content}"
        for message in previous_messages
    )

    try:
        _raise_if_cancelled(cancellation)
        document_context = get_context(
            conversation_id=conversation_id,
            question=message_data.content,
            current_user=current_user,
            db=db,
            top_k=user_settings.top_k if user_settings else 3,
        )

        combined_context = (
            f"Conversation history:\n{conversation_history}\n\n"
            f"Retrieved document context:\n{document_context}"
        )

        _raise_if_cancelled(cancellation)
        answer = generator.generate(
            context=combined_context,
            question=message_data.content,
        )

        _raise_if_cancelled(cancellation)
        if conversation.title == "New Conversation" and not previous_messages:
            generated_title = generator.generate_title(
                question=message_data.content,
                answer=answer,
            )
            if generated_title:
                conversation.title = generated_title

        user_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=message_data.content,
        )

        assistant_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=answer,
        )

        db.add(user_message)
        db.add(assistant_message)

        conversation.updated_id = datetime.now(timezone.utc)

        db.commit()
        db.refresh(user_message)
        db.refresh(assistant_message)

    except HTTPException:
        db.rollback()
        raise
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate an answer",
        ) from error
    finally:
        _remove_request(request_id)

    return ChatResponse(
        user_message=MessageResponse(
            id=user_message.id,
            conversation_id=user_message.conversation_id,
            role=user_message.role,
            content=user_message.content,
            created_id=user_message.created_at,
        ),
        assistant_message=MessageResponse(
            id=assistant_message.id,
            conversation_id=assistant_message.conversation_id,
            role=assistant_message.role,
            content=assistant_message.content,
            created_id=assistant_message.created_at,
        ),
    )


@router.post(
    "/conversations/{conversation_id}/messages/{request_id}/stop",
    status_code=status.HTTP_202_ACCEPTED,
)
def stop_conversation_message(
    conversation_id: UUID,
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    cancelled = _cancel_request(request_id)
    return {
        "request_id": request_id,
        "cancelled": cancelled,
        "message": (
            "Message generation cancellation requested"
            if cancelled
            else "Message generation is no longer active"
        ),
    }


@router.post("/conversations/{conversation_id}/retrieve")
def retrieve_context(
    conversation_id: UUID,
    request: QuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty",
        )

    conversation = db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    chunks = search_conversation_chunks(
        conversation_id=conversation_id,
        question=request.question,
        user_id=current_user.id,
        db=db,
        top_k=request.top_k
        or db.scalar(
            select(UserSettings.top_k).where(UserSettings.user_id == current_user.id)
        )
        or 3,
    )

    if not chunks:
        raise HTTPException(
            status_code=404,
            detail="No processed document chunks found",
        )

    context = "\n".join(
        f"- {chunk.content}"
        for chunk in chunks
    )

    return {
        "question": request.question,
        "context": context,
        "chunks": [
            {
                "id": str(chunk.id),
                "document_id": str(chunk.document_id),
                "chunk_index": chunk.chunk_index,
                "content": chunk.content,
            }
            for chunk in chunks
        ],
    }


@router.post(
    "/conversations/{conversation_id}/generate"
)
def generate_answer(
    conversation_id: UUID,
    request: QuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty",
        )

    conversation = db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    try:
        user_settings = db.scalar(
            select(UserSettings).where(UserSettings.user_id == current_user.id)
        )
        generator = GenerativeGPT(_settings_values(user_settings))
        context = get_context(
            conversation_id=conversation_id,
            question=request.question,
            current_user=current_user,
            db=db,
            top_k=request.top_k or (user_settings.top_k if user_settings else 3),
        )

        answer = generator.generate(
            context=context,
            question=request.question,
        )

        return {
            "question": request.question,
            "answer": answer,
            "context": context,
        }

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error

@router.post(
    "/conversations/{conversation_id}/regenerate"
)
def regenerate_answer(
    conversation_id: UUID,
    request: QuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty",
        )

    if not request.improv_answer:
        raise HTTPException(
            status_code=400,
            detail="Previous answer is required",
        )

    conversation = db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    try:
        user_settings = db.scalar(
            select(UserSettings).where(UserSettings.user_id == current_user.id)
        )
        generator = GenerativeGPT(_settings_values(user_settings))
        context = get_context(
            conversation_id=conversation_id,
            question=request.question,
            current_user=current_user,
            db=db,
            top_k=request.top_k or (user_settings.top_k if user_settings else 3),
        )

        answer = generator.regenerate(
            context=context,
            question=request.question,
            previous_answer=request.improv_answer,
        )

        return {
            "question": request.question,
            "answer": answer,
            "context": context,
        }

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error

@router.get("/conversations/{conversation_id}/summary")
def get_conversation_summary(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    docs = db.scalars(
        select(Document)
        .join(ConversationDocument)
        .where(ConversationDocument.conversation_id == conversation_id)
    ).all()

    if not docs:
        return {"summary": "No documents uploaded to this conversation."}

    # In a real app, we'd fetch stored summaries. For now, we return a combined list.
    return {
        "summary": f"This conversation contains {len(docs)} document(s).",
        "documents": [{"filename": d.filename, "status": d.status} for d in docs]
    }
