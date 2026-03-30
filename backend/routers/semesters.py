from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Semester
from schemas import SemesterCreate, SemesterResponse
from routers.auth import get_current_user

router = APIRouter(prefix="/semesters", tags=["semesters"])

#Get all semesters for current user
@router.get("/", response_model=list[SemesterResponse])
def get_semesters(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Semester).filter(Semester.user_id == current_user.id).all()

#Create a new semester
@router.post("/", response_model=SemesterResponse)
def create_semester(semester: SemesterCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    new_semester = Semester(name=semester.name, user_id=current_user.id)
    db.add(new_semester)
    db.commit()
    db.refresh(new_semester)
    return new_semester

#Delete a semester
@router.delete("/{semester_id}")
def delete_semester(semester_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    semester = db.query(Semester).filter(Semester.id == semester_id, Semester.user_id == current_user.id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    db.delete(semester)
    db.commit()
    return {"message": "Semester deleted"}
