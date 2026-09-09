from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.admin import router as admin_router
from app.api.v1.materials import router as materials_router
from app.api.v1.papers import router as papers_router
from app.api.v1.announcements import router as announcements_router
from app.api.v1.chat import router as chat_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(materials_router)
api_router.include_router(papers_router)
api_router.include_router(announcements_router)
api_router.include_router(chat_router)
