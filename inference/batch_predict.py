#!/usr/bin/env python3
"""
FAUNA-X: Batch Inference Engine
Processes directory of livestock images, generates CSV audit log, and flags suspect cases.
"""
import sys
import argparse
import datetime
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import pandas as pd
import torch
from ultralytics import YOLO

def batch_predict(input_path: str, output_path: str = None, model_path: str = None):
    if model_path is None:
        model_path = root_dir / "models" / "production" / "faunax_livestock_vision_v1.pt"
    else:
        model_path = Path(model_path)

    input_dir = Path(input_path)
    if output_path is None:
        out_dir = root_dir / "outputs" / "predictions"
    else:
        out_dir = Path(output_path)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not input_dir.exists():
        print(f"Error: Input directory '{input_dir}' not found.", file=sys.stderr)
        sys.exit(1)

    if not model_path.exists():
        print(f"Error: Model not found at '{model_path}'.", file=sys.stderr)
        sys.exit(1)

    device = 0 if torch.cuda.is_available() else "cpu"
    model = YOLO(str(model_path))

    supported_exts = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
    image_files = [f for f in input_dir.rglob("*") if f.is_file() and f.suffix.lower() in supported_exts]

    print("=" * 60)
    print("FAUNA-X BATCH VISUAL SCREENING")
    print(f"Input Directory:  {input_dir} ({len(image_files)} images)")
    print(f"Output Directory: {out_dir}")
    print(f"Model:            {model_path.name}")
    print("=" * 60)

    records = []
    timestamp = datetime.datetime.now().isoformat()

    for img_file in image_files:
        results = model.predict(source=str(img_file), imgsz=224, verbose=False, device=device)
        res = results[0]
        top1_idx = res.probs.top1
        top1_conf = float(res.probs.top1conf.cpu().numpy())
        pred_class = res.names[top1_idx]

        records.append({
            "image": str(img_file.name),
            "relative_path": str(img_file.relative_to(input_dir)),
            "prediction": pred_class,
            "confidence": round(top1_conf, 4),
            "model_version": "1.0.0",
            "timestamp": timestamp,
            "screening_status": "Flagged - Potential Indicator" if pred_class != "healthy" else "Negative",
            "veterinary_verification_required": True
        })

    df = pd.DataFrame(records)
    csv_file = out_dir / "predictions.csv"
    df.to_csv(csv_file, index=False)

    print(f"\n[OK] Batch screening complete:")
    print(f"  - Total Images Processed: {len(records)}")
    print(f"  - Results saved to:      {csv_file}")
    print("  - Notice: All flagged cases require on-site veterinary verification.")
    return df

def main():
    parser = argparse.ArgumentParser(description="FAUNA-X Batch Visual Health Screening")
    parser.add_argument("--input", required=True, help="Input directory containing livestock images")
    parser.add_argument("--output", default=None, help="Output directory for predictions.csv")
    parser.add_argument("--model", default=None, help="Path to model weights (.pt)")
    args = parser.parse_args()

    batch_predict(args.input, args.output, args.model)

if __name__ == "__main__":
    main()
