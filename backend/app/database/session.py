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
    """Initialize database extension pgvector, create tables, and seed default users."""
    import uuid
    from app.models.base import Base
    import app.models  # noqa: F401
    from app.models.user import User, UserRole

    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))

    Base.metadata.create_all(bind=engine)

    # Safe migration: add `name` column to users table if it doesn't exist yet
    try:
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);"
            ))
    except Exception as e:
        print(f"Migration note (name column): {e}")

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

