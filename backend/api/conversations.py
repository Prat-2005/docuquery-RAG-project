from datetime import datetime, timezone
from uuid import UUID

from backend.services.generation import GenerativeGPT
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.api.auth import get_current_user
from backend.db.database import get_db
from backend.db.models import Conversation, Message, User
from backend.db.schemas import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)


router = APIRouter(tags=["Conversations"])
generator = GenerativeGPT()


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


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
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

    previous_messages = db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc(), Message.id.asc())
    ).all()

    conversation_context = "\n".join(
        f"{message.role.capitalize()}: {message.content}"
        for message in previous_messages
    )

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=message_data.content,
    )

    db.add(user_message)
    db.flush()

    assistant_content = generator.generate(
        context=conversation_context,
        question=message_data.content,
    )

    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=assistant_content,
    )

    db.add(assistant_message)

    # The model currently names these columns created_id and updated_id.
    conversation.updated_id = datetime.now(timezone.utc)

    db.commit()

    messages = db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation.id)
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