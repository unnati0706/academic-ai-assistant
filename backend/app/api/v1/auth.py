from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, UserRole
from app.schemas.auth import VerifyOTPRequest, TokenResponse, UserResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify Supabase OTP / login token and retrieve or register local DB user."""
    email = payload.email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Register new student user by default upon first login
        user = User(email=email, role=UserRole.STUDENT)
        db.add(user)
        db.commit()
        db.refresh(user)

    return TokenResponse(
        access_token=payload.token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details for the current authenticated user."""
    return current_user
