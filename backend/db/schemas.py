from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator
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


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: UUID
    name: str | None
    email: EmailStr
    created_at: datetime


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
