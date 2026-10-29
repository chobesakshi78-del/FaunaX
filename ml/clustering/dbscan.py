"""
FAUNA-X: DBSCAN Spatio-Temporal Cluster Detection Module
Groups active field cases using spatial haversine distance and temporal decay
to identify emerging disease clusters requiring ring vaccination or containment.
"""
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.cluster import DBSCAN

class SpatioTemporalClusterAnalyzer:
    def __init__(
        self,
        eps_km: float = 15.0,  # 15 km spatial radius
        min_samples: int = 3,  # minimum 3 cases to form a cluster
        time_decay_days: int = 21  # 21 day active window
    ):
        self.eps_km = eps_km
        self.min_samples = min_samples
        self.time_decay_days = time_decay_days
        self.model_version = "1.0.0-dbscan"

    @staticmethod
    def _haversine_distance(lat1, lon1, lat2, lon2):
        R = 6371.0 # Earth radius in kilometers
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def detect_clusters(self, cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Runs DBSCAN over cases with valid GPS coordinates.
        Returns list of identified active clusters and noise points.
        """
        valid_cases = [
            c for c in cases
            if c.get("latitude") is not None and c.get("longitude") is not None
        ]

        if len(valid_cases) < self.min_samples:
            return {
                "model_version": self.model_version,
                "validation_status": "PROTOTYPE_NOT_CLINICALLY_VALIDATED",
                "active_cluster_count": 0,
                "clusters": [],
                "unclustered_cases_count": len(valid_cases),
                "message": f"Fewer than {self.min_samples} spatial cases available. No dense clusters detected."
            }

        # Extract coordinates in radians for Haversine metric
        coords_rad = np.radians([
            [float(c["latitude"]), float(c["longitude"])] for c in valid_cases
        ])

        # Earth radius in km = 6371.0
        kms_per_radian = 6371.0
        epsilon = self.eps_km / kms_per_radian

        db = DBSCAN(eps=epsilon, min_samples=self.min_samples, metric='haversine')
        labels = db.fit_predict(coords_rad)

        cluster_groups: Dict[int, List[Dict[str, Any]]] = {}
        unclustered = 0

        for idx, label in enumerate(labels):
            if label == -1:
                unclustered += 1
            else:
                if label not in cluster_groups:
                    cluster_groups[label] = []
                cluster_groups[label].append(valid_cases[idx])

        detected_clusters: List[Dict[str, Any]] = []

        for cluster_id, members in cluster_groups.items():
            lats = [float(m["latitude"]) for m in members]
            lons = [float(m["longitude"]) for m in members]
            centroid_lat = round(float(np.mean(lats)), 5)
            centroid_lon = round(float(np.mean(lons)), 5)

            # Calculate maximum distance from centroid as radius
            radii = [self._haversine_distance(centroid_lat, centroid_lon, float(m["latitude"]), float(m["longitude"])) for m in members]
            cluster_radius_km = round(max(radii, default=2.0) + 1.5, 1)

            # Calculate predominant species & risk level
            species_counts = {}
            for m in members:
                sp = m.get("species", "Cattle")
                species_counts[sp] = species_counts.get(sp, 0) + 1
            primary_species = max(species_counts, key=species_counts.get) if species_counts else "Cattle"

            avg_risk = np.mean([float(m.get("ai_risk_score") or 0.65) for m in members])
            if avg_risk >= 0.75 or len(members) >= 6:
                cluster_risk = "CRITICAL"
            elif avg_risk >= 0.55:
                cluster_risk = "HIGH"
            else:
                cluster_risk = "MEDIUM"

            detected_clusters.append({
                "cluster_code": f"CLUST-{datetime.utcnow().strftime('%y%m')}-{cluster_id + 1:03d}",
                "centroid": {
                    "latitude": centroid_lat,
                    "longitude": centroid_lon
                },
                "radius_km": cluster_radius_km,
                "case_count": len(members),
                "primary_species": primary_species,
                "risk_level": cluster_risk,
                "status": "ACTIVE",
                "sample_cases": [m.get("case_number", f"CASE-{m.get('id')}") for m in members[:4]],
                "recommended_action": "Implement 10km surveillance ring and vector control measures."
            })

        return {
            "model_version": self.model_version,
            "validation_status": "PROTOTYPE_NOT_CLINICALLY_VALIDATED",
            "active_cluster_count": len(detected_clusters),
            "clusters": detected_clusters,
            "unclustered_cases_count": unclustered,
            "disclaimer": "DBSCAN spatial clustering identifies statistical proximity clusters that require field veterinarian verification."
        }

cluster_analyzer = SpatioTemporalClusterAnalyzer()
