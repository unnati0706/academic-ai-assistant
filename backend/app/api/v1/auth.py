import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.config import settings
from app.models.user import User, UserRole
from app.schemas.auth import (
    VerifyOTPRequest, LoginRequest, SignupRequest,
    TokenResponse, UserResponse
)
from app.services.auth_service import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


def _upsert_user(db: Session, email: str, role_str: str, name: str | None = None) -> User:
    """Upsert a user record in the local DB and return it."""
    target_role = UserRole.FACULTY_ADMIN if role_str in ["faculty", "faculty_admin"] else UserRole.STUDENT
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, role=target_role, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        changed = False
        if user.role != target_role:
            user.role = target_role
            changed = True
        if name and not user.name:
            user.name = name
            changed = True
        if changed:
            db.commit()
            db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Email + password login via Supabase Auth REST API."""
    supabase_url = settings.SUPABASE_URL.rstrip("/")
    anon_key = settings.SUPABASE_SERVICE_ROLE_KEY

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"{supabase_url}/auth/v1/token?grant_type=password",
            headers={
                "apikey": anon_key,
                "Content-Type": "application/json",
            },
            json={"email": payload.email, "password": payload.password},
        )

    if resp.status_code != 200:
        body = resp.json()
        detail = body.get("error_description") or body.get("msg") or body.get("error") or "Invalid email or password."
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

    data = resp.json()
    access_token = data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Login failed: no token returned.")

    user = _upsert_user(db, payload.email, payload.role)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/signup", response_model=TokenResponse)
async def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """Email + password signup via Supabase Auth REST API."""
    supabase_url = settings.SUPABASE_URL.rstrip("/")
    anon_key = settings.SUPABASE_SERVICE_ROLE_KEY

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"{supabase_url}/auth/v1/signup",
            headers={
                "apikey": anon_key,
                "Content-Type": "application/json",
            },
            json={
                "email": payload.email,
                "password": payload.password,
                "data": {
                    "name": payload.name,
                    "role": payload.role,
                    "department": payload.department,
                    "semester": payload.semester,
                },
            },
        )

    body = resp.json()

    if resp.status_code not in (200, 201):
        detail = body.get("error_description") or body.get("msg") or body.get("error") or "Signup failed."
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

    # Supabase returns session immediately when email confirmation is disabled
    access_token = body.get("access_token")
    if not access_token:
        # Email confirmation required — no session yet
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail="CONFIRM_EMAIL",
        )

    user = _upsert_user(db, payload.email, payload.role, name=payload.name)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify Supabase OTP / login token and retrieve or register local DB user."""
    email = payload.email
    user = _upsert_user(db, email, payload.role or "student")
    return TokenResponse(
        access_token=payload.token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details for the current authenticated user."""
    return current_user
