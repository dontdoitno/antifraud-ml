"""
Конфигурация приложения
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Настройки приложения"""

    # Основные настройки
    APP_NAME: str = "FraudGuard AI"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # API настройки
    API_V1_PREFIX: str = "/api/v1"
    ALLOWED_ORIGINS: List[str] = ["*"]

    # ML модель
    MODEL_PATH: str = "data/models/fraud_model.json"
    FRAUD_THRESHOLD: float = 0.5  # Порог для классификации как мошенничество

    # База данных (опционально)
    DATABASE_URL: str = "sqlite:///./fraudguard.db"

    # Redis (опционально)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Логирование
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
