import uuid
from datetime import datetime
from .database import Base
from sqlalchemy import String, Uuid, DateTime, Text, func, ForeignKey, BigInteger, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

class User(Base):
    __tablename__ = "users"

    id:Mapped[uuid.UUID] = mapped_column(
        Uuid, 
        primary_key=True, 
        default=uuid.uuid4
    )

    email:Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash:Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    created_at:Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    ) 

    conversations: Mapped[list["Conversation"]] = relationship(
        "Conversation",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    documents: Mapped[list["Document"]] = relationship(
        "Document",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id:Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4
    )

    user_id:Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE")
    )

    title:Mapped[str] = mapped_column(
        String(1024),
        nullable=False
    )

    created_id:Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_id:Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="conversations",
    )

    messages: Mapped[list["Message"]] = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
    )

    conversation_documents: Mapped[list["ConversationDocument"]] = relationship(
        "ConversationDocument",
        back_populates="conversation",
        cascade="all, delete-orphan",
    )


class Document(Base):
    __tablename__ = "documents"

    id:Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4
    )

    user_id:Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True
    )

    filename:Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True
    )

    storage_path:Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    file_type:Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    file_size:Mapped[int] = mapped_column(
        BigInteger,
        nullable=True
    )

    status:Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    created_at:Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="documents",
    )

    document_chunks: Mapped[list["DocumentChunk"]] = relationship(
        "DocumentChunk",
        back_populates="document",
        cascade="all, delete-orphan",
    )

    conversation_documents: Mapped[list["ConversationDocument"]] = relationship(
        "ConversationDocument",
        back_populates="document",
        cascade="all, delete-orphan",
    )

class Message(Base):
    __tablename__ = "messages"

    id:Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4
    )

    conversation_id:Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False
    )

    role:Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    content:Mapped[str] = mapped_column(Text)

    created_at:Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    conversation: Mapped["Conversation"] = relationship(
        "Conversation",
        back_populates="messages",
    )

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id:Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4
    )
    
    document_id:Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False
    )

    chunk_index:Mapped[int] = mapped_column(
        Integer,
        nullable=True,
    )

    content:Mapped[str] = mapped_column(
        Text,
        nullable=True
    )

    embedding:Mapped[list[float]] = mapped_column(
        Vector(384),
        nullable=True
    )

    document_metadata:Mapped[dict] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        server_default='{}'
    )

    document: Mapped["Document"] = relationship(
        "Document",
        back_populates="document_chunks",
    )


class ConversationDocument(Base):
    __tablename__ = "conversation_documents"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        primary_key=True,
    )

    document_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("documents.id", ondelete="CASCADE"),
        primary_key=True,
    )

    conversation: Mapped["Conversation"] = relationship(
        "Conversation",
        back_populates="conversation_documents",
    )

    document: Mapped["Document"] = relationship(
        "Document",
        back_populates="conversation_documents",
    )