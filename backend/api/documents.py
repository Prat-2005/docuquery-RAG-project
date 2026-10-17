from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.api.auth import get_current_user
from backend.db.database import get_db
from backend.db.models import Conversation, User
from backend.services.processor import (
    attach_existing_document,
    save_documents,
)

router = APIRouter(
    prefix="/conversations",
    tags=["Documents"],
)


@router.post("/{conversation_id}/documents")
async def upload_documents(
    conversation_id: UUID,
    files: list[UploadFile] = File(...),
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
            status_code=404,
            detail="Conversation not found",
        )

    return await save_documents(
        conversation_id=conversation_id,
        files=files,
        current_user=current_user,
        db=db,
    )


@router.post("/{conversation_id}/documents/{document_id}")
def attach_document(
    conversation_id: UUID,
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return attach_existing_document(
        conversation_id=conversation_id,
        document_id=document_id,
        current_user=current_user,
        db=db,
    )