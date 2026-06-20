"""
Shared pytest fixtures.

Tests run against a real PostgreSQL database (matching production) rather than
SQLite, so behavior like joins, cascades, and constraints is verified in the
same engine that runs in production. The database URL is taken from
TEST_DATABASE_URL.

Each test gets a clean schema: tables are created before the test and dropped
afterward, so tests never leak state into one another.
"""
import os
import sys

# Ensure the backend directory (parent of this tests/ folder) is importable,
# so `import database`, `import models`, `import main` work regardless of how
# or from where pytest is invoked.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# A SECRET_KEY must exist before the app modules are imported.
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-ci-only")
# The app's own DATABASE_URL guard needs a value at import time.
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql://postgres@/collegefolder_test?host=/tmp&port=5433",
)
os.environ.setdefault("DATABASE_URL", TEST_DATABASE_URL)

import database
import models
import main
from database import get_db


# Build a dedicated engine for the test database.
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db_session():
    """Create all tables, hand out a session, then drop everything."""
    models.Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        models.Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    """A TestClient whose get_db dependency uses the test database."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    main.app.dependency_overrides[get_db] = override_get_db
    with TestClient(main.app) as c:
        yield c
    main.app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(client):
    """Register + log in a user, return ready-to-use auth headers and a helper."""
    def _make(email="user@test.com", password="password123"):
        client.post("/auth/register", json={"email": email, "password": password})
        token = client.post(
            "/auth/login", json={"email": email, "password": password}
        ).json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return _make