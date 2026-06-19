from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Course
from schemas import CourseCreate, CourseUpdate, CourseResponse
from routers.auth import get_current_user
from deps import get_owned_semester, get_owned_course

router = APIRouter(prefix="/semesters", tags=["courses"])

# Get all courses for a semester
@router.get("/{semester_id}/courses", response_model=list[CourseResponse])
def get_courses(semester_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Verify the semester belongs to the current user
    get_owned_semester(semester_id, db, current_user)
    return db.query(Course).filter(Course.semester_id == semester_id).all()

# Add a course to a semester
@router.post("/{semester_id}/courses", response_model=CourseResponse)
def create_course(semester_id: int, course: CourseCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    get_owned_semester(semester_id, db, current_user)
    new_course = Course(name=course.name, semester_id=semester_id, color=course.color)
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

# Update a course (e.g. color)
@router.patch("/courses/{course_id}", response_model=CourseResponse)
def update_course(course_id: int, data: CourseUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Previously any course could be updated without an ownership check -> added here
    course = get_owned_course(course_id, db, current_user)
    if data.color is not None:
        course.color = data.color
    db.commit()
    db.refresh(course)
    return course

# Delete a course
@router.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    course = get_owned_course(course_id, db, current_user)
    db.delete(course)
    db.commit()
    return {"message": "Course deleted"}