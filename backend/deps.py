# =========================================================
# These functions prevent IDOR (accessing another user's data).
# Whenever a router receives a course_id / exam_id / etc.,
# it must use these helpers to confirm the resource actually
# belongs to the currently logged-in user.
# =========================================================
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Semester, Course, Todo, Exam
from routers.auth import get_current_user


def get_owned_semester(semester_id: int, db: Session, current_user) -> Semester:
    """Return the semester only if it belongs to the current user, else 404."""
    semester = db.query(Semester).filter(
        Semester.id == semester_id,
        Semester.user_id == current_user.id,
    ).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    return semester


def get_owned_course(course_id: int, db: Session, current_user) -> Course:
    """Return the course only if it belongs to the current user (via its semester), else 404."""
    course = (
        db.query(Course)
        .join(Semester, Course.semester_id == Semester.id)
        .filter(
            Course.id == course_id,
            Semester.user_id == current_user.id,
        )
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def get_owned_todo(course_id: int, todo_id: int, db: Session, current_user) -> Todo:
    """Return the todo only if it belongs to a course owned by the current user, else 404."""
    # First verify course ownership (raises 404 if not owned)
    get_owned_course(course_id, db, current_user)
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.course_id == course_id,
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


def get_owned_exam(exam_id: int, db: Session, current_user) -> Exam:
    """Return the exam only if it belongs to a course owned by the current user, else 404."""
    exam = (
        db.query(Exam)
        .join(Course, Exam.course_id == Course.id)
        .join(Semester, Course.semester_id == Semester.id)
        .filter(
            Exam.id == exam_id,
            Semester.user_id == current_user.id,
        )
        .first()
    )
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam