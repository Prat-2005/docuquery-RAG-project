from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from uuid import UUID
from typing import Literal


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: UUID
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

