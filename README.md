# 📁 CollegeFolder

**A semester planner for students — organize semesters, courses, exams, and todos in a calendar built around a college schedule.**

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.137-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

[Live demo](https://collegefolder-frontend.onrender.com) · [API docs](#api-endpoints)

---

## Overview

CollegeFolder is a full-stack web app where a student signs in, creates semesters, adds courses to each semester, and tracks exams and todos on a calendar. A D-3 warning banner surfaces exams coming up within three days.

The backend is a FastAPI REST API with JWT authentication; the frontend is dependency-free vanilla JavaScript. Data is stored in PostgreSQL through SQLAlchemy.

## Features

- 🔐 Email/password sign-up and login with JWT authentication
- 📚 Semesters, with courses nested inside each semester
- ✅ Per-course todo lists with one-click completion and due dates
- 📅 Exam tracking with month, week, and agenda calendar views
- ⏰ D-3 warning banner for exams within three days
- 🌗 Light/dark themes and keyboard shortcuts

## Tech stack

| Layer | Choice |
|-------|--------|
| Backend | FastAPI (Python 3.11) |
| Frontend | Vanilla JS, HTML, CSS — no build step |
| Database | PostgreSQL via SQLAlchemy ORM |
| Auth | JWT (python-jose) with bcrypt password hashing |
| Validation | Pydantic v2 |
| Deployment | Render (backend web service + static frontend) |

## Architecture

The data model is hierarchical, and every record is owned by a user:

```
User
 └── Semester        (belongs to a user)
      └── Course      (belongs to a semester)
           ├── Todo   (belongs to a course)
           └── Exam   (belongs to a course)
```

The API is organized into routers by resource — `auth`, `semesters`, `courses`, `todos`, and `exams` — each mounted in `main.py`. A shared dependency layer (`deps.py`) centralizes ownership checks so every nested resource is verified against the authenticated user before it is read or modified.

## Security & engineering decisions

These are deliberate choices rather than framework defaults, and are the parts most worth reviewing:

- **Ownership enforcement (no IDOR).** Every endpoint that takes a resource ID verifies that the resource belongs to the authenticated user by walking the ownership chain (e.g. todo → course → semester → user). A user cannot read or modify another user's data even with a valid token and a guessed ID. These checks live in one place (`deps.py`) and are reused across routers.
- **Secrets via environment, fail-fast.** `SECRET_KEY` and `DATABASE_URL` are never hardcoded; the app refuses to start if they are missing, surfacing misconfiguration immediately instead of at first request.
- **Input validation at the boundary.** Pydantic schemas validate email format and enforce password length (8–72 characters, aligned with bcrypt's limit) before any business logic runs. The frontend mirrors these rules and surfaces server validation messages to the user.
- **Password handling.** Passwords are hashed with bcrypt and never returned in any API response.
- **Configurable CORS.** Allowed origins are read from an environment variable rather than hardcoded, so the same code runs in any environment.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Log in, returns a JWT |
| `GET` `POST` | `/semesters/` | List or create semesters |
| `DELETE` | `/semesters/{id}` | Delete a semester |
| `GET` `POST` | `/semesters/{id}/courses` | List or create courses in a semester |
| `PATCH` `DELETE` | `/semesters/courses/{id}` | Update or delete a course |
| `GET` `POST` | `/courses/{id}/todos` | List or create todos in a course |
| `PATCH` `DELETE` | `/courses/{id}/todos/{todo_id}` | Update or delete a todo |
| `GET` | `/exams` | All exams for the user |
| `GET` | `/exams/upcoming` | Exams within the next 3 days |
| `POST` | `/courses/{id}/exams` | Add an exam to a course |
| `DELETE` | `/exams/{id}` | Delete an exam |

Interactive API docs (Swagger UI) are available at `/docs` when the server is running.

## Local setup

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in `backend/` (see `.env.example`):

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=          # generate: python -c "import secrets; print(secrets.token_hex(32))"
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

Run the server:

```bash
uvicorn main:app --reload
```

The API runs at `http://localhost:8000` (docs at `http://localhost:8000/docs`).

### Frontend

```bash
cd frontend
# Serve index.html with any static server (VS Code Live Server works)
```

Then visit `http://127.0.0.1:5500`. The frontend automatically targets the local backend when served from localhost, and the deployed backend otherwise.

## Project structure

```
CollegeFolder/
├── backend/
│   ├── main.py            # App entry, router registration, CORS
│   ├── database.py        # SQLAlchemy engine and session
│   ├── models.py          # ORM models (User, Semester, Course, Todo, Exam)
│   ├── schemas.py         # Pydantic request/response schemas
│   ├── deps.py            # Shared ownership-check dependencies
│   └── routers/           # auth, semesters, courses, todos, exams
└── frontend/
    ├── index.html
    ├── app.js             # All app logic and API calls
    └── style.css
```
