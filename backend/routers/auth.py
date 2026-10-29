"""FastAPI router for Authentication and Session Handling."""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field

from backend.services.auth_service import AuthService, verify_session_token

router = APIRouter(prefix="/api/auth", tags=["Authentication & Accounts"])


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=3, max_length=120)
    password: str = Field(..., min_length=6)
    account_type: str = Field("individual", description="individual | family | organization")
    city: str = "Delhi"
    state: str = "Delhi"
    preferred_language: str = "en"
    extra_data: Optional[Dict[str, Any]] = None


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=120)
    password: str


class DemoLoginRequest(BaseModel):
    account_type: str = Field("individual", description="individual | family | organization")


def get_authenticated_user_id(authorization: Optional[str] = Header(None)) -> Optional[int]:
    """Helper to extract user_id from Bearer token header."""
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    payload = verify_session_token(token)
    return payload.get("uid") if payload else None


@router.post("/register", summary="Register an Individual, Family, or Organization account")
def register(req: RegisterRequest):
    try:
        return AuthService.register_user(
            name=req.name,
            email=req.email,
            password=req.password,
            account_type=req.account_type,
            city=req.city,
            state=req.state,
            preferred_language=req.preferred_language,
            extra_data=req.extra_data,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Registration failed: {str(e)}")


@router.post("/login", summary="Log in with email and password")
def login(req: LoginRequest):
    try:
        return AuthService.authenticate_user(email=req.email, password=req.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Login failed: {str(e)}")


@router.get("/me", summary="Get profile of currently logged-in user")
def get_me(authorization: Optional[str] = Header(None)):
    uid = get_authenticated_user_id(authorization)
    if not uid:
        # Fallback to demo individual profile so demo mode is completely friction-free
        uid = 1
    profile = AuthService.get_current_user_profile(uid)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return profile


@router.post("/demo-login", summary="Instant 1-click switch to verified Demo account")
def demo_login(req: DemoLoginRequest):
    """Provides instant authenticated session for hackathon judges."""
    acct = req.account_type.lower()
    demo_emails = {
        "individual": "arjun.demo@carbonkatha.in",
        "family": "sharma.family@carbonkatha.in",
        "organization": "ecocorp.hq@carbonkatha.in",
    }
    email = demo_emails.get(acct, "arjun.demo@carbonkatha.in")
    try:
        return AuthService.authenticate_user(email=email, password="DemoUser@2026")
    except ValueError:
        # If demo user not yet seeded, register on-the-fly
        names = {
            "individual": "Arjun Rao (Demo Climber)",
            "family": "Sharma Household (4 Members)",
            "organization": "EcoCorp Technologies India Ltd",
        }
        return AuthService.register_user(
            name=names.get(acct, "Demo User"),
            email=email,
            password="DemoUser@2026",
            account_type=acct,
            city="Bengaluru" if acct == "individual" else ("Delhi" if acct == "family" else "Mumbai"),
            state="Karnataka" if acct == "individual" else ("Delhi" if acct == "family" else "Maharashtra"),
            preferred_language="en",
            extra_data={
                "household_name": "Sharma Green Nest",
                "member_count": 4,
                "organization_name": "EcoCorp Technologies India Ltd",
                "employee_count": 85,
            },
        )


@router.post("/logout", summary="Log out user session")
def logout():
    return {"status": "success", "message": "Logged out successfully"}
