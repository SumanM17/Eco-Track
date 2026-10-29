"""FastAPI router for Personal, Family, and Organization Carbon Activities."""

from datetime import date
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Header, HTTPException, Query, status
from pydantic import BaseModel, Field

from backend.database import get_db_connection
from backend.routers.auth import get_authenticated_user_id
from backend.services.calculation_engine import CalculationEngine

router = APIRouter(prefix="/api/activities", tags=["Carbon Activities"])


class ActivityCreateRequest(BaseModel):
    category: str = Field(..., description="electricity | transport | fuel | food | waste | shopping | water")
    item: str = Field(..., min_length=1, max_length=100)
    quantity: Optional[float] = None
    value: Optional[float] = None
    unit: Optional[str] = "units"
    activity_date: Optional[str] = None
    date: Optional[str] = None
    account_type: Optional[str] = "individual"  # individual | family | organization
    accountType: Optional[str] = None
    target_id: Optional[int] = None
    targetId: Optional[int] = None
    branch_id: Optional[int] = None
    is_shared_record: Optional[bool] = False
    evidence_status: Optional[str] = "not_supported"
    notes: Optional[str] = None


class ActivityUpdateRequest(BaseModel):
    item: Optional[str] = None
    quantity: Optional[float] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    activity_date: Optional[str] = None
    date: Optional[str] = None
    notes: Optional[str] = None


@router.post("/", summary="Record a daily carbon activity across any category")
def create_activity(req: ActivityCreateRequest, authorization: Optional[str] = Header(None)):
    uid = get_authenticated_user_id(authorization) or 1
    qty = float(req.quantity if req.quantity is not None else (req.value if req.value is not None else 1.0))
    act_date = req.activity_date or req.date or str(date.today())
    reporting_period = act_date[:7]  # 'YYYY-MM'
    unit_str = req.unit or "units"
    acc_type = req.account_type or req.accountType or "individual"
    cat = (req.category or "electricity").lower().strip()
    t_id = req.target_id or req.targetId or uid

    # Compute emissions deterministically
    co2_kg, factor, method = CalculationEngine.compute_activity(
        category=cat,
        item=req.item,
        quantity=qty,
        unit=unit_str,
    )

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO activity_records (
                user_id, account_type, target_id, branch_id,
                category, item, quantity, unit, activity_date, reporting_period,
                calculated_co2_kg, emission_factor, methodology_version,
                is_shared_record, evidence_status, is_verified, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                uid,
                acc_type,
                t_id,
                req.branch_id,
                cat,
                req.item,
                qty,
                unit_str,
                act_date,
                reporting_period,
                co2_kg,
                factor,
                method,
                1 if req.is_shared_record else 0,
                req.evidence_status or "not_supported",
                1 if req.evidence_status == "verified" else 0,
                req.notes,
            ),
        )
        act_id = cursor.lastrowid
        conn.commit()

    return {
        "id": act_id,
        "category": cat,
        "item": req.item,
        "quantity": qty,
        "value": qty,
        "unit": unit_str,
        "calculated_co2_kg": co2_kg,
        "emission_factor": factor,
        "methodology": method,
        "activity_date": act_date,
        "date": act_date,
        "evidence_status": req.evidence_status,
    }


@router.get("/", summary="List recorded activities with filters")
def list_activities(
    category: Optional[str] = None,
    account_type: Optional[str] = None,
    reporting_period: Optional[str] = None,
    limit: int = Query(50, le=200),
    authorization: Optional[str] = Header(None),
):
    uid = get_authenticated_user_id(authorization) or 1
    with get_db_connection() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM activity_records WHERE user_id = ?"
        params: List[Any] = [uid]

        if category:
            query += " AND category = ?"
            params.append(category.lower())
        if account_type:
            query += " AND account_type = ?"
            params.append(account_type.lower())
        if reporting_period:
            query += " AND reporting_period = ?"
            params.append(reporting_period)

        query += " ORDER BY activity_date DESC, id DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["value"] = d.get("quantity", 1.0)
            d["date"] = d.get("activity_date")
            result.append(d)
        return result


@router.delete("/{activity_id}", summary="Delete an activity record")
def delete_activity(activity_id: int, authorization: Optional[str] = Header(None)):
    uid = get_authenticated_user_id(authorization) or 1
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM activity_records WHERE id = ? AND user_id = ?", (activity_id, uid))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Activity not found or unauthorized.")
        conn.commit()
    return {"status": "success", "deleted_id": activity_id}


@router.get("/summary", summary="Get aggregated carbon footprint summary for current user/account")
def get_summary(
    account_type: str = "individual",
    target_id: Optional[int] = None,
    reporting_period: Optional[str] = None,
    authorization: Optional[str] = Header(None),
):
    uid = get_authenticated_user_id(authorization) or 1
    t_id = target_id or uid

    with get_db_connection() as conn:
        cursor = conn.cursor()
        if reporting_period:
            cursor.execute(
                """
                SELECT * FROM activity_records
                WHERE (user_id = ? OR (account_type = ? AND target_id = ?))
                  AND reporting_period = ?
                """,
                (uid, account_type, t_id, reporting_period),
            )
        else:
            cursor.execute(
                """
                SELECT * FROM activity_records
                WHERE (user_id = ? OR (account_type = ? AND target_id = ?))
                """,
                (uid, account_type, t_id),
            )
        records = [dict(r) for r in cursor.fetchall()]

    return CalculationEngine.calculate_summary(records)


@router.get("/comparison", summary="Compare current reporting period against previous period")
def get_comparison(
    current_period: Optional[str] = None,
    previous_period: Optional[str] = None,
    account_type: str = "individual",
    authorization: Optional[str] = Header(None),
):
    uid = get_authenticated_user_id(authorization) or 1
    curr = current_period or str(date.today())[:7]
    # Default previous month
    if not previous_period:
        parts = curr.split("-")
        yr, mo = int(parts[0]), int(parts[1])
        if mo == 1:
            prev = f"{yr-1}-12"
        else:
            prev = f"{yr}-{mo-1:02d}"
    else:
        prev = previous_period

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM activity_records WHERE user_id = ? AND reporting_period = ?",
            (uid, curr),
        )
        curr_records = [dict(r) for r in cursor.fetchall()]

        cursor.execute(
            "SELECT * FROM activity_records WHERE user_id = ? AND reporting_period = ?",
            (uid, prev),
        )
        prev_records = [dict(r) for r in cursor.fetchall()]

    return CalculationEngine.compare_periods(curr_records, prev_records, user_type=account_type)
