"""
FAUNA-X: Database Seeder Script
Populates multi-role test accounts (Farmer, Vet, Field Officer, District/State/National Admins)
and realistic baseline surveillance cases with multimodal AI predictions, SHAP explainability,
laboratory referrals, vaccination records, and alerts.
"""
import sys
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from backend.app.core.database import AsyncSessionLocal, engine, Base
from backend.app.core.security import get_password_hash
from backend.app.models.models import (
    User, UserRole, Case, CaseStatus, CaseSymptom,
    CaseImage, AIPrediction, VeterinaryVerification, AuditLog,
    LabRecord, Alert
)

DEMO_USERS = [
    {
        "full_name": "Ramesh Patil",
        "email": "farmer@faunax.gov.in",
        "phone": "+91 98765 43210",
        "password": "Farmer@123",
        "role": UserRole.FARMER,
        "district": "Pune",
        "state": "Maharashtra",
        "preferred_language": "mr"
    },
    {
        "full_name": "Dr. Anjali Deshmukh",
        "email": "vet@faunax.gov.in",
        "phone": "+91 98765 43211",
        "password": "Vet@123",
        "role": UserRole.VETERINARIAN,
        "district": "Pune",
        "state": "Maharashtra",
        "preferred_language": "en"
    },
    {
        "full_name": "Sanjay Shinde (Field Inspector)",
        "email": "field@faunax.gov.in",
        "phone": "+91 98765 43214",
        "password": "Field@123",
        "role": UserRole.FIELD_OFFICER,
        "district": "Pune",
        "state": "Maharashtra",
        "preferred_language": "hi"
    },
    {
        "full_name": "District Veterinary Officer (Pune)",
        "email": "district@faunax.gov.in",
        "phone": "+91 98765 43215",
        "password": "District@123",
        "role": UserRole.DISTRICT_ADMIN,
        "district": "Pune",
        "state": "Maharashtra"
    },
    {
        "full_name": "State Animal Husbandry Commissioner",
        "email": "state@faunax.gov.in",
        "phone": "+91 98765 43212",
        "password": "State@123",
        "role": UserRole.STATE_ADMIN,
        "district": "State HQ",
        "state": "Maharashtra"
    },
    {
        "full_name": "National Livestock Epidemiologist",
        "email": "national@faunax.gov.in",
        "phone": "+91 98765 43213",
        "password": "National@123",
        "role": UserRole.NATIONAL_ADMIN,
        "district": "National HQ",
        "state": "New Delhi"
    },
    {
        "full_name": "System Administrator",
        "email": "admin@faunax.gov.in",
        "phone": "+91 98765 43219",
        "password": "Admin@123",
        "role": UserRole.ADMIN,
        "district": "National HQ",
        "state": "New Delhi"
    }
]

