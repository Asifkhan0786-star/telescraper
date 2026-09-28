import os
from typing import Optional, Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine env file location
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(BACKEND_DIR, ".env")
if not os.path.exists(ENV_FILE):
    ENV_FILE = os.path.join(os.path.dirname(BACKEND_DIR), ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Telegram Member Exporter"
    SECRET_KEY: str = "super-secret-jwt-key-change-in-production-123456789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # PostgreSQL Database Config
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "telegram_exporter"

    # Optional full connection URL override
    DATABASE_URL: Optional[str] = None

    # Telegram API Secrets
    TELEGRAM_API_ID: Any = 0
    TELEGRAM_API_HASH: str = ""

    # Encryption key for session strings
    ENCRYPTION_SECRET: str = "u6LhG5p-aBf7YQ2n_X9sV8kZ1mP3wE5rT7yU0iO4pK8="

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def clean_api_id(self) -> int:
        raw = str(self.TELEGRAM_API_ID).strip("'\" \n\r\t")
        try:
            return int(raw)
        except ValueError:
            return 0

    @property
    def clean_api_hash(self) -> str:
        return str(self.TELEGRAM_API_HASH).strip("'\" \n\r\t")

    @property
    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL
        else:
            pwd = f":{self.POSTGRES_PASSWORD}" if self.POSTGRES_PASSWORD else ""
            url = f"postgresql+asyncpg://{self.POSTGRES_USER}{pwd}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
        # Normalize postgres / postgresql URLs to postgresql+asyncpg for SQLAlchemy async driver
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("sqlite://") and not url.startswith("sqlite+aiosqlite://"):
            url = url.replace("sqlite://", "sqlite+aiosqlite://", 1)
        return url

    def log_telegram_config_status(self):
        api_id = self.clean_api_id
        api_hash = self.clean_api_hash
        has_hash = bool(api_hash)
        hash_len = len(api_hash) if has_hash else 0
        
        print("\n" + "="*60)
        print("[CONFIG CHECK] Telegram Credentials Verification:")
        print(f"  • API_ID   : {api_id} (valid int: {'Yes' if api_id > 0 else 'No'})")
        print(f"  • API_HASH : {'Set (length ' + str(hash_len) + ')' if has_hash else 'NOT SET'}")
        print("="*60 + "\n")

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
