from datetime import datetime, timezone
from uuid import UUID

from backend.services.chat_generation import GenerativeGPT
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from pydantic import BaseModel, Field

from backend.api.auth import get_current_user
from backend.db.database import get_db
from backend.db.models import (
    Conversation,
    ConversationDocument,
    Document,
    Message,
    User,
)
from backend.db.schemas import (
    ChatResponse,
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)
from backend.services.vector_search import search_conversation_chunks


router = APIRouter(tags=["Conversations"])
generator = GenerativeGPT()


class QuestionRequest(BaseModel):
    question: str
    improv_answer: str | None = None
    top_k: int = Field(default=3, gt=0, le=50)


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

    if not message_data.content.strip():
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This conversation has no processed documents",
        )

    previous_messages = db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    ).all()

    conversation_history = "\n".join(
        f"{message.role.capitalize()}: {message.content}"
        for message in previous_messages
    )

    try:
        document_context = get_context(
            conversation_id=conversation_id,
            question=message_data.content,
            current_user=current_user,
            db=db,
            top_k=3,
        )

        combined_context = (
            f"Conversation history:\n{conversation_history}\n\n"
            f"Retrieved document context:\n{document_context}"
        )

        answer = generator.generate(
            context=combined_context,
            question=message_data.content,
        )

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
        raise
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate an answer",
        ) from error

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
        top_k=request.top_k,
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
        context = get_context(
            conversation_id=conversation_id,
            question=request.question,
            current_user=current_user,
            db=db,
            top_k=request.top_k,
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
        context = get_context(
            conversation_id=conversation_id,
            question=request.question,
            current_user=current_user,
            db=db,
            top_k=request.top_k,
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
