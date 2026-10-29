"""
FAUNA-X: FastAPI Main Application
Livestock Health Intelligence & Early Outbreak Response System API.
"""
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.core.database import engine, Base
from ai.vision.model_loader import vision_manager

from backend.app.api.auth import router as auth_router
from backend.app.api.cases import router as cases_router
from backend.app.api.ai import router as ai_router
from backend.app.api.vet import router as vet_router
from backend.app.api.field import router as field_router
from backend.app.api.map import router as map_router
from backend.app.api.admin import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure DB tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Ensure upload directories exist
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Warm up in-memory AI Vision Model Singleton
    print("Warming up FAUNA-X AI Vision Model...")
    vision_manager.initialize(settings.MODEL_PATH)
    
    yield
    
    # Shutdown
    print("Shutting down FAUNA-X API backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Livestock Disease Surveillance & Early Outbreak Response API (SIH26128)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local development on any host port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static File Uploads
upload_root = Path(settings.UPLOAD_DIR).parent
upload_root.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_root)), name="uploads")

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(cases_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(vet_router, prefix=settings.API_V1_STR)
app.include_router(field_router, prefix=settings.API_V1_STR)
app.include_router(map_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "platform": "FAUNA-X Livestock Health Intelligence",
        "problem_statement": "SIH26128",
        "api_docs": "/docs",
        "ai_status": "READY" if vision_manager.is_ready else "OFFLINE",
        "disclaimer": "AI-assisted preliminary screening. Veterinary verification required."
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "ai_engine": "online" if vision_manager.is_ready else "offline"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
