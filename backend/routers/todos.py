from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Todo, Course, Semester
from schemas import TodoCreate, TodoUpdate, TodoResponse
from routers.auth import get_current_user

router = APIRouter(prefix="/courses", tags=["todos"])

# Get all todos for a course
@router.get("/{course_id}/todos", response_model=list[TodoResponse])
def get_todos(course_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Make sure course belongs to current user
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return db.query(Todo).filter(Todo.course_id == course_id).all()

# Add a todo to a course
@router.post("/{course_id}/todos", response_model=TodoResponse)
def create_todo(course_id: int, todo: TodoCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    new_todo = Todo(content=todo.content, course_id=course_id)
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)
    return new_todo

# Mark todo as done/undone
@router.patch("/{course_id}/todos/{todo_id}", response_model=TodoResponse)
def update_todo(course_id: int, todo_id: int, todo_update: TodoUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.course_id == course_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    todo.is_done = todo_update.is_done
    db.commit()
    db.refresh(todo)
    return todo

# Delete a todo
@router.delete("/{course_id}/todos/{todo_id}")
def delete_todo(course_id: int, todo_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.course_id == course_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    db.delete(todo)
    db.commit()
    return {"message": "Todo deleted"}