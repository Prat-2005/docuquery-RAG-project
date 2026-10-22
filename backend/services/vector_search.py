from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.db.models import (
    Conversation,
    ConversationDocument,
    Document,
    DocumentChunk,
)
from backend.services.document_retriever import DocumentRetriever


def search_conversation_chunks(
    conversation_id: UUID,
    question: str,
    user_id: UUID,
    db: Session,
    top_k: int = 3,
):
    if not question.strip():
        raise ValueError("Question cannot be empty")

    if top_k <= 0:
        raise ValueError("top_k must be greater than zero")

    print("Retrieval: creating the question embedding...", flush=True)
    query_embedding = DocumentRetriever().embed([question])[0]
    print("Retrieval: question embedding ready; querying PostgreSQL...", flush=True)

    statement = (
        select(DocumentChunk)
        .join(
            Document,
            Document.id == DocumentChunk.document_id,
        )
        .join(
            ConversationDocument,
            ConversationDocument.document_id == Document.id,
        )
        .join(
            Conversation,
            Conversation.id == ConversationDocument.conversation_id,
        )
        .where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
            Document.user_id == user_id,
            Document.status == "processed",
            DocumentChunk.embedding.is_not(None),
        )
        .order_by(
            DocumentChunk.embedding.cosine_distance(query_embedding)
        )
        .limit(top_k)
    )

    chunks = db.scalars(statement).all()
    print(f"Retrieval: found {len(chunks)} matching chunk(s).", flush=True)
    return chunks

def backfill_embeddings(db: Session) -> int:
    chunks = db.scalars(
        select(DocumentChunk)
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(
            Document.status == "processed",
            DocumentChunk.embedding.is_(None),
        )
        .order_by(
            DocumentChunk.document_id,
            DocumentChunk.chunk_index,
        )
    ).all()

    if not chunks:
        return 0

    retriever = DocumentRetriever()
    embeddings = retriever.embed(
        [chunk.content for chunk in chunks]
    )

    for chunk, embedding in zip(chunks, embeddings):
        chunk.embedding = embedding

    db.commit()
    return len(chunks)