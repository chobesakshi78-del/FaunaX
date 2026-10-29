#!/usr/bin/env python3
"""
FAUNA-X: Model Training Script
Trains YOLO Visual Screening model with GPU acceleration, early stopping,
experiment logging, and production checkpoint export.
"""
import os
import sys
import yaml
import json
import shutil
import datetime
from pathlib import Path
import torch
from ultralytics import YOLO

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

def train():
    root_dir = Path(__file__).resolve().parent.parent
    config_file = root_dir / "training" / "config.yaml"
    
    with open(config_file, "r") as f:
        config = yaml.safe_load(f)

    print("=" * 60)
    print("FAUNA-X AI TRAINING PIPELINE")
    print(f"Timestamp: {datetime.datetime.now().isoformat()}")
    print("=" * 60)

    # 1. Verify GPU Setup
    if not torch.cuda.is_available():
        print("! FATAL ERROR: CUDA is not available. GPU acceleration is required for training.")
        print("Do not train silently on CPU. Verify NVIDIA drivers and PyTorch CUDA installation.")
        sys.exit(1)

    gpu_name = torch.cuda.get_device_name(0)
    vram_mb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 2)
    print(f"[OK] Active GPU: {gpu_name} ({vram_mb:.0f} MiB VRAM)")
    print(f"[OK] PyTorch Version: {torch.__version__}")
    print(f"[OK] CUDA Version:    {torch.version.cuda}")

    # 2. Verify Dataset Directory
    data_path = root_dir / config["data_path"]
    if not data_path.exists():
        print(f"! Error: Dataset directory '{data_path}' not found. Run dataset pipeline first.")
        sys.exit(1)

    # 3. Setup Experiment Run Name and Output Paths
    timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    run_name = f"{config['experiment_name']}_{timestamp_str}"
    output_dir = root_dir / "outputs" / "training" / run_name
    checkpoints_dir = root_dir / "models" / "checkpoints" / run_name
    output_dir.parent.mkdir(parents=True, exist_ok=True)
    checkpoints_dir.mkdir(parents=True, exist_ok=True)

    print(f"[OK] Run Identifier: {run_name}")
    print(f"[OK] Model Backbone: {config['model']}")
    print(f"[OK] Output Directory: {output_dir}")

    # 4. Initialize YOLO Model
    model = YOLO(config["model"])

    # 5. Execute Training
    print("\nStarting model training...")
    results = model.train(
        data=str(data_path.resolve()),
        epochs=config["epochs"],
        patience=config["patience"],
        batch=config["batch_size"],
        imgsz=config["imgsz"],
        lr0=config["lr0"],
        lrf=config["lrf"],
        optimizer=config["optimizer"],
        weight_decay=config["weight_decay"],
        device=config["device"],
        workers=config["workers"],
        seed=config["seed"],
        amp=config["amp"],
        project=str(output_dir.parent.resolve()),
        name=run_name,
        exist_ok=True,
        # Augmentations
        hsv_h=config["augmentations"]["hsv_h"],
        hsv_s=config["augmentations"]["hsv_s"],
        hsv_v=config["augmentations"]["hsv_v"],
        degrees=config["augmentations"]["degrees"],
        translate=config["augmentations"]["translate"],
        scale=config["augmentations"]["scale"],
        fliplr=config["augmentations"]["fliplr"],
        flipud=config["augmentations"]["flipud"],
        erasing=config["augmentations"]["erasing"],
        verbose=True
    )

    print("\n[OK] Training cycle finished.")

    # 6. Locate Best and Last Weights
    best_pt = output_dir / "weights" / "best.pt"
    last_pt = output_dir / "weights" / "last.pt"

    if best_pt.exists():
        shutil.copy2(best_pt, checkpoints_dir / "best.pt")
        print(f"[OK] Saved best checkpoint: {checkpoints_dir / 'best.pt'}")
    if last_pt.exists():
        shutil.copy2(last_pt, checkpoints_dir / "last.pt")

    # 7. Production Export
    prod_dir = root_dir / "models" / "production"
    prod_dir.mkdir(parents=True, exist_ok=True)
    prod_model_path = prod_dir / "faunax_livestock_vision_v1.pt"
    
    if best_pt.exists():
        shutil.copy2(best_pt, prod_model_path)
        print(f"[OK] Production model exported to: {prod_model_path}")

    # 8. Record Training Metadata
    metadata = {
        "model_name": "FAUNA-X Livestock Visual Health Screening Model",
        "version": "1.0.0",
        "run_id": run_name,
        "date": datetime.datetime.now().isoformat(),
        "python_version": sys.version.split()[0],
        "pytorch_version": torch.__version__,
        "cuda_version": torch.version.cuda,
        "gpu": gpu_name,
        "base_model": config["model"],
        "dataset_path": str(config["data_path"]),
        "parameters": config,
        "best_weights": str(prod_model_path.relative_to(root_dir)),
        "disclaimer": config["disclaimer"]
    }

    metadata_path = root_dir / "outputs" / "reports" / "training_metadata.json"
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    with open(prod_dir / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"[OK] Saved metadata to: {metadata_path}")
    print("=" * 60)

if __name__ == "__main__":
    train()
