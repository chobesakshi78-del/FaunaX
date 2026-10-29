"""
FAUNA-X AI: Vision Model Loader
Loads the fine-tuned YOLO livestock visual health screening model into memory as a singleton.
"""
import os
import sys
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any
import torch
from ultralytics import YOLO

logger = logging.getLogger("faunax.ai.vision")

class VisionModelManager:
    _instance: Optional["VisionModelManager"] = None
    _model: Optional[YOLO] = None
    _metadata: Dict[str, Any] = {}
    _device: str = "cpu"
    _is_ready: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VisionModelManager, cls).__new__(cls)
        return cls._instance

    def initialize(self, model_path: Optional[str] = None) -> bool:
        """Loads and verifies the trained FAUNA-X vision model."""
        base_dir = Path(__file__).resolve().parent.parent.parent
        
        if model_path is None:
            model_path = os.getenv(
                "MODEL_PATH",
                str(base_dir / "models" / "production" / "faunax_livestock_vision_v1.pt")
            )
            
        model_file = Path(model_path)
        if not model_file.is_absolute():
            model_file = base_dir / model_path

        logger.info(f"Initializing FAUNA-X Vision Model from: {model_file}")

        if not model_file.exists():
            logger.error(f"FATAL: Model weights not found at {model_file}")
            self._is_ready = False
            return False

        # Determine optimal compute device
        if torch.cuda.is_available():
            self._device = "cuda:0"
            gpu_name = torch.cuda.get_device_name(0)
        else:
            self._device = "cpu"
            gpu_name = "CPU (Fallback)"

        try:
            self._model = YOLO(str(model_file))
            
            # Read class mappings from model
            class_names = self._model.names if hasattr(self._model, "names") else {0: "fmd", 1: "healthy", 2: "lumpy_skin"}
            
            # Load metadata json if available
            meta_path = model_file.parent / "model_metadata.json"
            if meta_path.exists():
                with open(meta_path, "r", encoding="utf-8") as f:
                    self._metadata = json.load(f)
            else:
                self._metadata = {
                    "model_name": "FAUNA-X Livestock Visual Health Screening Model",
                    "version": "1.0.0",
                    "task": "classification",
                    "classes": list(class_names.values()),
                    "input_size": 224,
                    "confidence_threshold": 0.65
                }
            
            self._metadata["classes"] = list(class_names.values())
            self._metadata["task"] = "classification"
            self._metadata["device"] = gpu_name
            self._metadata["file_size_bytes"] = model_file.stat().st_size
            self._is_ready = True

            # Print Startup Banner
            print("\n" + "=" * 50)
            print("FAUNA-X AI VISION ENGINE")
            print("-" * 50)
            print(f"Model:      {self._metadata.get('model_name', 'FAUNA-X Vision')}")
            print(f"Version:    {self._metadata.get('version', '1.0.0')}")
            print(f"Task:       {self._metadata.get('task', 'classification').upper()}")
            print(f"Classes:    {', '.join(self._metadata['classes'])}")
            print(f"Input Size: {self._metadata.get('input_size', 224)}x{self._metadata.get('input_size', 224)}")
            print(f"Device:     {gpu_name}")
            print(f"Status:     READY")
            print("=" * 50 + "\n")

            return True
        except Exception as e:
            logger.error(f"Failed to load FAUNA-X model: {e}", exc_info=True)
            self._is_ready = False
            return False

    @property
    def model(self) -> YOLO:
        if not self._is_ready or self._model is None:
            raise RuntimeError("Vision model is not loaded or initialization failed.")
        return self._model

    @property
    def is_ready(self) -> bool:
        return self._is_ready

    @property
    def metadata(self) -> Dict[str, Any]:
        return self._metadata

    @property
    def device(self) -> str:
        return self._device

# Global singleton
vision_manager = VisionModelManager()
