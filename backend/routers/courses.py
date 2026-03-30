from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Course, Semester
from schemas import CourseCreate, CourseResponse
from routers.auth import get_current_user

router = APIRouter(prefix="/semesters", tags=["courses"])

# Get all courses for a semester
@router.get("/{semester_id}/courses", response_model=list[CourseResponse])
def get_courses(semester_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Make sure semester belongs to current user
    semester = db.query(Semester).filter(Semester.id == semester_id, Semester.user_id == current_user.id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    
    return db.query(Course).filter(Course.semester_id == semester_id).all()

# Add a course to a semester
@router.post("/{semester_id}/courses", response_model=CourseResponse)
def create_course(semester_id: int, course: CourseCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Make sure semester belongs to current user
    semester = db.query(Semester).filter(Semester.id == semester_id, Semester.user_id == current_user.id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    
    new_course = Course(name=course.name, semester_id=semester_id)
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

# Delete a course
@router.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    db.delete(course)
    db.commit()
    return {"message": "Course deleted"}