#!/usr/bin/env python3
"""
FAUNA-X: Diagnostic Error Analysis Script
Isolates false positives, false negatives, and low-confidence edge cases.
Saves categorized error samples to outputs/evaluation/errors/ for clinical review.
"""
import os
import sys
import shutil
import json
from pathlib import Path
from PIL import Image
from ultralytics import YOLO

LOW_CONFIDENCE_THRESHOLD = 0.65

def run_error_analysis(root_dir: Path):
    model_path = root_dir / "models" / "production" / "faunax_livestock_vision_v1.pt"
    test_dir = root_dir / "data" / "processed" / "livestock_cls" / "test"
    error_base = root_dir / "outputs" / "evaluation" / "errors"
    
    fp_dir = error_base / "false_positive"
    fn_dir = error_base / "false_negative"
    lc_dir = error_base / "low_confidence"

    # Reset error directories
    for d in [fp_dir, fn_dir, lc_dir]:
        if d.exists():
            shutil.rmtree(d)
        d.mkdir(parents=True, exist_ok=True)

    if not model_path.exists():
        print(f"Error: Model not found at {model_path}")
        sys.exit(1)

    print("=" * 60)
    print("FAUNA-X ERROR ANALYSIS & EDGE CASE AUDIT")
    print(f"Model: {model_path}")
    print(f"Confidence Threshold: {LOW_CONFIDENCE_THRESHOLD}")
    print("=" * 60)

    model = YOLO(str(model_path))
    class_names = sorted([d.name for d in test_dir.iterdir() if d.is_dir()])

    error_log = {
        "total_evaluated": 0,
        "total_misclassifications": 0,
        "false_positives": [],
        "false_negatives": [],
        "low_confidence_cases": []
    }

    for cls_name in class_names:
        cls_folder = test_dir / cls_name
        for img_path in list(cls_folder.glob("*.jpg")) + list(cls_folder.glob("*.png")):
            results = model.predict(source=str(img_path), imgsz=224, verbose=False, device=0)
            res = results[0]
            top1_idx = res.probs.top1
            top1_conf = float(res.probs.top1conf.cpu().numpy())
            pred_class = res.names[top1_idx]
            
            error_log["total_evaluated"] += 1
            is_misclassified = (cls_name != pred_class)

            # Analyze error patterns
            if is_misclassified:
                error_log["total_misclassifications"] += 1
                # If predicted disease when actually healthy -> False Positive
                if cls_name == "healthy" and pred_class != "healthy":
                    target_name = f"FP_True_{cls_name}_Pred_{pred_class}_{img_path.name}"
                    shutil.copy2(img_path, fp_dir / target_name)
                    error_log["false_positives"].append({
                        "image": img_path.name,
                        "true_class": cls_name,
                        "pred_class": pred_class,
                        "confidence": round(top1_conf, 4)
                    })
                # If true disease was missed as healthy or wrong disease -> False Negative
                else:
                    target_name = f"FN_True_{cls_name}_Pred_{pred_class}_{img_path.name}"
                    shutil.copy2(img_path, fn_dir / target_name)
                    error_log["false_negatives"].append({
                        "image": img_path.name,
                        "true_class": cls_name,
                        "pred_class": pred_class,
                        "confidence": round(top1_conf, 4)
                    })

            # Check low confidence (even if correctly classified)
            if top1_conf < LOW_CONFIDENCE_THRESHOLD:
                target_name = f"LC_Conf_{top1_conf:.2f}_True_{cls_name}_Pred_{pred_class}_{img_path.name}"
                shutil.copy2(img_path, lc_dir / target_name)
                error_log["low_confidence_cases"].append({
                    "image": img_path.name,
                    "true_class": cls_name,
                    "pred_class": pred_class,
                    "confidence": round(top1_conf, 4)
                })

    # Save error audit report
    summary_path = error_base / "error_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(error_log, f, indent=2)

    print(f"\n✓ Error Analysis Complete:")
    print(f"  - Total Evaluated:         {error_log['total_evaluated']}")
    print(f"  - Total Misclassifications: {error_log['total_misclassifications']}")
    print(f"  - False Positives:         {len(error_log['false_positives'])} saved to {fp_dir.relative_to(root_dir)}")
    print(f"  - False Negatives:         {len(error_log['false_negatives'])} saved to {fn_dir.relative_to(root_dir)}")
    print(f"  - Low Confidence Samples:  {len(error_log['low_confidence_cases'])} saved to {lc_dir.relative_to(root_dir)}")

if __name__ == "__main__":
    root_dir = Path(__file__).resolve().parent.parent
    run_error_analysis(root_dir)
