from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    token: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    phone: str | None = None
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class StudentCreate(BaseModel):
    email: EmailStr
    phone: str | None = None
    name: str
    roll_number: str
    semester: int
    division: str | None = None
    branch: str

class StudentUpdate(BaseModel):
    name: str | None = None
    roll_number: str | None = None
    semester: int | None = None
    division: str | None = None
    branch: str | None = None
    status: str | None = None

class StudentResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    roll_number: str
    semester: int
    division: str | None = None
    branch: str
    status: str
    created_at: datetime
    user: UserResponse | None = None

    class Config:
        from_attributes = True
