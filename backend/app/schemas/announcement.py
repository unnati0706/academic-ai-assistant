from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    expires_at: datetime | None = None

class AnnouncementResponse(BaseModel):
    id: UUID
    title: str
    content: str
    expires_at: datetime | None = None
    created_by: UUID | None = None
    created_at: datetime

    class Config:
        from_attributes = True
