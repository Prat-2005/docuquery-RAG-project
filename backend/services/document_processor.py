import asyncio
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.db.models import (
    Conversation,
    ConversationDocument,
    Document,
    DocumentChunk,
)
from backend.services.document_retriever import DocumentRetriever
from backend.services.data_storage import save_uploaded_files


def process_document(document: Document, db: Session) -> None:
    document.status = "processing"
    db.commit()

    try:
        retriever = DocumentRetriever()
        retriever.upload(document.storage_path)
        retriever.chunk()

        embeddings = retriever.embed(retriever.chunks)

        for chunk_index, content in enumerate(retriever.chunks):
            db.add(
                DocumentChunk(
                    document_id=document.id,
                    chunk_index=chunk_index,
                    content=content,
                    embedding=embeddings[chunk_index],
                    document_metadata={
                        "source": document.filename,
                    },
                )
            )

        document.status = "processed"
        db.commit()

    except Exception as e:
        import traceback
        traceback.print_exc()         
        document.status = "failed"
        db.commit()
        raise                          

async def save_documents(
    conversation_id: UUID,
    files,
    current_user,
    db: Session,
):
    saved_files = await save_uploaded_files(
        files=files,
        user_id=current_user.id,
    )

    documents = []

    for saved_file in saved_files:
        document = Document(
            id=saved_file["document_id"],
            user_id=current_user.id,
            filename=saved_file["filename"],
            storage_path=saved_file["storage_path"],
            file_type=saved_file["file_type"],
            file_size=saved_file["size"],
            status="pending",
        )

        db.add(document)
        db.add(
            ConversationDocument(
                conversation_id=conversation_id,
                document_id=document.id,
            )
        )

        documents.append(document)

    db.commit()

    for document in documents:
        try:
            await asyncio.to_thread(process_document, document, db)
        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process {document.filename}",
            ) from error

    return {
        "conversation_id": str(conversation_id),
        "documents": [
            {
                "document_id": str(document.id),
                "filename": document.filename,
                "status": document.status,
            }
            for document in documents
        ],
    }


def attach_existing_document(
    conversation_id: UUID,
    document_id: UUID,
    current_user,
    db: Session,
):
    conversation = db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )

    document = db.scalar(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
    )

    if conversation is None or document is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation or document not found",
        )

    if document.status != "processed":
        raise HTTPException(
            status_code=409,
            detail="Document is not ready for retrieval",
        )

    association = db.get(
        ConversationDocument,
        (conversation_id, document_id),
    )

    if association is None:
        db.add(
            ConversationDocument(
                conversation_id=conversation_id,
                document_id=document_id,
            )
        )
        db.commit()

    return {
        "conversation_id": str(conversation_id),
        "document_id": str(document_id),
        "message": "Document attached successfully",
    }