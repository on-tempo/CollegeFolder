from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Todo
from schemas import TodoCreate, TodoUpdate, TodoResponse
from routers.auth import get_current_user
from deps import get_owned_course, get_owned_todo

router = APIRouter(prefix="/courses", tags=["todos"])

# Get all todos for a course
@router.get("/{course_id}/todos", response_model=list[TodoResponse])
def get_todos(course_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Verify the course belongs to the current user (previously any user's todos were readable)
    get_owned_course(course_id, db, current_user)
    return db.query(Todo).filter(Todo.course_id == course_id).all()

# Add a todo to a course
@router.post("/{course_id}/todos", response_model=TodoResponse)
def create_todo(course_id: int, todo: TodoCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    get_owned_course(course_id, db, current_user)
    new_todo = Todo(content=todo.content, course_id=course_id, due_date=todo.due_date)
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)
    return new_todo

# Mark todo as done/undone
@router.patch("/{course_id}/todos/{todo_id}", response_model=TodoResponse)
def update_todo(course_id: int, todo_id: int, todo_update: TodoUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Verify course ownership and todo existence at the same time
    todo = get_owned_todo(course_id, todo_id, db, current_user)
    todo.is_done = todo_update.is_done
    # Also apply due_date update (it exists in the schema but was previously ignored)
    if todo_update.due_date is not None:
        todo.due_date = todo_update.due_date
    db.commit()
    db.refresh(todo)
    return todo

# Delete a todo
@router.delete("/{course_id}/todos/{todo_id}")
def delete_todo(course_id: int, todo_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    todo = get_owned_todo(course_id, todo_id, db, current_user)
    db.delete(todo)
    db.commit()
    return {"message": "Todo deleted"}