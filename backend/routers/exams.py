from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from database import get_db
from models import Exam, Course, Semester
from schemas import ExamCreate, ExamResponse
from routers.auth import get_current_user

router = APIRouter(tags=["exams"])

# Get all exams for current user (used for D-3 warning)
@router.get("/exams", response_model=list[ExamResponse])
def get_all_exams(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Get all courses that belong to current user through semesters
    user_semesters = db.query(Semester).filter(Semester.user_id == current_user.id).all()
    semester_ids = [s.id for s in user_semesters]
    user_courses = db.query(Course).filter(Course.semester_id.in_(semester_ids)).all()
    course_ids = [c.id for c in user_courses]

    return db.query(Exam).filter(Exam.course_id.in_(course_ids)).all()

# Get upcoming exams within 3 days (D-3 warning)
@router.get("/exams/upcoming", response_model=list[ExamResponse])
def get_upcoming_exams(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    from datetime import timedelta
    today = date.today()
    in_3_days = today + timedelta(days=3)

    user_semesters = db.query(Semester).filter(Semester.user_id == current_user.id).all()
    semester_ids = [s.id for s in user_semesters]
    user_courses = db.query(Course).filter(Course.semester_id.in_(semester_ids)).all()
    course_ids = [c.id for c in user_courses]

    # Return exams happening between today and 3 days from now
    return db.query(Exam).filter(
        Exam.course_id.in_(course_ids),
        Exam.date >= today,
        Exam.date <= in_3_days
    ).all()

# Add an exam to a course
@router.post("/courses/{course_id}/exams", response_model=ExamResponse)
def create_exam(course_id: int, exam: ExamCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    new_exam = Exam(name=exam.name, date=exam.date, course_id=course_id)
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)
    return new_exam

# Delete an exam
@router.delete("/exams/{exam_id}")
def delete_exam(exam_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    db.delete(exam)
    db.commit()
    return {"message": "Exam deleted"}