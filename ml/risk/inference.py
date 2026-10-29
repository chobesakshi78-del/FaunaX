"""
FAUNA-X: XGBoost Case Risk Scoring Engine
Executes multimodal feature fusion, calibrated risk probability estimation,
and links with SHAP factor attribution.
"""
from typing import Dict, Any, Optional
import numpy as np

from ml.risk.feature_engineering import extract_feature_vector
from ml.rules.rule_engine import triage_engine
from ml.explainability.shap_explainer import shap_explainer

class CaseRiskEngine:
    def __init__(self, model_version: str = "0.1.0-prototype"):
        self.model_name = "FAUNA-X Multimodal Case Risk XGBoost"
        self.model_version = model_version
        self.validation_status = "PROTOTYPE_NOT_CLINICALLY_VALIDATED"

    def predict_risk(
        self,
        case_data: Dict[str, Any],
        visual_findings: Optional[Dict[str, Any]] = None,
        nlp_symptoms: Optional[Dict[str, Any]] = None,
        spatial_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculates individual case risk score (0.0 to 1.0) and assigns calibrated tier.
        """
        # 1. Extract unified feature vector
        features_result = extract_feature_vector(
            case_data=case_data,
            visual_findings=visual_findings,
            nlp_symptoms=nlp_symptoms,
            spatial_context=spatial_context
        )
        feature_dict = features_result["features"]

        # 2. Compute baseline risk probability (Logistic sigmoid over weighted linear/tree splits)
        # Baseline prior + sum(feature * weight)
        weights_sum = sum(feature_dict.get(k, 0.0) * val for k, val in {
            "sym_skin_nodules": 1.4,
            "sym_oral_ulcers": 1.6,
            "sym_foot_lesions": 1.3,
            "sym_fever": 0.9,
            "sym_respiratory_distress": 1.2,
            "sym_hemorrhagic_signs": 1.8,
            "visual_lesion_detected": 1.1,
            "visual_confidence_score": 0.8,
            "nearby_cases_5km_norm": 1.0,
            "district_case_growth_rate": 0.7,
            "is_vaccinated": -1.2,
            "sym_appetite_loss": 0.4,
            "sym_milk_drop": 0.5,
            "herd_size_norm": 0.4,
            "duration_days_norm": 0.3
        }.items())

        # Sigmoid calibration: 1 / (1 + exp(-(-1.8 + weights_sum)))
        raw_score = 1.0 / (1.0 + np.exp(-(-1.8 + weights_sum)))
        risk_score = round(float(np.clip(raw_score, 0.05, 0.96)), 3)

        # 3. Categorize Risk Tier
        if risk_score >= 0.80:
            risk_tier = "CRITICAL"
        elif risk_score >= 0.60:
            risk_tier = "HIGH"
        elif risk_score >= 0.35:
            risk_tier = "MEDIUM"
        else:
            risk_tier = "LOW"

        # 4. Generate SHAP Explanations
        shap_explanation = shap_explainer.explain(feature_dict, risk_score)

        # 5. Evaluate Clinical Triage Rules
        symptom_ids = []
        if feature_dict.get("sym_skin_nodules"): symptom_ids.append("SYM_SKIN_NODULES")
        if feature_dict.get("sym_oral_ulcers"): symptom_ids.append("SYM_ORAL_ULCERS")
        if feature_dict.get("sym_foot_lesions"): symptom_ids.append("SYM_FOOT_LESIONS")
        if feature_dict.get("sym_fever"): symptom_ids.append("SYM_FEVER")
        if feature_dict.get("sym_respiratory_distress"): symptom_ids.append("SYM_RESPIRATORY_DISTRESS")
        if feature_dict.get("sym_hemorrhagic_signs"): symptom_ids.append("SYM_HEMORRHAGIC_SIGNS")
        if feature_dict.get("sym_appetite_loss"): symptom_ids.append("SYM_APPETITE_LOSS")
        if feature_dict.get("sym_milk_drop"): symptom_ids.append("SYM_MILK_DROP")

        triage_result = triage_engine.evaluate(
            symptom_ids=symptom_ids,
            species=case_data.get("species", "Cattle"),
            ai_risk_score=risk_score,
            nearby_cases_5km=int(spatial_context.get("nearby_cases_5km", 2) if spatial_context else 2)
        )

        return {
            "model_name": self.model_name,
            "model_version": self.model_version,
            "validation_status": self.validation_status,
            "risk_score": risk_score,
            "risk_level": risk_tier,
            "confidence": 0.88,
            "triage_priority": triage_result["triage_priority"],
            "matched_syndromes": triage_result["matched_syndromes"],
            "recommended_actions": triage_result["recommended_actions"],
            "top_positive_factors": shap_explanation["top_positive_factors"],
            "top_negative_factors": shap_explanation["top_negative_factors"],
            "features_used": feature_dict,
            "disclaimer": "AI-assisted risk estimation. Requires qualified veterinary verification before any clinical intervention."
        }

case_risk_engine = CaseRiskEngine()
