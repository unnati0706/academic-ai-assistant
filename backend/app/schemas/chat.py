from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ChatRequest(BaseModel):
    question: str
    session_id: UUID | None = None

class SourceCitation(BaseModel):
    material_id: UUID | None = None
    title: str
    file_url: str
    page_number: int

class DocumentMetadata(BaseModel):
    filename: str
    page_count: int
    word_count: int
    key_topics: List[str] = []
    char_count: int = 0
    sections_found: List[str] = []

class ChatResponse(BaseModel):
    session_id: UUID
    answer: str
    sources: list[SourceCitation]
    document_metadata: Optional[DocumentMetadata] = None

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
