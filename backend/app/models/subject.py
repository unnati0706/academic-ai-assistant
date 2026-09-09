import uuid
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.models.base import Base

class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False)
    branch: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    materials = relationship("Material", back_populates="subject", cascade="all, delete-orphan")
    question_papers = relationship("QuestionPaper", back_populates="subject", cascade="all, delete-orphan")
