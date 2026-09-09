import uuid
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.models.base import Base

class Student(Base):
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    roll_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False)
    division: Mapped[str | None] = mapped_column(String(50), nullable=True)
    branch: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="student_profile")
