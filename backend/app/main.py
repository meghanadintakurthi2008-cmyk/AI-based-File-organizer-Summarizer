from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine, Base, SessionLocal
from .services.folder_service import FolderService
from .routers import files, folders, clusters, metrics

# Initialize DB tables and seed immediately
Base.metadata.create_all(bind=engine)
with SessionLocal() as init_db:
    FolderService.seed_initial_data(init_db)

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for AI File Organizer & Folder Recommendation System using TF-IDF and K-Means Clustering.",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(files.router, prefix=settings.API_V1_STR)
app.include_router(folders.router, prefix=settings.API_V1_STR)
app.include_router(clusters.router, prefix=settings.API_V1_STR)
app.include_router(metrics.router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "engine": "TF-IDF + K-Means Centroid Classifier Active"
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "SmartFolder AI Backend is running.",
        "documentation": "/docs",
        "version": settings.VERSION
    }