DEMO_CASES = [
    {
        "case_number": "FX-2026-00101",
        "species": "Cattle",
        "breed": "Gir",
        "age_months": 36,
        "sex": "Female",
        "number_affected": 2,
        "status": CaseStatus.VERIFIED,
        "latitude": 18.5204,
        "longitude": 73.8567,
        "village": "Haveli",
        "district": "Pune",
        "state": "Maharashtra",
        "temperature_c": 40.2,
        "duration_days": 4,
        "created_days_ago": 4,
        "risk_score": 0.88,
        "risk_tier": "HIGH",
        "triage_priority": "HIGH",
        "symptoms": [
            {"name": "Skin lesions", "severity": "High", "notes": "Multiple circular firm nodules across flank"},
            {"name": "Fever", "severity": "High", "notes": "Temperature 104 F"},
            {"name": "Reduced milk production", "severity": "Moderate", "notes": "Drop by 40%"}
        ],
        "prediction": {
            "class": "lumpy_skin",
            "display": "Lumpy Skin Disease (LSD)",
            "confidence": 0.892,
            "status": "Potential visual indicator detected."
        },
        "shap_factors": [
            {"label": "Nodular Skin Lesions", "shap_value": 0.28, "impact": "INCREASES_RISK"},
            {"label": "High Fever (Pyrexia)", "shap_value": 0.18, "impact": "INCREASES_RISK"},
            {"label": "Active Local Hotspot (5km)", "shap_value": 0.20, "impact": "INCREASES_RISK"},
            {"label": "Vaccination Protection", "shap_value": -0.25, "impact": "DECREASES_RISK"}
        ],
        "verification": {
            "status": "VERIFIED",
            "findings": "Observed generalized cutaneous nodules consistent with clinical Lumpy Skin Disease. Animal isolated.",
            "severity": "High",
            "sample": True,
            "containment": True,
            "vaccination": True,
            "treatment": "Supportive antipyretics, antiseptic wound dressing, and vector isolation."
        },
        "lab": {
            "sample_id": "LAB-2026-PN-091",
            "sample_type": "Skin Biopsy & Swab",
            "lab_name": "Western Regional Disease Diagnostic Lab (WRDDL)",
            "test_method": "Capripox Real-Time PCR",
            "status": "CONFIRMED_POSITIVE",
            "confirmed_pathogen": "Lumpy Skin Disease Virus (LSDV)"
        }
    },
    {
        "case_number": "FX-2026-00102",
        "species": "Cattle",
        "breed": "Holstein Friesian Cross",
        "age_months": 48,
        "sex": "Female",
        "number_affected": 1,
        "status": CaseStatus.VETERINARY_REVIEW,
        "latitude": 18.6798,
        "longitude": 74.0042,
        "village": "Shirur",
        "district": "Pune",
        "state": "Maharashtra",
        "temperature_c": 39.8,
        "duration_days": 2,
        "created_days_ago": 2,
        "risk_score": 0.92,
        "risk_tier": "CRITICAL",
        "triage_priority": "CRITICAL",
        "symptoms": [
            {"name": "Loss of appetite", "severity": "Moderate", "notes": "Reluctant to feed for 2 days"},
            {"name": "Lameness", "severity": "High", "notes": "Painful gait, salivation"},
            {"name": "Oral blisters", "severity": "High", "notes": "Erosions on tongue & gums"}
        ],
        "prediction": {
            "class": "fmd",
            "display": "Foot-and-Mouth Disease (FMD)",
            "confidence": 0.941,
            "status": "Potential visual indicator detected."
        },
        "shap_factors": [
            {"label": "Oral Blisters / Excessive Drooling", "shap_value": 0.32, "impact": "INCREASES_RISK"},
            {"label": "Foot Vesicles & Lameness", "shap_value": 0.26, "impact": "INCREASES_RISK"},
            {"label": "Recent District Growth Rate", "shap_value": 0.15, "impact": "INCREASES_RISK"}
        ]
    },
    {
        "case_number": "FX-2026-00103",
        "species": "Buffalo",
        "breed": "Murrah",
        "age_months": 28,
        "sex": "Female",
        "number_affected": 1,
        "status": CaseStatus.SUBMITTED,
        "latitude": 17.6805,
        "longitude": 74.0183,
        "village": "Karad",
        "district": "Satara",
        "state": "Maharashtra",
        "temperature_c": 38.6,
        "duration_days": 1,
        "created_days_ago": 1,
        "risk_score": 0.18,
        "risk_tier": "LOW",
        "triage_priority": "ROUTINE",
        "symptoms": [
            {"name": "Mild lethargy", "severity": "Mild", "notes": "Slight fatigue after transit"}
        ],
        "prediction": {
            "class": "healthy",
            "display": "Healthy / No Prominent Lesions",
            "confidence": 0.884,
            "status": "No prominent visual abnormality detected in preliminary screening."
        },
        "shap_factors": [
            {"label": "Vaccination Protection", "shap_value": -0.25, "impact": "DECREASES_RISK"},
            {"label": "No Vesicular Signs", "shap_value": -0.15, "impact": "DECREASES_RISK"}
        ]
    },
    {
        "case_number": "FX-2026-00104",
        "species": "Cattle",
        "breed": "Sahiwal",
        "age_months": 42,
        "sex": "Female",
        "number_affected": 3,
        "status": CaseStatus.RESPONSE_ACTIVE,
        "latitude": 19.0948,
        "longitude": 74.7480,
        "village": "Rahata",
        "district": "Ahmednagar",
        "state": "Maharashtra",
        "temperature_c": 40.5,
        "duration_days": 3,
        "created_days_ago": 3,
        "risk_score": 0.94,
        "risk_tier": "CRITICAL",
        "triage_priority": "CRITICAL",
        "symptoms": [
            {"name": "Nasal discharge & salivation", "severity": "High", "notes": "Excessive frothy oral salivation"},
            {"name": "High Fever", "severity": "High", "notes": "High pyrexia"}
        ],
        "prediction": {
            "class": "fmd",
            "display": "Foot-and-Mouth Disease (FMD)",
            "confidence": 0.963,
            "status": "Potential visual indicator detected."
        },
        "verification": {
            "status": "VERIFIED",
            "findings": "Oral mucosal erosions and interdigital blisters observed. Ring vaccination protocol initiated.",
            "severity": "High",
            "sample": True,
            "containment": True,
            "vaccination": True,
            "treatment": "Flunixin meglumine, sodium chloride oral washes, and broad-spectrum antimicrobial cover."
        }
    }
]

async def seed_database():
    print("Seeding FAUNA-X Database with Multi-Role Accounts and Surveillance Data...")
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Seed Users
        user_map = {}
        for u_data in DEMO_USERS:
            res = await db.execute(select(User).where(User.email == u_data["email"]))
            existing = res.scalars().first()
            if not existing:
                user = User(
                    full_name=u_data["full_name"],
                    email=u_data["email"],
                    phone=u_data["phone"],
                    hashed_password=get_password_hash(u_data["password"]),
                    role=u_data["role"],
                    district=u_data["district"],
                    state=u_data["state"],
                    preferred_language=u_data.get("preferred_language", "en")
                )
                db.add(user)
                await db.flush()
                user_map[u_data["role"]] = user.id
                print(f"  + Created User: {u_data['email']} ({u_data['role'].value})")
            else:
                if u_data.get("preferred_language") and existing.preferred_language != u_data["preferred_language"]:
                    existing.preferred_language = u_data["preferred_language"]
                user_map[u_data["role"]] = existing.id

        farmer_id = user_map.get(UserRole.FARMER, 1)
        vet_id = user_map.get(UserRole.VETERINARIAN, 2)

        # 2. Seed Baseline Cases
        for c_data in DEMO_CASES:
            res = await db.execute(select(Case).where(Case.case_number == c_data["case_number"]))
            if not res.scalars().first():
                case_time = datetime.utcnow() - timedelta(days=c_data["created_days_ago"])
                case_obj = Case(
                    case_number=c_data["case_number"],
                    farmer_id=farmer_id,
                    species=c_data["species"],
                    breed=c_data["breed"],
                    age_months=c_data["age_months"],
                    sex=c_data["sex"],
                    number_affected=c_data["number_affected"],
                    status=c_data["status"],
                    latitude=c_data["latitude"],
                    longitude=c_data["longitude"],
                    village=c_data["village"],
                    district=c_data["district"],
                    state=c_data["state"],
                    temperature_c=c_data.get("temperature_c", 39.0),
                    duration_days=c_data.get("duration_days", 3),
                    ai_risk_score=c_data.get("risk_score", 0.75),
                    ai_risk_tier=c_data.get("risk_tier", "HIGH"),
                    ai_triage_priority=c_data.get("triage_priority", "HIGH"),
                    ai_confidence=0.91,
                    created_at=case_time,
                    updated_at=case_time
                )
                db.add(case_obj)
                await db.flush()

                # Symptoms
                for s in c_data["symptoms"]:
                    db.add(CaseSymptom(
                        case_id=case_obj.id,
                        symptom_name=s["name"],
                        severity=s["severity"],
                        source="FARMER_REPORT",
                        notes=s["notes"]
                    ))

                # Image & AI Prediction
                img = CaseImage(
                    case_id=case_obj.id,
                    storage_path="demo/sample_cattle.jpg",
                    original_filename="sample_field_photo.jpg",
                    quality_score=0.92,
                    is_blurry=False,
                    brightness_mean=134.0,
                    created_at=case_time
                )
                db.add(img)
                await db.flush()

                pred_info = c_data["prediction"]
                db.add(AIPrediction(
                    case_id=case_obj.id,
                    image_id=img.id,
                    model_name="FAUNA-X Multimodal Intelligence Suite",
                    model_version="1.0.0",
                    task="classification",
                    prediction_class=pred_info["class"],
                    display_name=pred_info["display"],
                    confidence=pred_info["confidence"],
                    percentage=round(pred_info["confidence"] * 100, 1),
                    is_low_confidence=False,
                    status_text=pred_info["status"],
                    visual_indicators=[{"label": "observed_lesions", "confidence": pred_info["confidence"]}],
                    shap_factors=c_data.get("shap_factors", []),
                    requires_verification=True,
                    validation_status="CLINICALLY_BENCHMARKED_PILOT",
                    clinical_disclaimer="AI-assisted risk estimation. Requires qualified veterinary verification.",
                    created_at=case_time
                ))

                # Verification if present
                if "verification" in c_data:
                    v_info = c_data["verification"]
                    db.add(VeterinaryVerification(
                        case_id=case_obj.id,
                        veterinarian_id=vet_id,
                        status=v_info["status"],
                        clinical_findings=v_info["findings"],
                        severity=v_info["severity"],
                        sample_required=v_info["sample"],
                        containment_required=v_info["containment"],
                        vaccination_required=v_info["vaccination"],
                        treatment_prescribed=v_info.get("treatment", "Standard supportive protocol."),
                        created_at=case_time + timedelta(hours=6)
                    ))

                # Lab record if present
                if "lab" in c_data:
                    l_info = c_data["lab"]
                    db.add(LabRecord(
                        case_id=case_obj.id,
                        sample_id=l_info["sample_id"],
                        sample_type=l_info["sample_type"],
                        lab_name=l_info["lab_name"],
                        test_method=l_info["test_method"],
                        status=l_info["status"],
                        confirmed_pathogen=l_info["confirmed_pathogen"],
                        result_date=case_time + timedelta(days=1)
                    ))

                print(f"  + Created Demo Case: {c_data['case_number']} ({c_data['species']} - {c_data['district']})")

        # 3. Seed Outbreak Surveillance Alerts
        res_alert = await db.execute(select(Alert))
        if not res_alert.scalars().first():
            db.add(Alert(
                title="Active FMD Cluster Alert: Shirur-Haveli Corridor",
                message="Elevated syndromic signals of vesicular stomatitis and lameness detected across 3 neighboring villages. Ring vaccination advised within 10km radius.",
                priority="HIGH",
                district="Pune",
                state="Maharashtra",
                is_active=True
            ))
            db.add(Alert(
                title="Lumpy Skin Disease Surveillance Advisory: Western Region",
                message="Vector activity peak forecast for next 14 days due to humidity anomalies. Ensure vector repellent spraying at cattle sheds.",
                priority="MEDIUM",
                district="Ahmednagar",
                state="Maharashtra",
                is_active=True
            ))

        await db.commit()
    print("[OK] FAUNA-X Multi-Role Database Seeding Complete!")

if __name__ == "__main__":
    asyncio.run(seed_database())
