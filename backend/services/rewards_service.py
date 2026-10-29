"""Carbon Coins Ledger and Rewards Redemption Service.
Maintains an immutable transaction ledger and processes coupon redemptions.
"""

import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from backend.database import get_db_connection


class RewardsService:
    """Manages the Carbon Coins immutable ledger, tiers, and coupon redemptions."""

    TIERS = [
        {"name": "Bronze", "min_coins": 0, "max_coins": 100, "perk": "5% bonus discount on green coupons"},
        {"name": "Silver", "min_coins": 101, "max_coins": 300, "perk": "10% bonus + Free Metro Pass draw"},
        {"name": "Gold", "min_coins": 301, "max_coins": 700, "perk": "15% partner discount + Fast Track verification"},
        {"name": "Green Champion", "min_coins": 701, "max_coins": 999999, "perk": "Exclusive Tree Planting Certificate & VIP Partner Rewards"},
    ]

    @staticmethod
    def get_tier_info(balance: int) -> Dict[str, Any]:
        for t in RewardsService.TIERS:
            if t["min_coins"] <= balance <= t["max_coins"]:
                next_tier_target = t["max_coins"] + 1 if t["name"] != "Green Champion" else None
                progress = min(100, int((balance / max(1, t["max_coins"])) * 100))
                return {
                    "current_tier": t["name"],
                    "perk": t["perk"],
                    "progress_pct": progress,
                    "next_tier_coins": next_tier_target,
                }
        return {"current_tier": "Bronze", "perk": "Welcome Tier", "progress_pct": 20, "next_tier_coins": 101}

    @staticmethod
    def get_user_balance(user_id: int) -> int:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM coin_transactions WHERE user_id = ?", (user_id,))
            return cursor.fetchone()[0]

    @staticmethod
    def redeem_reward(user_id: int, reward_id: int) -> Dict[str, Any]:
        """Atomically checks balance, deducts coins, and issues a unique coupon voucher."""
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # 1. Fetch reward item
            cursor.execute("SELECT * FROM reward_catalog WHERE id = ? AND active = 1", (reward_id,))
            reward = cursor.fetchone()
            if not reward:
                raise ValueError("Reward not found or currently inactive.")

            coin_cost = reward["coin_cost"]

            # 2. Check current balance atomically
            cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM coin_transactions WHERE user_id = ?", (user_id,))
            current_balance = cursor.fetchone()[0]

            if current_balance < coin_cost:
                raise ValueError(
                    f"Insufficient Carbon Coins. This reward requires {coin_cost} coins, but your balance is {current_balance}."
                )

            # 3. Generate unique coupon code
            prefix = reward["coupon_prefix"] or "CK2"
            random_suffix = secrets.token_hex(3).upper()
            coupon_code = f"{prefix}-{random_suffix}-{secrets.randbelow(899) + 100}"
            expires_at = datetime.utcnow() + timedelta(days=reward["expiry_days"] or 30)

            # 4. Record transaction in ledger
            new_balance = current_balance - coin_cost
            cursor.execute(
                """
                INSERT INTO coin_transactions (
                    user_id, account_type, target_id, amount, transaction_type, reason, balance_after, reference_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    "individual",
                    user_id,
                    -coin_cost,
                    "redeemed_coupon",
                    f"Redeemed '{reward['title']}' coupon ({reward['provider']})",
                    new_balance,
                    coupon_code,
                ),
            )

            # 5. Insert redemption record
            cursor.execute(
                """
                INSERT INTO reward_redemptions (
                    user_id, reward_id, coupon_code, coins_spent, status, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, reward_id, coupon_code, coin_cost, "active", expires_at.strftime("%Y-%m-%d %H:%M:%S")),
            )
            redemption_id = cursor.lastrowid
            conn.commit()

        return {
            "redemption_id": redemption_id,
            "coupon_code": coupon_code,
            "title": reward["title"],
            "provider": reward["provider"],
            "discount_description": reward["discount_description"],
            "coins_spent": coin_cost,
            "new_balance": new_balance,
            "expires_at": expires_at.strftime("%Y-%m-%d"),
            "terms": reward["terms"],
        }
