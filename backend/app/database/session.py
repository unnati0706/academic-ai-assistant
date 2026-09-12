from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Production-safe pool config for Render free tier + Supabase
# pool_recycle: recycle connections every 5min to avoid idle timeouts
# pool_pre_ping: verify connections are alive before use
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=300,
    pool_timeout=30,
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    """Dependency for obtaining database sessions in FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables and seed default users.
    Skips pgvector extension if not available - uses JSON-based embedding fallback.
    """
    import uuid
    from app.models.base import Base
    import app.models  # noqa: F401
    from app.models.user import User, UserRole

    # Create tables (skip pgvector extension if not available)
    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    except Exception:
        # pgvector not installed - tables will be created but embedding column will be JSON
        print("Note: pgvector extension not available, using JSON-based embedding fallback")

    Base.metadata.create_all(bind=engine)

    try:
        with SessionLocal() as db:
            student_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
            faculty_id = uuid.UUID("00000000-0000-0000-0000-000000000002")

            if not db.query(User).filter(User.id == student_id).first():
                db.add(User(id=student_id, email="alex.student@academic.edu", role=UserRole.STUDENT))
            if not db.query(User).filter(User.id == faculty_id).first():
                db.add(User(id=faculty_id, email="dr.smith@academic.edu", role=UserRole.FACULTY_ADMIN))
            db.commit()
    except Exception as e:
        print(f"User seed warning: {e}")