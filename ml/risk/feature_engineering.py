"""
FAUNA-X: Feature Fusion & Engineering Pipeline
Combines visual features, NLP symptoms, animal demographics, vaccination history,
and spatial-temporal context into a standardized numerical feature vector.
"""
from typing import Dict, Any, List
import numpy as np

# Standardized Feature Schema Definition (v1.0)
FEATURE_NAMES = [
    "species_cattle",
    "species_buffalo",
    "species_goat",
    "species_sheep",
    "species_other",
    "age_months_norm",
    "herd_size_norm",
    "is_vaccinated",
    "duration_days_norm",
    "sym_skin_nodules",
    "sym_fever",
    "sym_oral_ulcers",
    "sym_foot_lesions",
    "sym_appetite_loss",
    "sym_milk_drop",
    "sym_respiratory_distress",
    "sym_hemorrhagic_signs",
    "visual_lesion_detected",
    "visual_confidence_score",
    "nearby_cases_5km_norm",
    "district_case_growth_rate",
    "temperature_anomaly",
    "rainfall_mm_norm"
]

def extract_feature_vector(
    case_data: Dict[str, Any],
    visual_findings: Dict[str, Any] = None,
    nlp_symptoms: Dict[str, Any] = None,
    spatial_context: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Constructs a dictionary of named features and a normalized numpy array.
    """
    visual_findings = visual_findings or {}
    nlp_symptoms = nlp_symptoms or {}
    spatial_context = spatial_context or {}
    
    species = (case_data.get("species") or "Cattle").lower()
    age_months = float(case_data.get("age_months") or 24.0)
    herd_size = float(case_data.get("affected_count") or case_data.get("number_affected") or 1.0)
    is_vaccinated = 1.0 if case_data.get("is_vaccinated") or case_data.get("vaccination_history") else 0.0
    duration_days = float(case_data.get("duration_days") or 3.0)

    # Symptoms flags (from structured input, NLP, or symptom list)
    symptoms_list = [s.lower() for s in case_data.get("symptoms", [])]
    extracted_flags = nlp_symptoms.get("symptom_flags", {})
    
    def has_symptom(keywords: List[str], flag_key: str) -> float:
        if flag_key in extracted_flags and extracted_flags[flag_key]:
            return 1.0
        for s in symptoms_list:
            if any(k in s for k in keywords):
                return 1.0
        return 0.0

    sym_nodules = has_symptom(["nodule", "lump", "skin", "gaanth"], "skin_nodules")
    sym_fever = has_symptom(["fever", "bukhar", "temperature", "taap"], "fever")
    sym_oral = has_symptom(["mouth", "oral", "blister", "drool", "saliva", "chhale"], "oral_ulcers")
    sym_foot = has_symptom(["foot", "hoof", "lame", "limping", "khur"], "foot_lesions")
    sym_appetite = has_symptom(["appetite", "eating", "off feed", "khana"], "appetite_loss")
    sym_milk = has_symptom(["milk", "doodh"], "milk_drop")
    sym_resp = has_symptom(["breath", "cough", "respiratory", "saans"], "respiratory_distress")
    sym_hemo = has_symptom(["neck", "swelling", "throat", "galghotu", "sujan"], "hemorrhagic_signs")

    # Visual indicators
    vis_detected = 1.0 if visual_findings.get("prediction_class") in ["fmd", "lumpy_skin"] or visual_findings.get("visual_findings") else 0.0
    vis_conf = float(visual_findings.get("confidence") or visual_findings.get("quality_score") or 0.0)

    # Spatial context
    nearby_cases = float(spatial_context.get("nearby_cases_5km", 2))
    growth_rate = float(spatial_context.get("growth_rate", 0.05))
    temp_anomaly = float(spatial_context.get("temp_anomaly", 1.2))
    rainfall = float(spatial_context.get("rainfall_mm", 45.0))

    feature_dict = {
        "species_cattle": 1.0 if "cattle" in species or "cow" in species else 0.0,
        "species_buffalo": 1.0 if "buffalo" in species else 0.0,
        "species_goat": 1.0 if "goat" in species else 0.0,
        "species_sheep": 1.0 if "sheep" in species else 0.0,
        "species_other": 0.0 if any(k in species for k in ["cattle", "cow", "buffalo", "goat", "sheep"]) else 1.0,
        "age_months_norm": min(age_months / 120.0, 1.0),
        "herd_size_norm": min(herd_size / 50.0, 1.0),
        "is_vaccinated": is_vaccinated,
        "duration_days_norm": min(duration_days / 30.0, 1.0),
        "sym_skin_nodules": sym_nodules,
        "sym_fever": sym_fever,
        "sym_oral_ulcers": sym_oral,
        "sym_foot_lesions": sym_foot,
        "sym_appetite_loss": sym_appetite,
        "sym_milk_drop": sym_milk,
        "sym_respiratory_distress": sym_resp,
        "sym_hemorrhagic_signs": sym_hemo,
        "visual_lesion_detected": vis_detected,
        "visual_confidence_score": vis_conf,
        "nearby_cases_5km_norm": min(nearby_cases / 20.0, 1.0),
        "district_case_growth_rate": np.clip(growth_rate, -1.0, 2.0),
        "temperature_anomaly": np.clip(temp_anomaly / 5.0, -1.0, 1.0),
        "rainfall_mm_norm": min(rainfall / 200.0, 1.0)
    }

    raw_values = [feature_dict[name] for name in FEATURE_NAMES]

    return {
        "features": feature_dict,
        "feature_names": FEATURE_NAMES,
        "vector": raw_values,
        "schema_version": "1.0.0"
    }
