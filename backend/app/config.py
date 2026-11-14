"""Environment-based configuration with deliberate safe defaults."""
from __future__ import annotations

from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    environment: str = "demonstration"
    allowed_origins: tuple[str, ...] = ("http://localhost:3000",)
    operator_api_key: str = ""
    database_url: str = ""
    event_capacity: int = 128


def load_settings() -> Settings:
    origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    return Settings(
        environment=os.getenv("APP_ENV", "demonstration"),
        allowed_origins=tuple(item.strip() for item in origins.split(",") if item.strip()),
        operator_api_key=os.getenv("OPERATOR_API_KEY", ""),
        database_url=os.getenv("DATABASE_URL", ""),
        event_capacity=128,
    )


settings = load_settings()
