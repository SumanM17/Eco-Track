"""Authentication and Account Management Service for CarbonKatha 2.0.
Supports Individual, Family/Household, and Organization accounts.
Uses standard library PBKDF2-HMAC-SHA256 for secure password hashing.
"""

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any, Dict, Optional, Tuple

from backend.database import get_db_connection

SECRET_KEY = os.environ.get("CARBONKATHA_SECRET_KEY", "carbonkatha-2.0-jwt-secret-key-2026")


def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """Hashes a password with PBKDF2-HMAC-SHA256 using a cryptographic salt."""
    if not salt:
        salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations=100000,
    )
    return base64.b64encode(pw_hash).decode("utf-8"), salt


def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    """Verifies a plain text password against stored PBKDF2 hash."""
    computed_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(stored_hash, computed_hash)


def create_session_token(user_id: int, account_type: str, email: str) -> str:
    """Generates a signed HMAC token containing user metadata and expiration."""
    payload = {
        "uid": user_id,
        "type": account_type,
        "email": email,
        "exp": int(time.time()) + (86400 * 7),  # 7 days valid
    }
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    signature = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"


def verify_session_token(token: str) -> Optional[Dict[str, Any]]:
    """Verifies token integrity and expiration."""
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, signature = parts
        expected_sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return None
        payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode()).decode())
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload
    except Exception:
        return None


