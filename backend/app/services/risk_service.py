"""
FAUNA-X: Downstream ML Service Orchestrators
Connects FastAPI routes and background workers to the pluggable ML intelligence modules:
1. Multi-modal XGBoost Case Risk Scoring
2. DBSCAN Spatial-Temporal Clustering
3. LightGBM Outbreak Trajectory Forecasting
4. TreeSHAP Clinical Explainability
"""
from typing import Dict, Any, List, Optional
from ml.risk.inference import case_risk_engine
from ml.clustering.dbscan import cluster_analyzer
from ml.forecasting.forecast_engine import forecast_engine
from ml.explainability.shap_explainer import shap_explainer

class RiskService:
    @staticmethod
    def calculate_case_risk(
        case_data: Dict[str, Any],
        visual_findings: Optional[Dict[str, Any]] = None,
        nlp_symptoms: Optional[Dict[str, Any]] = None,
        spatial_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Calculates multimodal case risk and evaluates triage priority."""
        return case_risk_engine.predict_risk(
            case_data=case_data,
            visual_findings=visual_findings,
            nlp_symptoms=nlp_symptoms,
            spatial_context=spatial_context
        )

class ClusterService:
    @staticmethod
    def analyze_spatial_clusters(
        cases_list: Optional[List[Dict[str, Any]]] = None,
        time_window_days: int = 21,
        district: Optional[str] = None
    ) -> Dict[str, Any]:
        """Runs DBSCAN spatio-temporal clustering across geocoded cases."""
        cases = cases_list or []
        return cluster_analyzer.detect_clusters(cases)

class ForecastService:
    @staticmethod
    def forecast_outbreak_trajectory(
        district: str,
        current_active_cases: int = 14,
        cases_last_7d: int = 9,
        cases_last_14d: int = 15,
        vaccination_coverage_pct: float = 64.0,
        cluster_count: int = 2
    ) -> Dict[str, Any]:
        """Forecasts 7, 14, and 30-day epidemic risk trajectories."""
        return forecast_engine.forecast(
            district=district,
            current_active_cases=current_active_cases,
            cases_last_7d=cases_last_7d,
            cases_last_14d=cases_last_14d,
            vaccination_coverage_pct=vaccination_coverage_pct,
            cluster_count=cluster_count
        )

class ExplanationService:
    @staticmethod
    def explain_case_prediction(
        feature_dict: Dict[str, float],
        predicted_risk: float
    ) -> Dict[str, Any]:
        """Generates SHAP clinical attribution waterfall factors."""
        return shap_explainer.explain(
            feature_dict=feature_dict,
            predicted_risk=predicted_risk
        )

risk_service = RiskService()
cluster_service = ClusterService()
forecast_service = ForecastService()
explanation_service = ExplanationService()
