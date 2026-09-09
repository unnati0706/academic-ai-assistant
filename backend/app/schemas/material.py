from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

class SubjectCreate(BaseModel):
    name: str
    code: str
    semester: int
    branch: str

class SubjectResponse(BaseModel):
    id: UUID
    name: str
    code: str
    semester: int
    branch: str
    created_at: datetime

    class Config:
        from_attributes = True

class MaterialResponse(BaseModel):
    id: UUID
    title: str
    description: str | None = None
    subject_id: UUID
    semester: int
    unit: int | None = None
    material_type: str
    file_url: str
    uploaded_by: UUID | None = None
    version: int
    status: str
    created_at: datetime
    subject_code: str | None = None
    subject_name: str | None = None

    class Config:
        from_attributes = True
