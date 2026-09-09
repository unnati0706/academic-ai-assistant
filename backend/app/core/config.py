import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve path to backend/.env
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "AcademicAI API"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    AI_API_KEY: str

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
