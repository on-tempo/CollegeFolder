from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import date, datetime

# Data shape for register request
class UserCreate(BaseModel):
    # EmailStr automatically returns 422 if the value is not a valid email
    email: EmailStr
    # Password length limit. bcrypt only processes up to 72 bytes, so cap at 72.
    password: str = Field(min_length=8, max_length=72)

# Data shape for login request
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Data shape for user response (never return password)
class UserResponse(BaseModel):
    id: int
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)

# Semester schemas
class SemesterCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)

class SemesterResponse(BaseModel):
    id: int
    user_id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

# Course schemas
class CourseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    color: str | None = None

class CourseUpdate(BaseModel):
    color: str | None = None

class CourseResponse(BaseModel):
    id: int
    semester_id: int
    name: str
    color: str | None = None

    model_config = ConfigDict(from_attributes=True)

# Todo schemas
class TodoCreate(BaseModel):
    content: str = Field(min_length=1, max_length=500)
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

    model_config = ConfigDict(from_attributes=True)

# Exam schemas
class ExamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    date: date

class ExamResponse(BaseModel):
    id: int
    course_id: int
    name: str
    date: date

    model_config = ConfigDict(from_attributes=True)