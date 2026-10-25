import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
ORGANIZED_DIR = STORAGE_DIR / "organized"
DB_PATH = STORAGE_DIR / "smartfolder.db"

# Ensure storage directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ORGANIZED_DIR.mkdir(parents=True, exist_ok=True)

class Settings:
    PROJECT_NAME: str = "SmartFolder AI - Content-Based Organizer Backend"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "2.4.0"
    
    # Database
    DATABASE_URL: str = f"sqlite:///{DB_PATH}"
    
    # ML & Clustering Configuration
    TFIDF_MAX_FEATURES: int = 5000
    TFIDF_NGRAM_RANGE: tuple = (1, 2)
    CONFIDENCE_HIGH_THRESHOLD: float = 0.90
    CONFIDENCE_LOW_THRESHOLD: float = 0.70
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
        "*"
    ]

settings = Settings()
