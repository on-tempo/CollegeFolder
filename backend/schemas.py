from pydantic import BaseModel

#Data shape for register request
class UserCreate(BaseModel):
    email: str
    password: str

#Data shape for login request
class UserLogin(BaseModel):
    email: str
    password: str

#Data shape for user response (never return password)
class UserResponse(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True

#Semester schemas
class SemesterCreate(BaseModel):
    name: str

class SemesterResponse(BaseModel):
    id: int
    user_id: int
    name: str

    class Config:
        from_attributes = True

#Course schemas
class CourseCreate(BaseModel):
    name: str

class CourseResponse(BaseModel):
    id: int
    semester_id: int
    name: str

    class Config:
        from_attributes = True

# Todo schemas
class TodoCreate(BaseModel):
    content: str

class TodoUpdate(BaseModel):
    is_done: bool

class TodoResponse(BaseModel):
    id: int
    course_id: int
    content: str
    is_done: bool

    class Config:
        from_attributes = True

from datetime import date

# Exam schemas
class ExamCreate(BaseModel):
    name: str
    date: date  # format: "2026-04-15"

class ExamResponse(BaseModel):
    id: int
    course_id: int
    name: str
    date: date

    class Config:
        from_attributes = True