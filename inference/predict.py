#!/usr/bin/env python3
"""
FAUNA-X: Single-Image Visual Screening Inference Engine
Performs preliminary AI-assisted health screening on livestock imagery.
Outputs clinical screening status and standardized schema for future risk engines.
"""
import sys
import argparse
import json
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from PIL import Image
import torch
from ultralytics import YOLO

DISEASE_METADATA = {
    "lumpy_skin": {
        "display_name": "Lumpy Skin Disease (LSD)",
        "indicator_label": "cutaneous_nodules_and_lesions",
        "description": "Circumscribed cutaneous nodules, localized skin swelling, or ulcerated scabs"
    },
    "fmd": {
        "display_name": "Foot-and-Mouth Disease (FMD)",
        "indicator_label": "vesicular_epithelial_lesions",
        "description": "Vesicular erosions on oral mucosa, tongue, dental pad, or interdigital cleft"
    },
    "healthy": {
        "display_name": "Healthy / No Visible Abnormality",
        "indicator_label": "normal_morphology",
        "description": "Clear cutaneous surface, intact epithelium, and normal posture"
    }
}

CONFIDENCE_THRESHOLD = 0.65

def predict_single_image(image_path: str, model_path: str = None, json_output: bool = False):
    if model_path is None:
        model_path = root_dir / "models" / "production" / "faunax_livestock_vision_v1.pt"
    else:
        model_path = Path(model_path)

    img_p = Path(image_path)
    if not img_p.exists():
        print(f"Error: Image file '{image_path}' does not exist.", file=sys.stderr)
        sys.exit(1)

    if not model_path.exists():
        print(f"Error: Model weights not found at '{model_path}'.", file=sys.stderr)
        sys.exit(1)

    device = 0 if torch.cuda.is_available() else "cpu"
    model = YOLO(str(model_path))

    results = model.predict(source=str(img_p), imgsz=224, verbose=False, device=device)
    res = results[0]
    
    top1_idx = res.probs.top1
    top1_conf = float(res.probs.top1conf.cpu().numpy())
    raw_class = res.names[top1_idx]

    meta = DISEASE_METADATA.get(raw_class, {
        "display_name": raw_class.replace("_", " ").title(),
        "indicator_label": "observed_visual_pattern",
        "description": "Pattern matching detected class"
    })

    if raw_class == "healthy":
        status_text = "No prominent visual abnormality detected in preliminary screening."
    elif top1_conf >= CONFIDENCE_THRESHOLD:
        status_text = "Potential visual indicator detected."
    else:
        status_text = "Inconclusive / Low confidence visual indicator detected."

    future_contract = {
        "model": "faunax-livestock-vision",
        "version": "1.0.0",
        "animal_species": "cattle",
        "image_file": img_p.name,
        "visual_indicators": [
            {
                "label": meta["indicator_label"],
                "description": meta["description"],
                "confidence": round(top1_conf, 4)
            }
        ],
        "screening_result": {
            "class": raw_class,
            "display_name": meta["display_name"],
            "confidence": round(top1_conf, 4),
            "status": status_text
        },
        "all_probabilities": {
            res.names[i]: round(float(res.probs.data[i].cpu().numpy()), 4)
            for i in range(len(res.names))
        },
        "requires_veterinary_verification": True,
        "clinical_disclaimer": "AI-assisted preliminary screening. This output is NOT a veterinary diagnosis."
    }

    if json_output:
        print(json.dumps(future_contract, indent=2))
    else:
        print("\n" + "=" * 45)
        print("FAUNA-X VISUAL SCREENING")
        print("=" * 45)
        print(f"Image:       {img_p.name}")
        print(f"Model:       FAUNA-X Livestock Visual Health Screening (v1.0.0)")
        print(f"Prediction:  {meta['display_name']}")
        print(f"Confidence:  {top1_conf:.2f} ({top1_conf*100:.1f}%)")
        print(f"Status:      {status_text}")
        print("-" * 45)
        print("CRITICAL NOTICE:")
        print("Veterinary verification required.")
        print("=" * 45 + "\n")

    return future_contract

def main():
    parser = argparse.ArgumentParser(description="FAUNA-X AI-Assisted Livestock Visual Health Screening")
    parser.add_argument("--image", required=True, help="Path to input livestock photograph (JPG/PNG)")
    parser.add_argument("--model", default=None, help="Path to custom model weights (.pt)")
    parser.add_argument("--json", action="store_true", help="Output standardized JSON schema for downstream engines")
    args = parser.parse_args()

    predict_single_image(args.image, args.model, args.json)

if __name__ == "__main__":
    main()
