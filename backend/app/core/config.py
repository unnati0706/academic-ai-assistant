import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import validator

# Resolve path to backend/.env (only used locally; on Render env vars are injected directly)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"


def _normalize_database_url(url: str) -> str:
    """Normalize database URL for SQLAlchemy compatibility.

    Converts postgres:// prefix to postgresql:// which SQLAlchemy expects.
    Supabase provides URLs in postgres:// format but SQLAlchemy's
    create_engine requires postgresql:// or postgresql+driver://.
    """
    normalized = url.strip()
    if normalized.lower().startswith("postgres://"):
        normalized = "postgresql://" + normalized[len("postgres://"):]
    return normalized


class Settings(BaseSettings):
    PROJECT_NAME: str = "AcademicAI API"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    AI_API_KEY: str
    OCR_SPACE_API_KEY: str = "K88088282788957"
    CORS_ORIGINS: str = "*"

    model_config = SettingsConfigDict(
        # Load .env file if it exists (local dev); silently ignored on Render
        env_file=str(ENV_FILE) if ENV_FILE.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @validator("DATABASE_URL", pre=True)
    def _normalize_db_url(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("DATABASE_URL must be set and non-empty")
        return _normalize_database_url(v)


settings = Settings()
