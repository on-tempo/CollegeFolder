from pydantic import BaseModel
from datetime import date, datetime

# Data shape for register request
class UserCreate(BaseModel):
    email: str
    password: str

# Data shape for login request
class UserLogin(BaseModel):
    email: str
    password: str

# Data shape for user response (never return password)
class UserResponse(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True

# Semester schemas
class SemesterCreate(BaseModel):
    name: str

class SemesterResponse(BaseModel):
    id: int
    user_id: int
    name: str

    class Config:
        from_attributes = True

# Course schemas
class CourseCreate(BaseModel):
    name: str
    color: str | None = None

class CourseUpdate(BaseModel):
    color: str | None = None

class CourseResponse(BaseModel):
    id: int
    semester_id: int
    name: str
    color: str | None = None

    class Config:
        from_attributes = True

# Todo schemas
class TodoCreate(BaseModel):
    content: str
    due_date: date | None = None

class TodoUpdate(BaseModel):
    is_done: bool
    due_date: date | None = None

class TodoResponse(BaseModel):
    id: int
    course_id: int
    content: str
    is_done: bool
    due_date: date | None = None
    created_at: datetime

    class Config:
        from_attributes = True

# Exam schemas
class ExamCreate(BaseModel):
    name: str
    date: date

class ExamResponse(BaseModel):
    id: int
    course_id: int
    name: str
    date: date

    class Config:
        from_attributes = True