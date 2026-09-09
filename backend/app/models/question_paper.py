import uuid
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.models.base import Base

class QuestionPaper(Base):
    __tablename__ = "question_papers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False
    )
    exam_type: Mapped[str] = mapped_column(String(50), nullable=False)  # mid-sem, university
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False)
    file_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    subject = relationship("Subject", back_populates="question_papers")
