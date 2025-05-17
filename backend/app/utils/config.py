import os
from pydantic import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings."""
    APP_NAME: str = "Flexible Variable Compensation Calculator API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    
    # API settings
    API_PREFIX: str = "/api/v1"
    
    # CORS settings
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]
    
    # Bonus policy settings
    MAX_BONUS_TO_SALARY_RATIO: float = 3.0
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings."""
    return Settings()
