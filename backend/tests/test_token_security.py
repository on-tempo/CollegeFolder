"""JWT token security tests: forged, expired, and ghost-user tokens."""
import os
from datetime import datetime, timedelta, timezone
from jose import jwt

SECRET = os.environ["SECRET_KEY"]


def _token(sub, secret=SECRET, hours=1):
    exp = datetime.now(timezone.utc) + timedelta(hours=hours)
    return jwt.encode({"sub": str(sub), "exp": exp}, secret, algorithm="HS256")


def test_expired_token_rejected(client, auth_headers):
    auth_headers()  # ensure a user with id 1 exists
    expired = _token(1, hours=-1)
    r = client.get("/semesters/", headers={"Authorization": f"Bearer {expired}"})
    assert r.status_code == 401


def test_forged_token_rejected(client, auth_headers):
    auth_headers()
    forged = _token(1, secret="wrong-secret-key")
    r = client.get("/semesters/", headers={"Authorization": f"Bearer {forged}"})
    assert r.status_code == 401


def test_ghost_user_token_rejected(client):
    # Valid signature, but the user does not exist
    ghost = _token(99999)
    r = client.get("/semesters/", headers={"Authorization": f"Bearer {ghost}"})
    assert r.status_code == 401