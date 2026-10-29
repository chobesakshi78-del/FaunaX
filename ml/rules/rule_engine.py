"""
FAUNA-X: Configurable Rule-Based Triage Engine
Evaluates clinical syndromic combinations, hotspot density, and risk thresholds
from external YAML definitions.
"""
from pathlib import Path
from typing import Dict, Any, List, Optional
import yaml

RULES_YAML_PATH = Path(__file__).parent / "triage_rules.yaml"

class TriageRuleEngine:
    def __init__(self, rules_path: Optional[Path] = None):
        self.rules_path = rules_path or RULES_YAML_PATH
        self.config: Dict[str, Any] = {}
        self.load_rules()

    def load_rules(self):
        if self.rules_path.exists():
            with open(self.rules_path, "r", encoding="utf-8") as f:
                self.config = yaml.safe_load(f) or {}
        else:
            self.config = {
                "thresholds": {
                    "critical_risk_score": 0.85,
                    "high_risk_score": 0.65,
                    "medium_risk_score": 0.40,
                    "nearby_case_cluster_threshold_5km": 5
                },
                "critical_combinations": [
                    {
                        "name": "Suspected Foot & Mouth Syndrome",
                        "required_symptoms": ["SYM_ORAL_ULCERS", "SYM_FOOT_LESIONS"],
                        "escalation_priority": "CRITICAL",
                        "action": "Immediate veterinary quarantine advisory and lab sample requisition"
                    }
                ]
            }

    def evaluate(
        self,
        symptom_ids: List[str],
        species: str,
        ai_risk_score: float,
        nearby_cases_5km: int = 0,
        mortality_count: int = 0
    ) -> Dict[str, Any]:
        """
        Evaluates triage rules against case features.
        Returns calculated priority level, matched rules, and clinical action recommendations.
        """
        matched_syndromes = []
        action_recommendations = []
        priority = "ROUTINE"
        reasons = []

        norm_symptoms = {s.upper().strip() for s in symptom_ids}
        
        # 1. Evaluate Critical Syndromic Combinations
        combinations = self.config.get("critical_combinations", [])
        for combo in combinations:
            required = set(combo.get("required_symptoms", []))
            combo_species = combo.get("species", [])
            
            species_match = not combo_species or (species and species.capitalize() in combo_species)
            
            if species_match and required.issubset(norm_symptoms):
                matched_syndromes.append(combo.get("name"))
                action_recommendations.append(combo.get("action"))
                escalation = combo.get("escalation_priority", "HIGH")
                if escalation == "CRITICAL" or priority != "CRITICAL":
                    priority = escalation
                reasons.append(f"Syndromic match: {combo.get('name')}")

        # 2. Evaluate Spatial Hotspot Escalation
        thresholds = self.config.get("thresholds", {})
        cluster_thresh = thresholds.get("nearby_case_cluster_threshold_5km", 5)
        
        if nearby_cases_5km >= cluster_thresh and ai_risk_score >= 0.60:
            priority = "CRITICAL"
            reasons.append(f"Active hotspot density: {nearby_cases_5km} nearby cases within 5km.")
            action_recommendations.append("Priority field investigation and cluster ring vaccination assessment")

        # 3. Evaluate AI Risk Score Escalation
        crit_thresh = thresholds.get("critical_risk_score", 0.85)
        high_thresh = thresholds.get("high_risk_score", 0.65)
        med_thresh = thresholds.get("medium_risk_score", 0.40)

        if ai_risk_score >= crit_thresh and priority != "CRITICAL":
            priority = "CRITICAL"
            reasons.append(f"Model risk score ({ai_risk_score:.2f}) exceeds critical threshold ({crit_thresh})")
        elif ai_risk_score >= high_thresh and priority in ("ROUTINE", "MEDIUM"):
            priority = "HIGH"
            reasons.append(f"Model risk score ({ai_risk_score:.2f}) exceeds high threshold ({high_thresh})")
        elif ai_risk_score >= med_thresh and priority == "ROUTINE":
            priority = "MEDIUM"
            reasons.append(f"Model risk score ({ai_risk_score:.2f}) indicates moderate surveillance priority")

        # Default fallback recommendations if none generated
        if not action_recommendations:
            if priority in ("CRITICAL", "HIGH"):
                action_recommendations.append("Veterinary clinical examination required within 24 hours.")
            else:
                action_recommendations.append("Standard veterinary review and symptomatic monitoring.")

        return {
            "triage_priority": priority, # ROUTINE, MEDIUM, HIGH, CRITICAL
            "matched_syndromes": matched_syndromes,
            "escalation_reasons": reasons,
            "recommended_actions": list(set(action_recommendations)),
            "is_emergency_escalation": priority in ("CRITICAL", "HIGH"),
            "engine_version": self.config.get("version", "1.0")
        }

triage_engine = TriageRuleEngine()