class AuthService:
    """Handles registration, authentication, and user context retrieval."""

    @staticmethod
    def register_user(
        name: str,
        email: str,
        password: str,
        account_type: str,
        city: str = "Delhi",
        state: str = "Delhi",
        preferred_language: str = "en",
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Registers an account (Individual, Family, or Organization)."""
        extra_data = extra_data or {}
        email = email.lower().strip()
        account_type = account_type.lower().strip()
        if account_type not in ("individual", "family", "organization"):
            account_type = "individual"

        pw_hash, salt = hash_password(password)

        with get_db_connection() as conn:
            cursor = conn.cursor()
            # Check existing email
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            if cursor.fetchone():
                raise ValueError("An account with this email address already exists.")

            cursor.execute(
                """
                INSERT INTO users (
                    email, password_hash, salt, name, account_type,
                    city, state, preferred_language
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (email, pw_hash, salt, name, account_type, city, state, preferred_language),
            )
            user_id = cursor.lastrowid

            household_id = None
            org_id = None

            # If Family/Household account, create household record
            if account_type == "family":
                hh_name = extra_data.get("household_name", f"{name}'s Family")
                members = int(extra_data.get("member_count", 4))
                cursor.execute(
                    """
                    INSERT INTO households (name, primary_holder_id, member_count, city, state, household_type)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (hh_name, user_id, members, city, state, extra_data.get("household_type", "apartment")),
                )
                household_id = cursor.lastrowid
                cursor.execute(
                    "INSERT INTO household_members (household_id, user_id, role) VALUES (?, ?, ?)",
                    (household_id, user_id, "admin"),
                )

            # If Organization account, create organization record and default headquarters facility
            elif account_type == "organization":
                org_name = extra_data.get("organization_name", f"{name} Enterprise")
                emp_count = int(extra_data.get("employee_count", 25))
                cursor.execute(
                    """
                    INSERT INTO organizations (name, org_type, industry, employee_count, city, state, contact_email, size_category)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        org_name,
                        extra_data.get("org_type", "technology"),
                        extra_data.get("industry", "IT & Cloud Services"),
                        emp_count,
                        city,
                        state,
                        email,
                        extra_data.get("size_category", "sme"),
                    ),
                )
                org_id = cursor.lastrowid
                cursor.execute(
                    "INSERT INTO organization_members (org_id, user_id, role) VALUES (?, ?, ?)",
                    (org_id, user_id, "admin"),
                )
                # Seed default branch facility
                cursor.execute(
                    """
                    INSERT INTO facilities (org_id, name, location, facility_type, area_sqft)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (org_id, f"{city} Headquarters", f"{city}, {state}", "headquarters", 6500.0),
                )

            # Award 50 welcome Carbon Coins
            target_id = household_id if account_type == "family" else (org_id if account_type == "organization" else user_id)
            cursor.execute(
                """
                INSERT INTO coin_transactions (
                    user_id, account_type, target_id, amount, transaction_type, reason, balance_after, reference_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (user_id, account_type, target_id, 50, "admin_adjustment", "Welcome to CarbonKatha 2.0!", 50, f"welcome_{user_id}"),
            )

            conn.commit()

        token = create_session_token(user_id, account_type, email)
        return {
            "token": token,
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
                "account_type": account_type,
                "city": city,
                "state": state,
                "preferred_language": preferred_language,
                "household_id": household_id,
                "org_id": org_id,
                "coin_balance": 50,
            },
        }

    @staticmethod
    def authenticate_user(email: str, password: str) -> Dict[str, Any]:
        """Validates credentials and returns session token with user context."""
        email = email.lower().strip()
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, email, password_hash, salt, name, account_type, city, state, preferred_language, is_demo_user
                FROM users WHERE email = ?
                """,
                (email,),
            )
            user_row = cursor.fetchone()
            if not user_row:
                raise ValueError("Invalid email or password.")

            if not verify_password(password, user_row["password_hash"], user_row["salt"]):
                raise ValueError("Invalid email or password.")

            user_id = user_row["id"]
            account_type = user_row["account_type"]

            household_id = None
            org_id = None

            if account_type == "family":
                cursor.execute("SELECT household_id FROM household_members WHERE user_id = ? LIMIT 1", (user_id,))
                hm_row = cursor.fetchone()
                if hm_row:
                    household_id = hm_row["household_id"]

            elif account_type == "organization":
                cursor.execute("SELECT org_id FROM organization_members WHERE user_id = ? LIMIT 1", (user_id,))
                om_row = cursor.fetchone()
                if om_row:
                    org_id = om_row["org_id"]

            # Calculate live coin balance
            target_id = household_id if account_type == "family" else (org_id if account_type == "organization" else user_id)
            cursor.execute(
                """
                SELECT COALESCE(SUM(amount), 0) FROM coin_transactions
                WHERE user_id = ? OR (account_type = ? AND target_id = ?)
                """,
                (user_id, account_type, target_id),
            )
            balance = cursor.fetchone()[0]

        token = create_session_token(user_id, account_type, email)
        return {
            "token": token,
            "user": {
                "id": user_id,
                "name": user_row["name"],
                "email": user_row["email"],
                "account_type": account_type,
                "city": user_row["city"],
                "state": user_row["state"],
                "preferred_language": user_row["preferred_language"],
                "household_id": household_id,
                "org_id": org_id,
                "coin_balance": balance,
            },
        }

    @staticmethod
    def get_current_user_profile(user_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves profile, linked organizations/households, and coin balance."""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, email, name, account_type, city, state, preferred_language, is_demo_user
                FROM users WHERE id = ?
                """,
                (user_id,),
            )
            u = cursor.fetchone()
            if not u:
                return None

            account_type = u["account_type"]
            household_info = None
            org_info = None

            if account_type == "family":
                cursor.execute(
                    """
                    SELECT h.id, h.name, h.member_count, h.city, h.state, h.household_type
                    FROM households h
                    JOIN household_members hm ON hm.household_id = h.id
                    WHERE hm.user_id = ? LIMIT 1
                    """,
                    (user_id,),
                )
                h_row = cursor.fetchone()
                if h_row:
                    household_info = dict(h_row)

            elif account_type == "organization":
                cursor.execute(
                    """
                    SELECT o.id, o.name, o.org_type, o.industry, o.employee_count, o.city, o.state, o.size_category
                    FROM organizations o
                    JOIN organization_members om ON om.org_id = o.id
                    WHERE om.user_id = ? LIMIT 1
                    """,
                    (user_id,),
                )
                o_row = cursor.fetchone()
                if o_row:
                    org_info = dict(o_row)

            # Calculate total coins
            cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM coin_transactions WHERE user_id = ?", (user_id,))
            balance = cursor.fetchone()[0]

            return {
                "id": u["id"],
                "name": u["name"],
                "email": u["email"],
                "account_type": account_type,
                "city": u["city"],
                "state": u["state"],
                "preferred_language": u["preferred_language"],
                "is_demo_user": bool(u["is_demo_user"]),
                "household": household_info,
                "organization": org_info,
                "coin_balance": balance,
            }
