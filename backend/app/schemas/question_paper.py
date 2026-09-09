from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

class QuestionPaperResponse(BaseModel):
    id: UUID
    title: str
    subject_id: UUID
    exam_type: str
    year: int
    semester: int
    file_url: str
    created_at: datetime
    subject_code: str | None = None
    subject_name: str | None = None

    class Config:
        from_attributes = True
