import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import ChatRequest, ChatResponse, ChatSessionResponse, ChatMessageResponse
from app.services.auth_service import get_current_user
from app.services.rag_service import rag_service

router = APIRouter(prefix="/chat", tags=["RAG AI Chat"])

@router.post("", response_model=ChatResponse)
def ask_question(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Post question to AcademicAI RAG assistant. Retrieves context chunks & generates response with citations."""
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    result = rag_service.answer_question(
        db=db,
        user_id=current_user.id,
        question=payload.question,
        session_id=payload.session_id
    )
    return result

@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all past chat sessions for current user."""
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    return sessions

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_chat_session_details(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch chat history for a specific session."""
    session_obj = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session_obj:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session_obj
