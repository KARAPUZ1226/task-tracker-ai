from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mini Task Tracker with AI"
    VERSION: str = "1.0.0"
    SECRET_KEY: str = "supersecretjwtkey_hackathon_task_tracker_2026_x99"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = "sqlite:///./tasks.db"
    
    # AI settings
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # Gemini settings
    GEMINI_API_KEY: Optional[str] = "AQ.Ab8RN6Ji9D98s9p9MeJ0DLdM220hPidHqneIB78AwK4ubs0_fQ"
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
