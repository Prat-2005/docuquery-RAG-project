from uuid import UUID
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select, delete
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_current_user
from backend.db.database import get_db
from backend.db.models import Conversation, User, Document, ConversationDocument
from backend.services.document_processor import (
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


@router.get("/{conversation_id}/documents")
def get_conversation_documents(
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
            status_code=404,
            detail="Conversation not found",
        )

    docs = db.scalars(
        select(Document)
        .join(ConversationDocument, ConversationDocument.document_id == Document.id)
        .where(
            ConversationDocument.conversation_id == conversation_id,
            Document.user_id == current_user.id,
        )
        .order_by(Document.created_at.desc())
    ).all()

    return [
        {
            "id": str(doc.id),
            "filename": doc.filename,
            "file_type": doc.file_type,
            "file_size": doc.file_size,
            "status": doc.status,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
        }
        for doc in docs
    ]


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

@router.delete("/documents/{document_id}")
def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.scalar(select(Document).where(Document.id == document_id))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}

@router.get("/documents/{document_id}/summary")
def get_document_summary(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.scalar(select(Document).where(Document.id == document_id))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this document")

    # In a real system, the summary would be stored in a column or a separate table.
    # For this implementation, we'll return the metadata summary if available.
    return {"filename": doc.filename, "summary": "Summary generation is currently handled during ingestion."}
