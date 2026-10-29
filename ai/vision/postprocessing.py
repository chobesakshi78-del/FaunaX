"""
FAUNA-X AI: Vision Post-Processing Engine
Maps raw model probabilities to visual indicators, human-readable names,
clinical disclaimers, and structured downstream schemas.
"""
from typing import Dict, Any, List

DISEASE_METADATA = {
    "lumpy_skin": {
        "display_name": "Lumpy Skin Disease (LSD)",
        "indicator_label": "cutaneous_nodules_and_lesions",
        "indicator_name": "Cutaneous Nodules & Skin Lesions",
        "description": "Circumscribed firm nodules, localized skin swelling, or ulcerated scabs on hide",
        "risk_level": "ELEVATED_RISK"
    },
    "fmd": {
        "display_name": "Foot-and-Mouth Disease (FMD)",
        "indicator_label": "vesicular_epithelial_lesions",
        "indicator_name": "Vesicular Mucosal Lesions",
        "description": "Vesicular erosions on oral mucosa, tongue, muzzle, dental pad, or interdigital cleft",
        "risk_level": "ELEVATED_RISK"
    },
    "healthy": {
        "display_name": "Healthy / No Prominent Abnormality",
        "indicator_label": "normal_morphology",
        "indicator_name": "Normal Integumentary Morphology",
        "description": "Clear cutaneous surface, intact epithelium, and normal morphological texture",
        "risk_level": "LOW_RISK"
    }
}

CONFIDENCE_THRESHOLD = 0.65

def postprocess_classification_output(
    class_probabilities: Dict[str, float],
    quality_audit: Dict[str, Any],
    animal_species: str = "cattle"
) -> Dict[str, Any]:
    """Formats raw class probabilities into structured clinical screening output."""
    # Sort classes by descending probability
    sorted_classes = sorted(class_probabilities.items(), key=lambda x: x[1], reverse=True)
    top_class, top_conf = sorted_classes[0]

    meta = DISEASE_METADATA.get(top_class, {
        "display_name": top_class.replace("_", " ").title(),
        "indicator_label": f"observed_{top_class}_pattern",
        "indicator_name": top_class.replace("_", " ").title(),
        "description": "Observed visual pattern matching trained class",
        "risk_level": "MODERATE"
    })

    is_low_confidence = top_conf < CONFIDENCE_THRESHOLD

    # Determine clinical screening status text
    if top_class == "healthy":
        status_text = "No prominent visual abnormality detected in preliminary screening."
        screening_flag = False
    elif is_low_confidence:
        status_text = "Low-confidence visual indicator detected. Image characteristics require manual assessment."
        screening_flag = True
    else:
        status_text = f"Potential visual indicator detected: {meta['display_name']}."
        screening_flag = True

    # Alternatives list (all classes except top 1)
    alternatives: List[Dict[str, Any]] = []
    for cls_name, prob in sorted_classes[1:]:
        cls_meta = DISEASE_METADATA.get(cls_name, {"display_name": cls_name.replace("_", " ").title()})
        alternatives.append({
            "class": cls_name,
            "display_name": cls_meta["display_name"],
            "confidence": round(float(prob), 4),
            "percentage": round(float(prob) * 100, 1)
        })

    # Visual indicators list
    visual_indicators = []
    if top_class != "healthy" or not is_low_confidence:
        visual_indicators.append({
            "label": meta["indicator_label"],
            "name": meta["indicator_name"],
            "description": meta["description"],
            "confidence": round(float(top_conf), 4),
            "detected": screening_flag
        })

    return {
        "model": {
            "name": "FAUNA-X Livestock Vision Core",
            "version": "1.0.0",
            "task": "classification"
        },
        "animal_species": animal_species,
        "prediction": {
            "class": top_class,
            "display_name": meta["display_name"],
            "confidence": round(float(top_conf), 4),
            "percentage": round(float(top_conf) * 100, 1),
            "is_low_confidence": is_low_confidence,
            "status": status_text,
            "flagged_for_review": screening_flag
        },
        "alternatives": alternatives,
        "visual_indicators": visual_indicators,
        "all_probabilities": {k: round(float(v), 4) for k, v in class_probabilities.items()},
        "image_quality": quality_audit,
        "requires_veterinary_verification": True,
        "clinical_disclaimer": "AI-assisted screening only. This result does NOT replace clinical veterinary diagnosis."
    }
