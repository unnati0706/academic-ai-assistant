import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import ChatRequest, ChatResponse, ChatSessionResponse, ChatMessageResponse, DocumentMetadata
from app.services.auth_service import get_optional_current_user
from app.services.rag_service import rag_service

router = APIRouter(prefix="/chat", tags=["RAG AI Chat"])

@router.post("", response_model=ChatResponse)
def ask_question(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user)
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

@router.post("/upload", response_model=ChatResponse)
async def ask_question_with_uploaded_file(
    file: UploadFile = File(...),
    question: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user)
):
    """
    Upload document to chat session. Performs true in-memory RAG:
    - Extracts all pages via OCR pipeline
    - Chunks document into semantic segments
    - Embeds & cosine-ranks chunks against user question
    - Returns structured multi-section LLM analysis + document intelligence metadata
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    parsed_session_id = None
    if session_id and session_id.strip():
        try:
            parsed_session_id = uuid.UUID(session_id.strip())
        except ValueError:
            parsed_session_id = None

    result = rag_service.answer_question_with_file(
        db=db,
        user_id=current_user.id,
        file_bytes=file_bytes,
        filename=file.filename or "uploaded_document.pdf",
        question=question,
        session_id=parsed_session_id
    )

    # Wrap document_metadata into DocumentMetadata schema if present
    if result.get("document_metadata"):
        dm = result["document_metadata"]
        result["document_metadata"] = DocumentMetadata(
            filename=dm.get("filename", file.filename or "document"),
            page_count=dm.get("page_count", 0),
            word_count=dm.get("word_count", 0),
            char_count=dm.get("char_count", 0),
            key_topics=dm.get("key_topics", []),
            sections_found=dm.get("sections_found", [])
        )

    return result

@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user)
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
    current_user: User = Depends(get_optional_current_user)
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
