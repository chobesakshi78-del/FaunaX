"""
FAUNA-X: Admin & Audit Logging API Routes
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.core.database import get_db
from backend.app.core.security import require_roles
from backend.app.models.models import AuditLog, User, Case

router = APIRouter(prefix="/admin", tags=["Admin & System Audit"])

@router.get("/audit-logs", dependencies=[Depends(require_roles(["ADMIN", "GOVERNMENT"]))])
async def list_audit_logs(
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    logs = result.scalars().all()
    return logs

@router.get("/users", dependencies=[Depends(require_roles(["ADMIN"]))])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()
