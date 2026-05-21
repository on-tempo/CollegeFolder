# CollegeFolder

A student task manager for organizing semesters and the work inside them. Plan exams and todos in a calendar built for a college schedule.

## Live Demo

https://collegefolder-frontend.onrender.com

## Features

- Email and password sign in with JWT auth
- Add semesters and the courses inside them
- Month week and agenda views for exams
- Per course todo lists with one click check off
- D-3 warning banner before upcoming exams
- Light and dark themes
- Keyboard shortcuts for fast navigation

## Tech Stack

- Backend: FastAPI on Python 3
- Frontend: HTML CSS and Vanilla JS with no build step
- Database: PostgreSQL via SQLAlchemy
- Auth: JWT with bcrypt password hashing
- Deployment: Render for both services

## Local Setup

### Backend

1. `cd backend`
2. `pip install -r requirements.txt`
3. Create a `.env` file with `DATABASE_URL=postgresql://...`
4. `uvicorn main:app --reload`

The API runs at http://localhost:8000

### Frontend

1. `cd frontend`
2. Serve `index.html` with any static server. VS Code Live Server works.
3. Visit http://127.0.0.1:5500

## Deployment

Backend deploys to Render as a Web Service. Frontend deploys to Render as a Static Site pointing at `/frontend`. The backend reads its connection string from the `DATABASE_URL` environment variable. Whenever the frontend URL changes update the `allow_origins` list inside `backend/main.py` so requests are not blocked by CORS.
