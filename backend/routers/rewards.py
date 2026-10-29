"""FastAPI router for Rewards Marketplace, Carbon Coins Ledger, and Redemptions."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field

from backend.database import get_db_connection
from backend.routers.auth import get_authenticated_user_id
from backend.services.rewards_service import RewardsService

router = APIRouter(prefix="/api/rewards", tags=["Rewards & Carbon Coins"])


class RedeemRequest(BaseModel):
    reward_id: int = Field(..., gt=0)


@router.get("/dashboard", summary="Comprehensive rewards overview with tier progress and voucher wallet")
def get_rewards_dashboard(authorization: Optional[str] = Header(None)):
    uid = get_authenticated_user_id(authorization) or 1
    balance = RewardsService.get_user_balance(uid)
    tier_info = RewardsService.get_tier_info(balance)

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Available Catalog
        cursor.execute("SELECT * FROM reward_catalog WHERE active = 1 ORDER BY coin_cost ASC")
        catalog = [dict(r) for r in cursor.fetchall()]

        # User's Redeemed Vouchers
        cursor.execute(
            """
            SELECT rr.id, rr.coupon_code, rr.coins_spent, rr.status, rr.expires_at, rr.created_at,
                   rc.title, rc.provider, rc.category, rc.discount_description, rc.terms
            FROM reward_redemptions rr
            JOIN reward_catalog rc ON rc.id = rr.reward_id
            WHERE rr.user_id = ?
            ORDER BY rr.id DESC
            """,
            (uid,),
        )
        my_vouchers = [dict(r) for r in cursor.fetchall()]

        # Recent Transactions in Ledger
        cursor.execute(
            """
            SELECT id, amount, transaction_type, reason, balance_after, reference_id, created_at
            FROM coin_transactions
            WHERE user_id = ?
            ORDER BY id DESC LIMIT 15
            """,
            (uid,),
        )
        transactions = [dict(r) for r in cursor.fetchall()]

    return {
        "balance": balance,
        "tier": tier_info["current_tier"],
        "perk": tier_info["perk"],
        "progress_pct": tier_info["progress_pct"],
        "next_tier_coins": tier_info["next_tier_coins"],
        "catalog": catalog,
        "my_vouchers": my_vouchers,
        "transactions": transactions,
    }


@router.post("/redeem", summary="Atomically redeem Carbon Coins for a partner coupon")
def redeem_coupon(req: RedeemRequest, authorization: Optional[str] = Header(None)):
    uid = get_authenticated_user_id(authorization) or 1
    try:
        return RewardsService.redeem_reward(user_id=uid, reward_id=req.reward_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Redemption failed: {str(e)}")


@router.get("/catalog", summary="List all active rewards in marketplace")
def list_catalog():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reward_catalog WHERE active = 1 ORDER BY coin_cost ASC")
        return [dict(r) for r in cursor.fetchall()]


@router.get("/my-vouchers", summary="Get redeemed coupons in user wallet")
def get_my_vouchers(authorization: Optional[str] = Header(None)):
    uid = get_authenticated_user_id(authorization) or 1
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT rr.*, rc.title, rc.provider, rc.category, rc.discount_description
            FROM reward_redemptions rr
            JOIN reward_catalog rc ON rc.id = rr.reward_id
            WHERE rr.user_id = ?
            ORDER BY rr.id DESC
            """,
            (uid,),
        )
        return [dict(r) for r in cursor.fetchall()]
