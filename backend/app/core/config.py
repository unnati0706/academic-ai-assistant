import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve path to backend/.env (only used locally; on Render env vars are injected directly)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

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

settings = Settings()
