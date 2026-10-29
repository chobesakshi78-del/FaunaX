#!/usr/bin/env python3
"""
FAUNA-X: Comprehensive Evaluation & Metrics Generator
Computes Top-1 accuracy, Precision, Recall, F1 (per-class and macro),
Confusion Matrix plot, and detailed CSV/JSON reports on the held-out test set.
"""
import sys
import json
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support
from ultralytics import YOLO

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

def evaluate_test_set(root_dir: Path):
    model_path = root_dir / "models" / "production" / "faunax_livestock_vision_v1.pt"
    test_dir = root_dir / "data" / "processed" / "livestock_cls" / "test"
    eval_dir = root_dir / "outputs" / "evaluation"
    eval_dir.mkdir(parents=True, exist_ok=True)

    if not model_path.exists():
        print(f"Error: Model not found at {model_path}")
        sys.exit(1)

    print("=" * 60)
    print("FAUNA-X FORMAL TEST SET EVALUATION")
    print(f"Model:    {model_path}")
    print(f"Test Set: {test_dir}")
    print("=" * 60)

    model = YOLO(str(model_path))
    class_names = sorted([d.name for d in test_dir.iterdir() if d.is_dir()])
    
    y_true = []
    y_pred = []
    y_conf = []
    file_records = []

    for cls_name in class_names:
        cls_folder = test_dir / cls_name
        for img_file in list(cls_folder.glob("*.jpg")) + list(cls_folder.glob("*.png")):
            results = model.predict(source=str(img_file), imgsz=224, verbose=False, device=0)
            res = results[0]
            top1_idx = res.probs.top1
            top1_conf = float(res.probs.top1conf.cpu().numpy())
            pred_class = res.names[top1_idx]

            y_true.append(cls_name)
            y_pred.append(pred_class)
            y_conf.append(top1_conf)

            file_records.append({
                "image": img_file.name,
                "true_class": cls_name,
                "predicted_class": pred_class,
                "confidence": round(top1_conf, 4),
                "correct": (cls_name == pred_class)
            })

    # 1. Compute Metrics
    report_dict = classification_report(y_true, y_pred, labels=class_names, output_dict=True, zero_division=0)
    
    # Save Classification Report CSV
    report_df = pd.DataFrame(report_dict).transpose()
    report_csv_path = eval_dir / "classification_report.csv"
    report_df.to_csv(report_csv_path)
    print(f"[OK] Saved classification report to: {report_csv_path}")

    # 2. Confusion Matrix Plot
    cm = confusion_matrix(y_true, y_pred, labels=class_names)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=class_names, yticklabels=class_names)
    plt.title("FAUNA-X Livestock Screening Confusion Matrix (Test Set)")
    plt.xlabel("Predicted Class")
    plt.ylabel("True Clinical Label")
    plt.tight_layout()
    cm_plot_path = eval_dir / "confusion_matrix.png"
    plt.savefig(cm_plot_path, dpi=300)
    plt.close()
    print(f"[OK] Saved confusion matrix plot to: {cm_plot_path}")

    # 3. Overall Summary JSON
    p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(y_true, y_pred, average="macro", zero_division=0)
    p_weighted, r_weighted, f1_weighted, _ = precision_recall_fscore_support(y_true, y_pred, average="weighted", zero_division=0)
    acc = np.mean(np.array(y_true) == np.array(y_pred))

    metrics_summary = {
        "model_version": "v1.0.0",
        "total_test_samples": len(y_true),
        "test_top1_accuracy": round(float(acc), 4),
        "macro_precision": round(float(p_macro), 4),
        "macro_recall": round(float(r_macro), 4),
        "macro_f1": round(float(f1_macro), 4),
        "weighted_f1": round(float(f1_weighted), 4),
        "per_class_metrics": {k: v for k, v in report_dict.items() if k in class_names},
        "disclaimer": "AI-assisted screening metrics. Not clinical diagnosis."
    }

    metrics_json_path = eval_dir / "metrics.json"
    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(metrics_summary, f, indent=2)
    print(f"[OK] Saved metrics JSON to: {metrics_json_path}")

    print("\n---------------- TEST RESULTS SUMMARY ----------------")
    print(f"Test Accuracy: {acc*100:.2f}%")
    print(f"Macro F1 Score: {f1_macro:.4f}")
    print(f"Weighted F1:   {f1_weighted:.4f}")
    print("------------------------------------------------------")
    return metrics_summary

if __name__ == "__main__":
    root_dir = Path(__file__).resolve().parent.parent
    evaluate_test_set(root_dir)
