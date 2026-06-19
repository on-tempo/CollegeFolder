from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
from database import get_db
from models import Exam, Course, Semester
from schemas import ExamCreate, ExamResponse
from routers.auth import get_current_user
from deps import get_owned_course, get_owned_exam

router = APIRouter(tags=["exams"])

# Get all exams for current user (used for D-3 warning)
@router.get("/exams", response_model=list[ExamResponse])
def get_all_exams(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Join semester -> course -> exam for the current user in a single query
    return (
        db.query(Exam)
        .join(Course, Exam.course_id == Course.id)
        .join(Semester, Course.semester_id == Semester.id)
        .filter(Semester.user_id == current_user.id)
        .all()
    )

# Get upcoming exams within 3 days (D-3 warning)
@router.get("/exams/upcoming", response_model=list[ExamResponse])
def get_upcoming_exams(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    today = date.today()
    in_3_days = today + timedelta(days=3)
    return (
        db.query(Exam)
        .join(Course, Exam.course_id == Course.id)
        .join(Semester, Course.semester_id == Semester.id)
        .filter(
            Semester.user_id == current_user.id,
            Exam.date >= today,
            Exam.date <= in_3_days,
        )
        .all()
    )

# Add an exam to a course
@router.post("/courses/{course_id}/exams", response_model=ExamResponse)
def create_exam(course_id: int, exam: ExamCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Verify course ownership (previously exams could be added to any user's course)
    get_owned_course(course_id, db, current_user)
    new_exam = Exam(name=exam.name, date=exam.date, course_id=course_id)
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)
    return new_exam

# Delete an exam
@router.delete("/exams/{exam_id}")
def delete_exam(exam_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    exam = get_owned_exam(exam_id, db, current_user)
    db.delete(exam)
    db.commit()
    return {"message": "Exam deleted"}