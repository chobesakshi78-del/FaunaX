"""
FAUNA-X: Unit and Integration Tests for Multimodal ML Pipelines
Tests NLP symptom extraction, Triage rule engine, XGBoost Risk scoring,
TreeSHAP explainability, DBSCAN clustering, and Outbreak forecasting.
"""
import pytest
from ml.nlp.symptom_extraction import symptom_extractor
from ml.rules.rule_engine import triage_engine
from ml.risk.inference import case_risk_engine
from ml.explainability.shap_explainer import shap_explainer
from ml.clustering.dbscan import cluster_analyzer
from ml.forecasting.forecast_engine import forecast_engine

def test_nlp_symptom_extraction():
    """Verify dictionary-backed token matching extracts standardized symptoms."""
    text = "The cow has high fever, skin nodules on flank, and stopped eating feed."
    res = symptom_extractor.extract_from_text(text, species="Cattle")
    
    assert res["symptom_count"] >= 2
    assert "fever" in res["symptom_flags"] or "skin_nodules" in res["symptom_flags"]
    assert res["severity_score_sum"] > 0.0
    assert isinstance(res["has_high_priority_trigger"], bool)

def test_triage_rule_engine_critical_trigger():
    """Verify critical syndromic combination triggers CRITICAL priority."""
    triage_res = triage_engine.evaluate(
        symptom_ids=["SYM_ORAL_ULCERS", "SYM_FOOT_LESIONS"],
        species="Cattle",
        ai_risk_score=0.88,
        nearby_cases_5km=4
    )
    assert triage_res["triage_priority"] == "CRITICAL"
    assert len(triage_res["matched_syndromes"]) > 0
    assert "Foot & Mouth" in triage_res["matched_syndromes"][0]
    assert triage_res["is_emergency_escalation"] is True

def test_case_risk_engine_and_shap():
    """Verify calibrated multimodal risk scoring and SHAP waterfall generation."""
    case_data = {
        "species": "Cattle",
        "age_months": 36,
        "affected_count": 2,
        "duration_days": 3,
        "symptoms": ["Skin lesions", "Fever"]
    }
    visual_findings = {
        "prediction_class": "lumpy_skin",
        "confidence": 0.89,
        "quality_score": 0.95
    }
    spatial_context = {
        "nearby_cases_5km": 3,
        "growth_rate": 0.20
    }
    
    risk_res = case_risk_engine.predict_risk(
        case_data=case_data,
        visual_findings=visual_findings,
        spatial_context=spatial_context
    )
    
    assert 0.0 <= risk_res["risk_score"] <= 1.0
    assert risk_res["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert risk_res["validation_status"] == "PROTOTYPE_NOT_CLINICALLY_VALIDATED"
    assert len(risk_res["top_positive_factors"]) > 0
    assert "veterinary" in risk_res["disclaimer"].lower() or "risk" in risk_res["disclaimer"].lower()

def test_dbscan_cluster_detection():
    """Verify spatio-temporal clustering over coordinates."""
    sample_cases = [
        {"id": 1, "latitude": 18.5204, "longitude": 73.8567, "species": "Cattle", "ai_risk_score": 0.85},
        {"id": 2, "latitude": 18.5300, "longitude": 73.8650, "species": "Cattle", "ai_risk_score": 0.80},
        {"id": 3, "latitude": 18.5250, "longitude": 73.8600, "species": "Cattle", "ai_risk_score": 0.78},
        {"id": 4, "latitude": 28.6139, "longitude": 77.2090, "species": "Buffalo", "ai_risk_score": 0.20}
    ]
    
    cluster_res = cluster_analyzer.detect_clusters(sample_cases)
    assert "clusters" in cluster_res
    assert cluster_res["active_cluster_count"] >= 1
    assert cluster_res["clusters"][0]["case_count"] >= 3
    assert cluster_res["clusters"][0]["radius_km"] > 0

def test_outbreak_forecaster():
    """Verify 7, 14, 30-day epidemic trajectory projection."""
    forecast_res = forecast_engine.forecast(
        district="Pune",
        current_active_cases=15,
        cases_last_7d=10,
        cases_last_14d=14,
        vaccination_coverage_pct=60.0,
        cluster_count=2
    )
    
    assert forecast_res["district"] == "Pune"
    assert forecast_res["trend"] in ["INCREASING", "STABLE", "DECREASING"]
    assert "projected_cases" in forecast_res
    assert len(forecast_res["trajectory"]) == 4
    assert len(forecast_res["key_drivers"]) > 0
    assert len(forecast_res["recommended_interventions"]) > 0
