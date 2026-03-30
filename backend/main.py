from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routers import auth, semesters, courses, todos, exams

# Create all tables in the database on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:5500",
        "https://collegefolder.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(semesters.router)
app.include_router(courses.router)
app.include_router(todos.router)
app.include_router(exams.router)

@app.get("/")
def read_root():
    return {"message": "CollegeFolder API is running!"}