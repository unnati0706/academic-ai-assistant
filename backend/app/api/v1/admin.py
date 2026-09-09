import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.subject import Subject
from app.models.material import Material
from app.models.question_paper import QuestionPaper
from app.models.announcement import Announcement

from app.schemas.auth import StudentCreate, StudentUpdate, StudentResponse
from app.schemas.material import SubjectCreate, SubjectResponse, MaterialResponse
from app.schemas.question_paper import QuestionPaperResponse
from app.schemas.announcement import AnnouncementCreate, AnnouncementResponse

from app.services.auth_service import require_admin
from app.services.storage_service import storage_service
from app.services.rag_service import rag_service

router = APIRouter(prefix="/admin", tags=["Faculty/Admin Management"])

# --- Student Management ---
@router.get("/students", response_model=List[StudentResponse])
def list_students(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all student profiles (Admin only)."""
    students = db.query(Student).all()
    return students

@router.post("/students", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new student profile and linked user record (Admin only)."""
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        user = existing_user
    else:
        user = User(email=payload.email, phone=payload.phone, role=UserRole.STUDENT)
        db.add(user)
        db.commit()
        db.refresh(user)

    existing_student = db.query(Student).filter(Student.roll_number == payload.roll_number).first()
    if existing_student:
        raise HTTPException(status_code=400, detail="Student with this roll number already exists.")

    student = Student(
        user_id=user.id,
        name=payload.name,
        roll_number=payload.roll_number,
        semester=payload.semester,
        division=payload.division,
        branch=payload.branch,
        status="active"
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

@router.put("/students/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: uuid.UUID,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update student profile details (Admin only)."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(student, field, val)

    db.commit()
    db.refresh(student)
    return student

@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete student profile (Admin only)."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()

# --- Subject Management ---
@router.post("/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new academic subject (Admin only)."""
    existing = db.query(Subject).filter(Subject.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Subject with code '{payload.code}' already exists.")

    subject = Subject(
        name=payload.name,
        code=payload.code,
        semester=payload.semester,
        branch=payload.branch
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject

@router.get("/subjects", response_model=List[SubjectResponse])
def list_admin_subjects(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all registered subjects (Admin only)."""
    return db.query(Subject).all()

# --- Material Upload & RAG Ingestion ---
@router.post("/materials", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_material(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    subject_id: uuid.UUID = Form(...),
    semester: int = Form(...),
    unit: Optional[int] = Form(None),
    material_type: str = Form(...),  # syllabus, notes, reference, assignment
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Upload material file, store in Supabase Storage, and trigger RAG ingestion (Admin only)."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    # 1. Upload to Supabase Storage
    file_url = storage_service.upload_file(file_bytes, file.filename, content_type=file.content_type or "application/pdf")

    # 2. Insert Material record
    material = Material(
        title=title,
        description=description,
        subject_id=subject_id,
        semester=semester,
        unit=unit,
        material_type=material_type,
        file_url=file_url,
        uploaded_by=admin.id,
        version=1,
        status="active"
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    # 3. RAG Ingestion if file is PDF
    if file.filename.lower().endswith(".pdf") or "pdf" in (file.content_type or "").lower():
        try:
            rag_service.ingest_document(db, material.id, file_bytes)
        except Exception as e:
            # Non-blocking log error
            print(f"RAG Ingestion warning for material {material.id}: {e}")

    response_data = MaterialResponse.model_validate(material)
    response_data.subject_code = subject.code
    response_data.subject_name = subject.name
    return response_data

# --- Question Paper Upload ---
@router.post("/papers", response_model=QuestionPaperResponse, status_code=status.HTTP_201_CREATED)
async def upload_question_paper(
    title: str = Form(...),
    subject_id: uuid.UUID = Form(...),
    exam_type: str = Form(...),  # mid-sem, university
    year: int = Form(...),
    semester: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Upload question paper file to Supabase storage (Admin only)."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    file_url = storage_service.upload_file(file_bytes, file.filename, content_type=file.content_type or "application/pdf")

    paper = QuestionPaper(
        title=title,
        subject_id=subject_id,
        exam_type=exam_type,
        year=year,
        semester=semester,
        file_url=file_url
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)

    res = QuestionPaperResponse.model_validate(paper)
    res.subject_code = subject.code
    res.subject_name = subject.name
    return res

# --- Announcement Management ---
@router.post("/announcements", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create system announcement (Admin only)."""
    announcement = Announcement(
        title=payload.title,
        content=payload.content,
        expires_at=payload.expires_at,
        created_by=admin.id
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement
