#!/usr/bin/env python3
"""
FAUNA-X: Test Evaluation Script
Executes formal evaluation on the untouched test split and external validation set.
"""
import sys
from pathlib import Path

# Add root directory to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import pandas as pd
from ultralytics import YOLO
from evaluation.metrics import evaluate_test_set

def evaluate_external_test(root_dir: Path):
    model_path = root_dir / "models" / "production" / "faunax_livestock_vision_v1.pt"
    ext_dir = root_dir / "data" / "external_test"
    eval_dir = root_dir / "outputs" / "evaluation"
    eval_dir.mkdir(parents=True, exist_ok=True)

    if not ext_dir.exists():
        print(f"External test directory {ext_dir} not found.")
        return

    print("\n" + "=" * 60)
    print("FAUNA-X EXTERNAL HOLDOUT EVALUATION")
    print("=" * 60)

    model = YOLO(str(model_path))
    records = []

    for img_path in ext_dir.rglob("*.jpg"):
        true_class = img_path.parent.name
        results = model.predict(source=str(img_path), imgsz=224, verbose=False, device=0)
        res = results[0]
        top1_idx = res.probs.top1
        top1_conf = float(res.probs.top1conf.cpu().numpy())
        pred_class = res.names[top1_idx]

        records.append({
            "image": img_path.name,
            "true_class": true_class,
            "predicted_class": pred_class,
            "confidence": round(top1_conf, 4),
            "correct": (true_class == pred_class)
        })

    if records:
        df = pd.DataFrame(records)
        ext_csv_path = eval_dir / "external_test_results.csv"
        df.to_csv(ext_csv_path, index=False)
        acc = df['correct'].mean()
        print(f"External Holdout Accuracy: {acc*100:.2f}% ({df['correct'].sum()}/{len(df)})")
        print(f"[OK] Saved external results to: {ext_csv_path}")

def main():
    root_dir = Path(__file__).resolve().parent.parent
    # 1. Held-out test evaluation
    evaluate_test_set(root_dir)
    # 2. External validation
    evaluate_external_test(root_dir)

if __name__ == "__main__":
    main()
