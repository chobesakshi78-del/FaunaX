"""
FAUNA-X: Veterinarian Clinical Action Routes
Handles in-person veterinary case verification, differential diagnoses,
laboratory referrals, isolation advisories, and treatment tracking.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db
from backend.app.core.security import require_roles, get_current_user_token
from backend.app.models.models import Case, CaseStatus, VeterinaryVerification, FieldVisit, AuditLog, LabRecord
from backend.app.schemas.schemas import VerificationCreate, VerificationResponse, FieldVisitCreate, CaseDetailResponse, LabRecordCreate, LabRecordResponse

router = APIRouter(prefix="/vet", tags=["Veterinary Verification"])

@router.post("/cases/{case_id}/verify", response_model=CaseDetailResponse)
async def verify_case(
    case_id: int,
    verif_in: VerificationCreate,
    token_data: dict = Depends(require_roles(["VETERINARIAN", "ADMIN", "FIELD_OFFICER"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Case)
        .options(
            selectinload(Case.verification),
            selectinload(Case.symptoms),
            selectinload(Case.images),
            selectinload(Case.ai_predictions),
            selectinload(Case.lab_records)
        )
        .where(Case.id == case_id)
    )
    case_obj = result.scalars().first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    if verif_in.status.upper() == "VERIFIED":
        new_status = CaseStatus.VERIFIED
    elif verif_in.status.upper() == "REJECTED":
        new_status = CaseStatus.REJECTED
    elif verif_in.status.upper() == "CLOSED":
        new_status = CaseStatus.CLOSED
    else:
        new_status = CaseStatus.VETERINARY_REVIEW

    case_obj.status = new_status

    # Check if verification record already exists
    if case_obj.verification:
        verif = case_obj.verification
        verif.status = verif_in.status.upper()
        verif.preliminary_diagnosis = verif_in.preliminary_diagnosis
        verif.clinical_findings = verif_in.clinical_findings
        verif.severity = verif_in.severity
        verif.sample_required = verif_in.sample_required
        verif.containment_required = verif_in.containment_required
        verif.vaccination_required = verif_in.vaccination_required
        verif.treatment_prescribed = verif_in.treatment_prescribed
        verif.follow_up_date = verif_in.follow_up_date
        verif.notes = verif_in.notes
    else:
        verif = VeterinaryVerification(
            case_id=case_id,
            veterinarian_id=token_data["user_id"],
            status=verif_in.status.upper(),
            preliminary_diagnosis=verif_in.preliminary_diagnosis,
            clinical_findings=verif_in.clinical_findings,
            severity=verif_in.severity,
            sample_required=verif_in.sample_required,
            containment_required=verif_in.containment_required,
            vaccination_required=verif_in.vaccination_required,
            treatment_prescribed=verif_in.treatment_prescribed,
            follow_up_date=verif_in.follow_up_date,
            notes=verif_in.notes
        )
        db.add(verif)

    # Log action
    db.add(AuditLog(
        user_id=token_data["user_id"],
        action=f"VETERINARY_CASE_{verif_in.status.upper()}",
        entity_type="Case",
        entity_id=case_obj.case_number,
        details={
            "diagnosis": verif_in.preliminary_diagnosis,
            "severity": verif_in.severity,
            "sample_required": verif_in.sample_required,
            "isolation": verif_in.containment_required
        }
    ))

    await db.commit()
    await db.refresh(case_obj)
    return case_obj

@router.post("/cases/{case_id}/lab-sample", response_model=LabRecordResponse)
async def create_lab_sample(
    case_id: int,
    lab_in: LabRecordCreate,
    token_data: dict = Depends(require_roles(["VETERINARIAN", "ADMIN", "FIELD_OFFICER"])),
    db: AsyncSession = Depends(get_db)
):
    """Refers case sample to laboratory diagnostics."""
    result = await db.execute(select(Case).where(Case.id == case_id))
    case_obj = result.scalars().first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    lab_record = LabRecord(
        case_id=case_id,
        sample_id=lab_in.sample_id,
        sample_type=lab_in.sample_type,
        lab_name=lab_in.lab_name,
        test_method=lab_in.test_method,
        status=lab_in.status,
        confirmed_pathogen=lab_in.confirmed_pathogen,
        notes=lab_in.notes
    )
    db.add(lab_record)
    case_obj.status = CaseStatus.LAB_PENDING

    db.add(AuditLog(
        user_id=token_data["user_id"],
        action="LAB_SAMPLE_REQUISITION",
        entity_type="Case",
        entity_id=case_obj.case_number,
        details={"sample_id": lab_in.sample_id, "lab": lab_in.lab_name}
    ))

    await db.commit()
    await db.refresh(lab_record)
    return lab_record

@router.post("/cases/{case_id}/visit")
async def schedule_field_visit(
    case_id: int,
    visit_in: FieldVisitCreate,
    token_data: dict = Depends(require_roles(["VETERINARIAN", "ADMIN", "FIELD_OFFICER"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Case).where(Case.id == case_id))
    case_obj = result.scalars().first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    visit = FieldVisit(
        case_id=case_id,
        veterinarian_id=token_data["user_id"],
        scheduled_date=visit_in.scheduled_date,
        notes=visit_in.notes
    )
    db.add(visit)
    case_obj.status = CaseStatus.RESPONSE_ACTIVE

    db.add(AuditLog(
        user_id=token_data["user_id"],
        action="FIELD_VISIT_SCHEDULED",
        entity_type="Case",
        entity_id=case_obj.case_number,
        details={"scheduled_date": str(visit_in.scheduled_date)}
    ))

    await db.commit()
    return {"message": "Field visit scheduled successfully", "case_status": case_obj.status.value}

@router.get("/stats")
async def get_vet_dashboard_stats(
    token_data: dict = Depends(require_roles(["VETERINARIAN", "ADMIN", "FIELD_OFFICER"])),
    db: AsyncSession = Depends(get_db)
):
    res_all = await db.execute(select(Case))
    all_cases = res_all.scalars().all()

    pending = [c for c in all_cases if c.status in [CaseStatus.SUBMITTED, CaseStatus.AI_SCREENING, CaseStatus.VETERINARY_REVIEW]]
    high_risk = [c for c in all_cases if (c.ai_risk_tier in ["HIGH", "CRITICAL"]) and c.status != CaseStatus.CLOSED]
    verified = [c for c in all_cases if c.status == CaseStatus.VERIFIED]
    response_active = [c for c in all_cases if c.status in [CaseStatus.RESPONSE_ACTIVE, CaseStatus.LAB_PENDING]]
    resolved = [c for c in all_cases if c.status in [CaseStatus.RESOLVED, CaseStatus.CLOSED]]

    return {
        "total_cases": len(all_cases),
        "pending_verification": len(pending),
        "high_risk_priority": len(high_risk),
        "verified_cases": len(verified),
        "response_active": len(response_active),
        "resolved_cases": len(resolved)
    }
