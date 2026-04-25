# Health routes — used by Cloud Run and load balancer to verify the service is alive
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

router = APIRouter()


@router.get("/health")
async def health():
    # Liveness — just checks the process is running, no DB needed
    return {"status": "ok"}


@router.get("/health/db")
async def health_db(db: AsyncSession = Depends(get_db)):
    # Readiness — confirms Postgres connection is alive before accepting traffic
    await db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "connected"}
