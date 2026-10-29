#!/usr/bin/env python3
"""
FAUNA-X: Validation Script
Evaluates the trained model on the validation split.
"""
import sys
from pathlib import Path
from ultralytics import YOLO

def validate():
    root_dir = Path(__file__).resolve().parent.parent
    model_path = root_dir / "models" / "production" / "faunax_livestock_vision_v1.pt"
    data_path = root_dir / "data" / "processed" / "livestock_cls"

    if not model_path.exists():
        print(f"Error: Model not found at {model_path}. Train the model first.")
        sys.exit(1)

    print("=" * 55)
    print("FAUNA-X MODEL VALIDATION")
    print(f"Model: {model_path}")
    print("=" * 55)

    model = YOLO(str(model_path))
    metrics = model.val(data=str(data_path.resolve()), split="val", imgsz=224, device=0)
    
    print("\n✓ Validation Metrics:")
    print(f"Top-1 Accuracy: {metrics.top1:.4f}")
    print(f"Top-5 Accuracy: {metrics.top5:.4f}")
    return metrics

if __name__ == "__main__":
    validate()
