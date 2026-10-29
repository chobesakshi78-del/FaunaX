"""
FAUNA-X: Application Configuration
Handles environment settings, database connectivity, JWT security, and file paths.
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "FAUNA-X Livestock Health Intelligence"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("JWT_SECRET", "faunax-sih2026-secure-secret-key-32chars-min")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database (PostgreSQL or SQLite fallback for zero-friction local development)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite+aiosqlite:///{BASE_DIR}/faunax.db"
    )
    
    # AI Model
    MODEL_PATH: str = os.getenv(
        "MODEL_PATH",
        str(BASE_DIR / "models" / "production" / "faunax_livestock_vision_v1.pt")
    )
    
    # Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads" / "cases"))
    
    # Mapbox & GIS
    MAPBOX_TOKEN: str = os.getenv("MAPBOX_TOKEN", "pk.eyJ1IjoiZmF1bmF4LWRlbW8iLCJhIjoiY2x5eXoxMjM0NTY3OCJ9.demo_token")

    # CORS Origins
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]

    class Config:
        case_sensitive = True

settings = Settings()
