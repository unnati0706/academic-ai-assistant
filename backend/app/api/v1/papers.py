import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db
from app.models.question_paper import QuestionPaper
from app.models.subject import Subject
from app.schemas.question_paper import QuestionPaperResponse

router = APIRouter(prefix="/papers", tags=["Question Papers"])

@router.get("", response_model=List[QuestionPaperResponse])
def get_question_papers(
    semester: Optional[int] = Query(None, description="Filter by semester"),
    subject_id: Optional[uuid.UUID] = Query(None, description="Filter by subject ID"),
    exam_type: Optional[str] = Query(None, description="Filter by exam type (mid-sem, university)"),
    year: Optional[int] = Query(None, description="Filter by year"),
    search: Optional[str] = Query(None, description="Search in title"),
    db: Session = Depends(get_db)
):
    """Retrieve list of question papers with optional query filters."""
    query = db.query(QuestionPaper, Subject).join(Subject, QuestionPaper.subject_id == Subject.id)

    if semester is not None:
        query = query.filter(QuestionPaper.semester == semester)
    if subject_id is not None:
        query = query.filter(QuestionPaper.subject_id == subject_id)
    if exam_type is not None:
        query = query.filter(QuestionPaper.exam_type == exam_type)
    if year is not None:
        query = query.filter(QuestionPaper.year == year)
    if search:
        query = query.filter(QuestionPaper.title.ilike(f"%{search}%"))

    results = query.all()
    papers_response = []
    for paper, subject in results:
        res = QuestionPaperResponse.model_validate(paper)
        res.subject_code = subject.code
        res.subject_name = subject.name
        papers_response.append(res)

    return papers_response
