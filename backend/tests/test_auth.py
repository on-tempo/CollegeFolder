"""Authentication and input-validation tests."""


def test_register_success(client):
    r = client.post("/auth/register", json={"email": "a@test.com", "password": "password123"})
    assert r.status_code == 200
    assert "password" not in r.json()  # never leak the password/hash


def test_register_duplicate_email_rejected(client):
    client.post("/auth/register", json={"email": "a@test.com", "password": "password123"})
    r = client.post("/auth/register", json={"email": "a@test.com", "password": "password123"})
    assert r.status_code == 400


def test_register_invalid_email_rejected(client):
    r = client.post("/auth/register", json={"email": "notanemail", "password": "password123"})
    assert r.status_code == 422


def test_register_short_password_rejected(client):
    r = client.post("/auth/register", json={"email": "a@test.com", "password": "short"})
    assert r.status_code == 422


def test_register_password_boundary(client):
    # Exactly 8 chars allowed, 7 rejected
    assert client.post("/auth/register", json={"email": "a@test.com", "password": "12345678"}).status_code == 200
    assert client.post("/auth/register", json={"email": "b@test.com", "password": "1234567"}).status_code == 422


def test_register_too_long_password_rejected(client):
    r = client.post("/auth/register", json={"email": "a@test.com", "password": "x" * 73})
    assert r.status_code == 422


def test_login_success(client):
    client.post("/auth/register", json={"email": "a@test.com", "password": "password123"})
    r = client.post("/auth/login", json={"email": "a@test.com", "password": "password123"})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password_rejected(client):
    client.post("/auth/register", json={"email": "a@test.com", "password": "password123"})
    r = client.post("/auth/login", json={"email": "a@test.com", "password": "wrongpass"})
    assert r.status_code == 400


def test_protected_route_requires_token(client):
    r = client.get("/semesters/")
    assert r.status_code in (401, 403)


def test_invalid_token_rejected(client):
    r = client.get("/semesters/", headers={"Authorization": "Bearer invalid.token.here"})
    assert r.status_code == 401