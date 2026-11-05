from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator, model_validator
from uuid import UUID
from typing import Literal

class UserRegister(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    model_config = ConfigDict(str_strip_whitespace=True)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(character.isalpha() for character in value) or not any(
            character.isdigit() for character in value
        ):
            raise ValueError("Password must contain at least one letter and one digit")
        return value


class ChangePasswordRequest(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(character.isalpha() for character in value) or not any(
            character.isdigit() for character in value
        ):
            raise ValueError("Password must contain at least one letter and one digit")
        return value


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: UUID
    name: str | None
    email: EmailStr
    created_at: datetime


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None


class ConversationCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(
        default="New Conversation",
        min_length=1,
        max_length=120
    )


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime


class MessageCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    content: str = Field(
        min_length=1,
        max_length=20000
    )

class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    role: Literal["user", "assistant"]
    content: str
    created_id: datetime

class ChatResponse(BaseModel):
    user_message: MessageResponse
    assistant_message: MessageResponse

class UserSettingsRequest(BaseModel):
    llm_provider: str = Field(default="local", min_length=1, max_length=50)
    llm_model: str | None = None
    api_base_url: str | None = None
    api_key_masked: str | None = None
    chunk_size: int | None = None
    chunk_overlap: int | None = None
    top_k: int | None = None
    theme: str | None = None

    @model_validator(mode="after")
    def validate_chunking(self):
        if not self.llm_provider.strip():
            raise ValueError("LLM provider is required")
        if self.llm_model is not None and not self.llm_model.strip():
            raise ValueError("A local chat model is required")
        if (
            self.chunk_size is not None
            and self.chunk_overlap is not None
            and self.chunk_overlap >= self.chunk_size
        ):
            raise ValueError("Chunk overlap must be smaller than chunk size")
        return self

class UserSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    llm_provider: str
    llm_model: str | None
    api_base_url: str | None
    api_key_masked: str | None
    chunk_size: int
    chunk_overlap: int
    top_k: int
    theme: str
