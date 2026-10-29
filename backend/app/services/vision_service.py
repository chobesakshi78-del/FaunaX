"""
FAUNA-X: Vision Service Implementation (AI-01: REAL)
Integrates backend routes with the in-memory fine-tuned YOLO visual screening model.
"""
import os
import uuid
from pathlib import Path
from typing import Dict, Any, Tuple
from fastapi import UploadFile

from backend.app.core.config import settings
from ai.vision.inference import run_vision_inference

class VisionService:
    @staticmethod
    async def save_uploaded_image(file: UploadFile, case_id: int) -> Tuple[str, bytes]:
        """Saves incoming image to disk storage and returns storage path + raw bytes."""
        upload_dir = Path(settings.UPLOAD_DIR)
        case_upload_dir = upload_dir / f"case_{case_id}"
        case_upload_dir.mkdir(parents=True, exist_ok=True)

        ext = Path(file.filename or "image.jpg").suffix.lower()
        if not ext:
            ext = ".jpg"

        unique_filename = f"{uuid.uuid4().hex[:12]}{ext}"
        target_path = case_upload_dir / unique_filename

        content = await file.read()
        with open(target_path, "wb") as f:
            f.write(content)

        relative_storage_path = f"case_{case_id}/{unique_filename}"
        return relative_storage_path, content

    @staticmethod
    def screen_image(image_bytes: bytes, species: str = "cattle") -> Dict[str, Any]:
        """Executes actual deep learning inference on the image bytes."""
        return run_vision_inference(image_bytes=image_bytes, animal_species=species)

vision_service = VisionService()
