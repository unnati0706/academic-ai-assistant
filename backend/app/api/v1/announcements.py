from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db
from app.models.announcement import Announcement
from app.schemas.announcement import AnnouncementResponse

router = APIRouter(prefix="/announcements", tags=["Announcements"])

@router.get("", response_model=List[AnnouncementResponse])
def get_active_announcements(db: Session = Depends(get_db)):
    """Retrieve active system announcements (non-expired)."""
    now = datetime.now(timezone.utc)
    announcements = (
        db.query(Announcement)
        .filter(or_(Announcement.expires_at.is_(None), Announcement.expires_at > now))
        .order_by(Announcement.created_at.desc())
        .all()
    )
    return announcements
