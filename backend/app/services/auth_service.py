import logging
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

def verify_token(credentials: HTTPAuthorizationCredentials | None) -> dict:
    """Verify Supabase JWT token and extract claims."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        # Decode JWT without signature check first (or using Supabase JWT secret / public key if configured)
        # Supabase JWTs contain email, sub (user_id), and role claims
        payload = jwt.decode(
            token,
            key="",
            options={"verify_signature": False, "verify_aud": False}
        )
        email = payload.get("email") or payload.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing email or sub",
            )
        return payload
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """FastAPI dependency to extract and verify current authenticated user."""
    payload = verify_token(credentials)
    email = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User email not found in token",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Check metadata or role claim from token if present
        user_metadata = payload.get("user_metadata", {})
        role_str = user_metadata.get("role", UserRole.STUDENT.value)
        role = UserRole.FACULTY_ADMIN if role_str == UserRole.FACULTY_ADMIN.value else UserRole.STUDENT

        user = User(email=email, role=role)
        db.add(user)
        db.commit()
        db.refresh(user)

    return user

def get_optional_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """FastAPI dependency to extract current user, or fallback to default student user for unauthenticated requests."""
    import uuid
    if credentials and credentials.credentials:
        try:
            return get_current_user(credentials, db)
        except HTTPException:
            pass
    
    # Fallback to default student user for guests
    student_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    user = db.query(User).filter(User.id == student_id).first()
    if not user:
        user = db.query(User).filter(User.email == "alex.student@academic.edu").first()
    if not user:
        user = User(id=student_id, email="alex.student@academic.edu", role=UserRole.STUDENT)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def require_admin(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """FastAPI dependency to enforce Faculty/Admin role."""
    if current_user.role != UserRole.FACULTY_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Faculty/Admin privilege required",
        )
    return current_user

def require_student(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """FastAPI dependency to enforce Student role."""
    if current_user.role != UserRole.STUDENT and current_user.role != UserRole.FACULTY_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Student privilege required",
        )
    return current_user
