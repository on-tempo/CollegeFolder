"""Happy-path CRUD tests across semesters, courses, todos, and exams."""


def _setup_user(client, auth_headers):
    headers = auth_headers()
    sem = client.post("/semesters/", json={"name": "Fall 2026"}, headers=headers).json()
    crs = client.post(f"/semesters/{sem['id']}/courses", json={"name": "CS101", "color": "c1"}, headers=headers).json()
    return headers, sem, crs


def test_semester_crud(client, auth_headers):
    headers = auth_headers()
    sem = client.post("/semesters/", json={"name": "Fall 2026"}, headers=headers).json()
    assert "id" in sem
    assert len(client.get("/semesters/", headers=headers).json()) == 1
    assert client.delete(f"/semesters/{sem['id']}", headers=headers).status_code == 200


def test_course_crud(client, auth_headers):
    headers, sem, crs = _setup_user(client, auth_headers)
    assert "id" in crs
    assert len(client.get(f"/semesters/{sem['id']}/courses", headers=headers).json()) == 1
    patched = client.patch(f"/semesters/courses/{crs['id']}", json={"color": "c2"}, headers=headers)
    assert patched.status_code == 200


def test_todo_crud_and_due_date_update(client, auth_headers):
    headers, sem, crs = _setup_user(client, auth_headers)
    todo = client.post(f"/courses/{crs['id']}/todos", json={"content": "HW1", "due_date": "2026-07-01"}, headers=headers).json()
    assert "id" in todo
    # Update both is_done and due_date
    upd = client.patch(f"/courses/{crs['id']}/todos/{todo['id']}", json={"is_done": True, "due_date": "2026-08-15"}, headers=headers).json()
    assert upd["is_done"] is True
    assert upd["due_date"] == "2026-08-15"


def test_exam_crud_and_upcoming(client, auth_headers):
    headers, sem, crs = _setup_user(client, auth_headers)
    exam = client.post(f"/courses/{crs['id']}/exams", json={"name": "Midterm", "date": "2026-07-05"}, headers=headers).json()
    assert "id" in exam
    assert len(client.get("/exams", headers=headers).json()) == 1
    assert client.get("/exams/upcoming", headers=headers).status_code == 200


def test_cascade_delete(client, auth_headers):
    headers, sem, crs = _setup_user(client, auth_headers)
    client.post(f"/courses/{crs['id']}/todos", json={"content": "HW1"}, headers=headers)
    # Deleting the semester should remove its children too
    client.delete(f"/semesters/{sem['id']}", headers=headers)
    assert len(client.get("/semesters/", headers=headers).json()) == 0


def test_empty_input_rejected(client, auth_headers):
    headers = auth_headers()
    assert client.post("/semesters/", json={"name": ""}, headers=headers).status_code == 422