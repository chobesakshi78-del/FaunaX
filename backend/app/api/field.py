"""
FAUNA-X: Field Officer Dedicated API Router (Phase 2 & Phase 8)
Supports field inspections, visit outcome recording, case coordination,
containment verification, and emergency escalations.
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db
from backend.app.core.security import require_roles, get_current_user_token
from backend.app.models.models import (
    Case, CaseStatus, FieldVisit, AuditLog, User, UserRole, Alert
)
from backend.app.schemas.schemas import (
    CaseDetailResponse, FieldVisitResponse, FieldVisitUpdate,
    FieldOfficerCaseAssign, CaseEscalateRequest, UserResponse
)

router = APIRouter(prefix="/field", tags=["Field Officer Operations"])

@router.get("/cases", response_model=List[CaseDetailResponse])
async def list_field_cases(
    assigned_only: bool = False,
    token_data: dict = Depends(require_roles(["FIELD_OFFICER", "VETERINARIAN", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns cases requiring field inspection or active response.
    Field officers can view cases specifically assigned to them or active cases across their jurisdiction.
    """
    user_id = token_data["user_id"]
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
        .order_by(Case.created_at.desc())
    )

    if assigned_only and token_data["role"] == "FIELD_OFFICER":
        stmt = stmt.where(Case.assigned_officer_id == user_id)

    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/stats")
async def get_field_officer_stats(
    token_data: dict = Depends(require_roles(["FIELD_OFFICER", "VETERINARIAN", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Returns aggregated workload metrics for the field officer dashboard."""
    user_id = token_data["user_id"]
    res = await db.execute(select(Case))
    all_cases = res.scalars().all()

    assigned_to_me = [c for c in all_cases if c.assigned_officer_id == user_id]
    urgent_cases = [c for c in all_cases if c.ai_triage_priority in ["CRITICAL", "URGENT"] and c.status != CaseStatus.CLOSED]
    active_inspections = [c for c in all_cases if c.status in [CaseStatus.RESPONSE_ACTIVE, CaseStatus.VETERINARY_REVIEW]]
    
    # Field visits
    res_visits = await db.execute(select(FieldVisit))
    all_visits = res_visits.scalars().all()
    completed_visits = [v for v in all_visits if v.visit_status == "COMPLETED"]
    pending_visits = [v for v in all_visits if v.visit_status in ["SCHEDULED", "IN_PROGRESS"]]

    return {
        "assigned_to_me": len(assigned_to_me),
        "total_active_inspections": len(active_inspections),
        "urgent_priority_count": len(urgent_cases),
        "pending_visits_count": len(pending_visits),
        "completed_visits_count": len(completed_visits)
    }

@router.get("/officers", response_model=List[UserResponse])
async def list_available_field_officers(
    token_data: dict = Depends(require_roles(["VETERINARIAN", "FIELD_OFFICER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Lists field officers available for case assignment."""
    stmt = select(User).where(User.role == UserRole.FIELD_OFFICER).order_by(User.full_name.asc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/cases/{case_id}/assign")
async def assign_case_to_field_officer(
    case_id: int,
    assign_in: FieldOfficerCaseAssign,
    token_data: dict = Depends(require_roles(["VETERINARIAN", "FIELD_OFFICER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Assigns a case to a specific Field Officer with scheduled date and notes."""
    result = await db.execute(select(Case).where(Case.id == case_id))
    case_obj = result.scalars().first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    officer_res = await db.execute(select(User).where(User.id == assign_in.field_officer_id))
    officer = officer_res.scalars().first()
    if not officer:
        raise HTTPException(status_code=404, detail="Field officer not found")

    case_obj.assigned_officer_id = officer.id
    if case_obj.status == CaseStatus.SUBMITTED:
        case_obj.status = CaseStatus.RESPONSE_ACTIVE

    # Create scheduled visit record
    scheduled = assign_in.scheduled_date or datetime.utcnow()
    visit = FieldVisit(
        case_id=case_id,
        veterinarian_id=token_data["user_id"] if token_data["role"] == "VETERINARIAN" else None,
        field_officer_id=officer.id,
        scheduled_date=scheduled,
        visit_status="SCHEDULED",
        notes=assign_in.notes or "Scheduled for on-ground clinical and containment inspection"
    )
    db.add(visit)

    # Audit Log
    db.add(AuditLog(
        user_id=token_data["user_id"],
        action="CASE_ASSIGNED_TO_FIELD_OFFICER",
        entity_type="Case",
        entity_id=case_obj.case_number,
        details={"officer_name": officer.full_name, "scheduled_date": str(scheduled)}
    ))

    await db.commit()
    return {"message": f"Case successfully assigned to {officer.full_name}", "case_status": case_obj.status.value}

@router.post("/cases/{case_id}/visit", response_model=FieldVisitResponse)
async def submit_field_visit_report(
    case_id: int,
    visit_in: FieldVisitUpdate,
    token_data: dict = Depends(require_roles(["FIELD_OFFICER", "VETERINARIAN", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Submits on-ground observations, sample collection status, containment verification,
    and visit outcome.
    """
    result = await db.execute(select(Case).where(Case.id == case_id))
    case_obj = result.scalars().first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    visit = FieldVisit(
        case_id=case_id,
        field_officer_id=token_data["user_id"],
        scheduled_date=datetime.utcnow(),
        visit_status=visit_in.visit_status,
        observations=visit_in.observations,
        outcome=visit_in.outcome,
        containment_status=visit_in.containment_status or "COMPLIANT",
        sample_collected=visit_in.sample_collected or False,
        notes=visit_in.notes
    )
    db.add(visit)

    # Update case status based on outcome
    case_obj.status = CaseStatus.FOLLOW_UP if visit_in.visit_status == "COMPLETED" else CaseStatus.RESPONSE_ACTIVE

    db.add(AuditLog(
        user_id=token_data["user_id"],
        action="FIELD_VISIT_OUTCOME_RECORDED",
        entity_type="Case",
        entity_id=case_obj.case_number,
        details={
            "outcome": visit_in.outcome,
            "containment": visit_in.containment_status,
            "sample_collected": visit_in.sample_collected
        }
    ))

    await db.commit()
    await db.refresh(visit)
    return visit

@router.post("/cases/{case_id}/escalate")
async def escalate_case(
    case_id: int,
    esc_in: CaseEscalateRequest,
    token_data: dict = Depends(require_roles(["FIELD_OFFICER", "VETERINARIAN", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Escalates an urgent case to high emergency priority and registers a regional alert.
    """
    result = await db.execute(select(Case).where(Case.id == case_id))
    case_obj = result.scalars().first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    case_obj.ai_triage_priority = "CRITICAL"
    case_obj.ai_risk_tier = "CRITICAL"

    alert = Alert(
        title=f"Emergency Escalation: Case {case_obj.case_number}",
        message=f"Escalated by Field Officer: {esc_in.reason}",
        priority="CRITICAL",
        district=case_obj.district,
        state=case_obj.state,
        case_id=case_id,
        is_active=True
    )
    db.add(alert)

    db.add(AuditLog(
        user_id=token_data["user_id"],
        action="FIELD_CASE_EMERGENCY_ESCALATION",
        entity_type="Case",
        entity_id=case_obj.case_number,
        details={"reason": esc_in.reason, "priority": esc_in.priority}
    ))

    await db.commit()
    return {"message": "Case escalated to CRITICAL priority and regional alert broadcasted."}
