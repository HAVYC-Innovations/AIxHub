from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class Role(str, Enum):
    user = "user"
    assistant = "assistant"


class ChatMessage(BaseModel):
    role: Role
    content: str


class Attachment(BaseModel):
    name: str
    url: Optional[str] = None
    mime_type: Optional[str] = Field(default=None, alias="mimeType")


class GeneratePayload(BaseModel):
    prompt: str
    model: Optional[str] = None
    temperature: float = 0.4
    max_tokens: int = Field(default=512, alias="maxTokens")
    history: List[ChatMessage] = []
    attachments: List[Attachment] = []


class GenerateResponse(BaseModel):
    model: str
    output: str
    latency_ms: int
