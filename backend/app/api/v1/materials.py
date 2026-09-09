import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db
from app.models.material import Material
from app.models.subject import Subject
from app.schemas.material import MaterialResponse

router = APIRouter(prefix="/materials", tags=["Academic Materials"])

@router.get("", response_model=List[MaterialResponse])
def get_materials(
    semester: Optional[int] = Query(None, description="Filter by semester"),
    subject_id: Optional[uuid.UUID] = Query(None, description="Filter by subject ID"),
    unit: Optional[int] = Query(None, description="Filter by unit number"),
    material_type: Optional[str] = Query(None, description="Filter by material type (syllabus, notes, reference, assignment)"),
    search: Optional[str] = Query(None, description="Search query in title or description"),
    db: Session = Depends(get_db)
):
    """Retrieve list of academic materials with optional query filters."""
    query = db.query(Material, Subject).join(Subject, Material.subject_id == Subject.id)

    if semester is not None:
        query = query.filter(Material.semester == semester)
    if subject_id is not None:
        query = query.filter(Material.subject_id == subject_id)
    if unit is not None:
        query = query.filter(Material.unit == unit)
    if material_type is not None:
        query = query.filter(Material.material_type == material_type)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Material.title.ilike(search_pattern),
                Material.description.ilike(search_pattern)
            )
        )

    results = query.all()
    materials_response = []
    for material, subject in results:
        res = MaterialResponse.model_validate(material)
        res.subject_code = subject.code
        res.subject_name = subject.name
        materials_response.append(res)

    return materials_response

@router.get("/{material_id}", response_model=MaterialResponse)
def get_material_by_id(material_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get single academic material by ID."""
    result = db.query(Material, Subject).join(Subject, Material.subject_id == Subject.id).filter(Material.id == material_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Material not found")

    material, subject = result
    res = MaterialResponse.model_validate(material)
    res.subject_code = subject.code
    res.subject_name = subject.name
    return res
