"""
FAUNA-X: Case Management API Routes
Handles health report creation, photographic upload, AI screening trigger,
multimodal risk scoring, explainability computation, and retrieval.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_token, require_roles
from backend.app.models.models import Case, CaseStatus, CaseSymptom, CaseImage, AIPrediction, User, AuditLog, LabRecord, Animal, FieldVisit, CaseTranslation, VaccinationRecord, VeterinaryVerification
from backend.app.schemas.schemas import CaseCreate, CaseDetailResponse, AIPredictionResponse, AnimalCreate, AnimalResponse, CaseTranslationResponse, CaseTranslationRequest, VaccinationCreate, VaccinationResponse, AnimalHistoryResponse
from backend.app.services.vision_service import vision_service
from backend.app.services.risk_service import risk_service
from backend.app.services.translation_service import translation_service
from backend.app.services.report_service import generate_case_pdf_report
from ai.vision.preprocessing import check_image_quality
from PIL import Image
import io

router = APIRouter(prefix="/cases", tags=["Case Management"])

# ================= ANIMAL REGISTRATION & MANAGEMENT (PHASE 2) =================

@router.get("/animals/mine", response_model=List[AnimalResponse])
async def list_farmer_animals(
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves all registered animals for the authenticated farmer."""
    stmt = select(Animal).where(Animal.farmer_id == token_data["user_id"]).order_by(Animal.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/animals", response_model=AnimalResponse)
async def register_animal(
    animal_in: AnimalCreate,
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    """Registers a new livestock animal under the authenticated farmer."""
    tag = animal_in.tag_number or f"FX-TAG-{token_data['user_id']}-{datetime.utcnow().strftime('%y%m%d%H%M')}"
    new_animal = Animal(
        farmer_id=token_data["user_id"],
        tag_number=tag,
        species=animal_in.species,
        breed=animal_in.breed,
        age_months=animal_in.age_months,
        sex=animal_in.sex,
        herd_size=animal_in.herd_size,
        vaccination_history=animal_in.vaccination_history or []
    )
    db.add(new_animal)
    await db.commit()
    await db.refresh(new_animal)
    return new_animal

@router.get("/animals/{animal_id}/history", response_model=AnimalHistoryResponse)
async def get_animal_longitudinal_history(
    animal_id: int,
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves full longitudinal history of an animal: identification, past cases, and vaccinations."""
    animal_res = await db.execute(select(Animal).where(Animal.id == animal_id))
    animal = animal_res.scalars().first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal record not found")

    # Fetch all cases linked to this animal (or farmer)
    cases_stmt = (
        select(Case)
        .options(
            selectinload(Case.symptoms),
            selectinload(Case.images),
            selectinload(Case.ai_predictions),
            selectinload(Case.verification),
            selectinload(Case.field_visits),
            selectinload(Case.lab_records),
            selectinload(Case.translations)
        )
        .where(Case.animal_id == animal_id)
        .order_by(Case.created_at.desc())
    )
    cases_res = await db.execute(cases_stmt)
    linked_cases = cases_res.scalars().all()

    # Fetch all vaccinations
    vac_stmt = select(VaccinationRecord).where(VaccinationRecord.animal_id == animal_id).order_by(VaccinationRecord.administered_date.desc())
    vac_res = await db.execute(vac_stmt)
    vaccinations = vac_res.scalars().all()

    return {
        "animal": animal,
        "cases": linked_cases,
        "vaccinations": vaccinations
    }

@router.get("/animals/{animal_id}/vaccinations", response_model=List[VaccinationResponse])
async def list_animal_vaccinations(
    animal_id: int,
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves vaccination records for a registered animal."""
    stmt = select(VaccinationRecord).where(VaccinationRecord.animal_id == animal_id).order_by(VaccinationRecord.administered_date.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/animals/{animal_id}/vaccinations", response_model=VaccinationResponse)
async def add_animal_vaccination(
    animal_id: int,
    vac_in: VaccinationCreate,
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    """Records an administered vaccination against an animal with biosecurity audit log."""
    animal_res = await db.execute(select(Animal).where(Animal.id == animal_id))
    animal = animal_res.scalars().first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal record not found")

    new_vac = VaccinationRecord(
        animal_id=animal_id,
        disease_name=vac_in.disease_name,
        vaccine_batch=vac_in.vaccine_batch,
        administered_date=vac_in.administered_date or datetime.utcnow(),
        next_due_date=vac_in.next_due_date,
        district=vac_in.district or animal.owner.district if animal.owner else "Pune",
        state=vac_in.state or "Maharashtra",
        veterinarian_id=token_data["user_id"]
    )
    db.add(new_vac)

    # Append to cached vaccination history on Animal
    curr_hist = list(animal.vaccination_history or [])
    curr_hist.append({
        "disease": vac_in.disease_name,
        "date": (vac_in.administered_date or datetime.utcnow()).strftime("%Y-%m-%d"),
        "batch": vac_in.vaccine_batch or "N/A"
    })
    animal.vaccination_history = curr_hist

    db.add(AuditLog(
        user_id=token_data["user_id"],
        action="VACCINATION_RECORDED",
        entity_type="Animal",
        entity_id=str(animal.tag_number or animal.id),
        details={"disease": vac_in.disease_name, "batch": vac_in.vaccine_batch}
    ))

    await db.commit()
    await db.refresh(new_vac)
    return new_vac

async def generate_case_number(db: AsyncSession) -> str:
    """Generates sequential FX-YYYY-NNNNN formatted case identifier."""
    year = datetime.utcnow().year
    result = await db.execute(select(Case).order_by(Case.id.desc()).limit(1))
    last_case = result.scalars().first()
    next_seq = 1 if not last_case else (last_case.id + 1)
    return f"FX-{year}-{next_seq:05d}"

@router.post("", response_model=CaseDetailResponse)
async def create_case(
    case_in: CaseCreate,
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    case_num = await generate_case_number(db)
    
    # 1. Normalize symptoms
    symptom_names: List[str] = []
    symptom_records = []
    for sym in case_in.symptoms:
        if isinstance(sym, str):
            s_name = sym.strip()
            if s_name:
                symptom_names.append(s_name)
                symptom_records.append({"name": s_name, "severity": "Moderate", "source": "FARMER_REPORT", "notes": None})
        elif isinstance(sym, dict):
            s_name = sym.get("symptom_name", "").strip()
            if s_name:
                symptom_names.append(s_name)
                symptom_records.append({
                    "name": s_name,
                    "severity": sym.get("severity", "Moderate"),
                    "source": sym.get("source", "FARMER_REPORT"),
                    "notes": sym.get("notes")
                })
        else:
            s_name = getattr(sym, "symptom_name", "").strip()
            if s_name:
                symptom_names.append(s_name)
                symptom_records.append({
                    "name": s_name,
                    "severity": getattr(sym, "severity", "Moderate"),
                    "source": getattr(sym, "source", "FARMER_REPORT"),
                    "notes": getattr(sym, "notes", None)
                })

    # 2. Normalize age
    age_months = case_in.age_months
    if age_months is None and case_in.age is not None:
        try:
            val = float(str(case_in.age).split()[0])
            age_months = int(val * 12) if val < 25 else int(val)
        except Exception:
            age_months = 24

    # 3. Location normalization
    loc_name = case_in.location_name or ""
    village = case_in.village
    district = case_in.district
    state = case_in.state or "Maharashtra"

    if loc_name:
        parts = [p.strip() for p in loc_name.split(",") if p.strip()]
        if not village and len(parts) >= 1:
            village = parts[0]
        if not district and len(parts) >= 2:
            district = parts[1]

    if not village:
        village = "Field Location"
    if not district:
        district = "Nagpur"

    history_dict = case_in.history_data or case_in.history or {}

    risk_output = risk_service.calculate_case_risk(
        case_data={
            "species": case_in.species,
            "age_months": age_months or 24,
            "affected_count": case_in.number_affected,
            "duration_days": case_in.duration_days or 3,
            "symptoms": symptom_names
        }
    )

    new_case = Case(
        case_number=case_num,
        farmer_id=token_data["user_id"],
        animal_id=case_in.animal_id,
        primary_language=case_in.primary_language or "en",
        species=case_in.species,
        breed=case_in.breed,
        age_months=age_months,
        sex=case_in.sex,
        number_affected=case_in.number_affected,
        status=CaseStatus.SUBMITTED,
        latitude=case_in.latitude or 20.5937,
        longitude=case_in.longitude or 78.9629,
        village=village,
        district=district,
        state=state,
        temperature_c=case_in.temperature_c,
        appetite_status=case_in.appetite_status,
        mobility_status=case_in.mobility_status,
        duration_days=case_in.duration_days or 3,
        voice_transcript=case_in.voice_transcript or case_in.notes,
        ai_risk_score=risk_output.get("risk_score", 0.0),
        ai_risk_tier=risk_output.get("risk_level", "LOW"),
        ai_triage_priority=risk_output.get("triage_priority", "ROUTINE"),
        ai_confidence=risk_output.get("confidence", 0.85),
        history_data=history_dict
    )
    db.add(new_case)
    await db.flush()

    # Add symptoms
    for sym_rec in symptom_records:
        case_sym = CaseSymptom(
            case_id=new_case.id,
            symptom_name=sym_rec["name"],
            severity=sym_rec["severity"],
            source=sym_rec["source"],
            notes=sym_rec["notes"]
        )
        db.add(case_sym)

    # Add audit log
    audit = AuditLog(
        user_id=token_data["user_id"],
        action="CASE_CREATED",
        entity_type="Case",
        entity_id=case_num,
        details={
            "species": case_in.species,
            "number_affected": case_in.number_affected,
            "risk_tier": risk_output.get("risk_level", "LOW"),
            "triage_priority": risk_output.get("triage_priority", "ROUTINE")
        }
    )
    db.add(audit)
    
    await db.commit()
    
    # Reload with relationships
    stmt = (
        select(Case)
        .options(
            selectinload(Case.symptoms),
            selectinload(Case.images),
            selectinload(Case.ai_predictions),
            selectinload(Case.verification),
            selectinload(Case.field_visits),
            selectinload(Case.lab_records),
            selectinload(Case.translations),
            selectinload(Case.assigned_officer)
        )
        .where(Case.id == new_case.id)
    )
    res = await db.execute(stmt)
    return res.scalars().first()

@router.post("/{case_id}/image", response_model=AIPredictionResponse)
async def upload_case_image_and_screen(
    case_id: int,
    file: UploadFile = File(...),
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch case
    result = await db.execute(select(Case).options(selectinload(Case.symptoms)).where(Case.id == case_id))
    case_obj = result.scalars().first()
    if not case_obj:
        raise HTTPException(status_code=404, detail=f"Case ID {case_id} not found")

    # 2. Save image to disk
    storage_path, image_bytes = await vision_service.save_uploaded_image(file, case_id)

    # 3. Analyze quality
    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        quality_audit = check_image_quality(pil_img)
    except Exception:
        quality_audit = {"overall_quality_score": 0.5, "is_blurry": False, "brightness_mean": 128.0}

    # 4. Save CaseImage record
    case_img = CaseImage(
        case_id=case_id,
        storage_path=storage_path,
        original_filename=file.filename,
        mime_type=file.content_type or "image/jpeg",
        size_bytes=len(image_bytes),
        quality_score=quality_audit.get("overall_quality_score", 1.0),
        is_blurry=quality_audit.get("is_blurry", False),
        brightness_mean=quality_audit.get("brightness_mean", 128.0)
    )
    db.add(case_img)
    await db.flush()

    # 5. Execute ACTUAL AI Vision Model Screening
    case_obj.status = CaseStatus.AI_SCREENING
    try:
        screening_result = vision_service.screen_image(
            image_bytes=image_bytes,
            species=case_obj.species.lower()
        )
        pred_data = screening_result["prediction"]

        # Recalculate case risk with visual finding fusion
        symptom_names = [s.symptom_name for s in case_obj.symptoms]
        fused_risk = risk_service.calculate_case_risk(
            case_data={
                "species": case_obj.species,
                "age_months": case_obj.age_months,
                "affected_count": case_obj.number_affected,
                "duration_days": case_obj.duration_days,
                "symptoms": symptom_names
            },
            visual_findings={
                "prediction_class": pred_data["class"],
                "confidence": pred_data["confidence"],
                "quality_score": quality_audit.get("overall_quality_score", 1.0)
            }
        )

        case_obj.ai_risk_score = fused_risk.get("risk_score", 0.0)
        case_obj.ai_risk_tier = fused_risk.get("risk_level", "LOW")
        case_obj.ai_triage_priority = fused_risk.get("triage_priority", "ROUTINE")

        # 6. Save AIPrediction record with SHAP factors
        ai_pred = AIPrediction(
            case_id=case_id,
            image_id=case_img.id,
            model_name=screening_result["model"]["name"],
            model_version=screening_result["model"]["version"],
            task=screening_result["model"]["task"],
            prediction_class=pred_data["class"],
            display_name=pred_data["display_name"],
            confidence=pred_data["confidence"],
            percentage=pred_data["percentage"],
            is_low_confidence=pred_data["is_low_confidence"],
            status_text=pred_data["status"],
            visual_indicators=screening_result.get("visual_indicators"),
            alternatives=screening_result.get("alternatives"),
            all_probabilities=screening_result.get("all_probabilities"),
            shap_factors=fused_risk.get("top_positive_factors", []) + fused_risk.get("top_negative_factors", []),
            requires_verification=screening_result.get("requires_veterinary_verification", True),
            validation_status="CLINICALLY_BENCHMARKED_PILOT",
            clinical_disclaimer=screening_result.get("clinical_disclaimer", "AI-assisted risk estimation. Requires veterinary verification.")
        )
        db.add(ai_pred)
        
        # Advance status to Veterinary Review
        case_obj.status = CaseStatus.VETERINARY_REVIEW

        # Audit Log
        db.add(AuditLog(
            user_id=token_data["user_id"],
            action="AI_VISION_SCREENING_COMPLETED",
            entity_type="Case",
            entity_id=case_obj.case_number,
            details={
                "prediction": pred_data["class"],
                "confidence": pred_data["confidence"],
                "fused_risk_score": case_obj.ai_risk_score,
                "triage_priority": case_obj.ai_triage_priority
            }
        ))

        await db.commit()
        await db.refresh(ai_pred)
        return ai_pred

    except Exception as e:
        case_obj.status = CaseStatus.VETERINARY_REVIEW
        db.add(AuditLog(
            user_id=token_data["user_id"],
            action="AI_VISION_SCREENING_FAILED",
            entity_type="Case",
            entity_id=case_obj.case_number,
            details={"error": str(e)}
        ))
        await db.commit()
        raise HTTPException(
            status_code=500,
            detail=f"AI screening could not be completed: {str(e)}. Veterinary assessment can continue without AI screening."
        )

@router.get("", response_model=List[CaseDetailResponse])
async def list_cases(
    status_filter: Optional[str] = None,
    district_filter: Optional[str] = None,
    risk_filter: Optional[str] = None,
    assigned_only: Optional[bool] = False,
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Case).options(
        selectinload(Case.symptoms),
        selectinload(Case.images),
        selectinload(Case.ai_predictions),
        selectinload(Case.verification),
        selectinload(Case.field_visits),
        selectinload(Case.lab_records),
        selectinload(Case.translations),
        selectinload(Case.assigned_officer)
    ).order_by(Case.created_at.desc())

    # If Farmer, show only own cases
    if token_data["role"] == "FARMER":
        stmt = stmt.where(Case.farmer_id == token_data["user_id"])
    elif token_data["role"] == "FIELD_OFFICER" and assigned_only:
        stmt = stmt.where(Case.assigned_officer_id == token_data["user_id"])
    
    if status_filter:
        try:
            enum_status = CaseStatus(status_filter.upper())
            stmt = stmt.where(Case.status == enum_status)
        except ValueError:
            pass

    if district_filter:
        stmt = stmt.where(Case.district.ilike(f"%{district_filter}%"))

    if risk_filter:
        stmt = stmt.where(Case.ai_risk_tier == risk_filter.upper())

    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{case_id}", response_model=CaseDetailResponse)
async def get_case(
    case_id: int,
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Case).options(
        selectinload(Case.symptoms),
        selectinload(Case.images),
        selectinload(Case.ai_predictions),
        selectinload(Case.verification),
        selectinload(Case.field_visits),
        selectinload(Case.lab_records),
        selectinload(Case.translations),
        selectinload(Case.assigned_officer)
    ).where(Case.id == case_id)

    result = await db.execute(stmt)
    case_obj = result.scalars().first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    # If Farmer, verify ownership
    if token_data["role"] == "FARMER" and case_obj.farmer_id != token_data["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this case")

    return case_obj

# ================= MULTILINGUAL CLINICAL REPORT PDF EXPORT =================

@router.get("/{case_id}/report/pdf")
async def export_case_pdf_report(
    case_id: int,
    lang: str = "en",
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates an official, print-ready PDF clinical dossier in Marathi (mr), Hindi (hi), or English (en).
    Embeds Unicode Devanagari font (Noto Sans Devanagari) to guarantee crisp rendering without tofu.
    """
    stmt = (
        select(Case)
        .options(
            selectinload(Case.farmer),
            selectinload(Case.animal),
            selectinload(Case.symptoms),
            selectinload(Case.images),
            selectinload(Case.ai_predictions),
            selectinload(Case.verification).selectinload(VeterinaryVerification.veterinarian),
            selectinload(Case.field_visits).selectinload(FieldVisit.officer),
            selectinload(Case.lab_records),
            selectinload(Case.translations),
            selectinload(Case.assigned_officer)
        )
        .where(Case.id == case_id)
    )
    res = await db.execute(stmt)
    case_obj = res.scalars().first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    # If Farmer, verify ownership
    if token_data["role"] == "FARMER" and case_obj.farmer_id != token_data["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to download this report")

    target_lang = lang.lower().strip()
    if target_lang not in ["en", "mr", "hi"]:
        target_lang = "en"

    pdf_bytes = generate_case_pdf_report(case_obj, target_lang=target_lang)
    filename = f"FaunaX_Report_{case_obj.case_number}_{target_lang.upper()}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\"",
            "X-Report-Language": target_lang
        }
    )

# ================= MULTILINGUAL CASE TRANSLATION (PHASE 4) =================

@router.post("/{case_id}/translate", response_model=List[CaseTranslationResponse])
async def translate_case_content(
    case_id: int,
    trans_req: Optional[CaseTranslationRequest] = None,
    target_language: Optional[str] = None,
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Translates case clinical notes, farmer symptoms, animal history, and veterinary prescriptions
    into target language without overwriting original records.
    """
    stmt = select(Case).options(
        selectinload(Case.symptoms),
        selectinload(Case.verification),
        selectinload(Case.field_visits),
        selectinload(Case.translations)
    ).where(Case.id == case_id)
    res = await db.execute(stmt)
    case_obj = res.scalars().first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    raw_target = (trans_req.target_language if trans_req and trans_req.target_language else target_language) or "en"
    target_lang = raw_target.lower().strip()
    if target_lang not in ["en", "mr", "hi"]:
        raise HTTPException(status_code=400, detail="Target language must be 'en', 'mr', or 'hi'")

    source_lang = case_obj.primary_language or translation_service.detect_language(case_obj.voice_transcript or "")
    translations_created = []

    # 1. Translate Symptoms Summary
    symptom_texts = [s.symptom_name for s in case_obj.symptoms if s.symptom_name]
    if symptom_texts:
        combined_symptoms = ", ".join(symptom_texts)
        existing = next((t for t in case_obj.translations if t.field_name == "symptoms" and t.target_language == target_lang), None)
        if not existing:
            tr = translation_service.translate_clinical_text(combined_symptoms, source_lang, target_lang)
            new_tr = CaseTranslation(
                case_id=case_id,
                field_name="symptoms",
                source_language=source_lang,
                target_language=target_lang,
                original_text=combined_symptoms,
                translated_text=tr["translated_text"],
                is_machine_translated=True
            )
            db.add(new_tr)
            translations_created.append(new_tr)

    # 2. Translate Voice Transcript / Farmer Notes
    if case_obj.voice_transcript:
        existing_vt = next((t for t in case_obj.translations if t.field_name == "voice_transcript" and t.target_language == target_lang), None)
        if not existing_vt:
            tr_vt = translation_service.translate_clinical_text(case_obj.voice_transcript, source_lang, target_lang)
            new_tr_vt = CaseTranslation(
                case_id=case_id,
                field_name="voice_transcript",
                source_language=source_lang,
                target_language=target_lang,
                original_text=case_obj.voice_transcript,
                translated_text=tr_vt["translated_text"],
                is_machine_translated=True
            )
            db.add(new_tr_vt)
            translations_created.append(new_tr_vt)

    # 3. Translate Animal History Notes if present
    if case_obj.history_data and isinstance(case_obj.history_data, dict):
        hist_parts = []
        if case_obj.history_data.get("previous_illness"):
            hist_parts.append(f"Previous Illness: {case_obj.history_data['previous_illness']}")
        if case_obj.history_data.get("recent_treatment"):
            hist_parts.append(f"Recent Treatment: {case_obj.history_data['recent_treatment']}")
        if hist_parts:
            combined_hist = " | ".join(hist_parts)
            existing_hist = next((t for t in case_obj.translations if t.field_name == "history" and t.target_language == target_lang), None)
            if not existing_hist:
                tr_hist = translation_service.translate_clinical_text(combined_hist, source_lang, target_lang)
                new_tr_hist = CaseTranslation(
                    case_id=case_id,
                    field_name="history",
                    source_language=source_lang,
                    target_language=target_lang,
                    original_text=combined_hist,
                    translated_text=tr_hist["translated_text"],
                    is_machine_translated=True
                )
                db.add(new_tr_hist)
                translations_created.append(new_tr_hist)

    # 4. Translate Veterinary Clinical Prescription
    if case_obj.verification and case_obj.verification.treatment_prescribed:
        existing_tx = next((t for t in case_obj.translations if t.field_name == "treatment_prescribed" and t.target_language == target_lang), None)
        if not existing_tx:
            tr_tx = translation_service.translate_clinical_text(
                case_obj.verification.treatment_prescribed,
                source_lang="en",
                target_lang=target_lang
            )
            new_tr_tx = CaseTranslation(
                case_id=case_id,
                field_name="treatment_prescribed",
                source_language="en",
                target_language=target_lang,
                original_text=case_obj.verification.treatment_prescribed,
                translated_text=tr_tx["translated_text"],
                is_machine_translated=True
            )
            db.add(new_tr_tx)
            translations_created.append(new_tr_tx)

    # 5. Translate Veterinary Clinical Findings
    if case_obj.verification and case_obj.verification.clinical_findings:
        existing_cf = next((t for t in case_obj.translations if t.field_name == "clinical_findings" and t.target_language == target_lang), None)
        if not existing_cf:
            tr_cf = translation_service.translate_clinical_text(
                case_obj.verification.clinical_findings,
                source_lang="en",
                target_lang=target_lang
            )
            new_tr_cf = CaseTranslation(
                case_id=case_id,
                field_name="clinical_findings",
                source_language="en",
                target_language=target_lang,
                original_text=case_obj.verification.clinical_findings,
                translated_text=tr_cf["translated_text"],
                is_machine_translated=True
            )
            db.add(new_tr_cf)
            translations_created.append(new_tr_cf)

    # 6. Translate Field Visit Observations
    if case_obj.field_visits:
        for fv in case_obj.field_visits:
            if fv.observations or fv.outcome:
                combined_fv = f"Observations: {fv.observations or 'None'} | Outcome: {fv.outcome or 'None'}"
                fv_field = f"field_visit_{fv.id}"
                existing_fv = next((t for t in case_obj.translations if t.field_name == fv_field and t.target_language == target_lang), None)
                if not existing_fv:
                    tr_fv = translation_service.translate_clinical_text(combined_fv, source_lang="en", target_lang=target_lang)
                    new_tr_fv = CaseTranslation(
                        case_id=case_id,
                        field_name=fv_field,
                        source_language="en",
                        target_language=target_lang,
                        original_text=combined_fv,
                        translated_text=tr_fv["translated_text"],
                        is_machine_translated=True
                    )
                    db.add(new_tr_fv)
                    translations_created.append(new_tr_fv)

    if translations_created:
        await db.commit()

    # Re-fetch all translations for this case
    all_tr_res = await db.execute(select(CaseTranslation).where(CaseTranslation.case_id == case_id))
    return all_tr_res.scalars().all()

@router.get("/{case_id}/translations", response_model=List[CaseTranslationResponse])
async def get_case_translations(
    case_id: int,
    token_data: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves all translated sections associated with the case."""
    stmt = select(CaseTranslation).where(CaseTranslation.case_id == case_id)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/translate/text")
async def translate_arbitrary_text(
    payload: Dict[str, Any],
    token_data: dict = Depends(get_current_user_token)
):
    """General text translation endpoint for dynamic UI translation & preview."""
    text = payload.get("text", "")
    target_lang = payload.get("target_language", "en")
    source_lang = payload.get("source_language")
    return translation_service.translate_clinical_text(text, source_lang=source_lang, target_lang=target_lang)
