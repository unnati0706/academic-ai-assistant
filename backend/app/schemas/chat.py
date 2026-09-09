from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

class ChatRequest(BaseModel):
    question: str
    session_id: UUID | None = None

class SourceCitation(BaseModel):
    material_id: UUID | None = None
    title: str
    file_url: str
    page_number: int

class ChatResponse(BaseModel):
    session_id: UUID
    answer: str
    sources: list[SourceCitation]

class ChatMessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    cited_sources: list[dict] | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str | None = None
    created_at: datetime
    messages: list[ChatMessageResponse] = []

    class Config:
        from_attributes = True
