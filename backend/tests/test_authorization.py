"""
Authorization / IDOR tests.

These verify that a user cannot read or modify another user's data even with a
valid token and a guessed resource ID. Every nested resource is checked against
the ownership chain (todo -> course -> semester -> user). This is the most
security-critical part of the API.
"""
import pytest


@pytest.fixture()
def two_users(client, auth_headers):
    # Alice owns some data; Bob will try to reach it.
    alice = auth_headers(email="alice@test.com")
    bob = auth_headers(email="bob@test.com")
    sem = client.post("/semesters/", json={"name": "Alice Sem"}, headers=alice).json()
    crs = client.post(f"/semesters/{sem['id']}/courses", json={"name": "Alice Course"}, headers=alice).json()
    todo = client.post(f"/courses/{crs['id']}/todos", json={"content": "secret"}, headers=alice).json()
    exam = client.post(f"/courses/{crs['id']}/exams", json={"name": "Alice Exam", "date": "2026-07-01"}, headers=alice).json()
    return {"alice": alice, "bob": bob, "sem": sem, "crs": crs, "todo": todo, "exam": exam}


def test_cannot_list_others_courses(client, two_users):
    d = two_users
    assert client.get(f"/semesters/{d['sem']['id']}/courses", headers=d["bob"]).status_code == 404


def test_cannot_update_others_course(client, two_users):
    d = two_users
    assert client.patch(f"/semesters/courses/{d['crs']['id']}", json={"color": "red"}, headers=d["bob"]).status_code == 404


def test_cannot_delete_others_course(client, two_users):
    d = two_users
    assert client.delete(f"/semesters/courses/{d['crs']['id']}", headers=d["bob"]).status_code == 404


def test_cannot_read_others_todos(client, two_users):
    d = two_users
    assert client.get(f"/courses/{d['crs']['id']}/todos", headers=d["bob"]).status_code == 404


def test_cannot_update_others_todo(client, two_users):
    d = two_users
    assert client.patch(f"/courses/{d['crs']['id']}/todos/{d['todo']['id']}", json={"is_done": True}, headers=d["bob"]).status_code == 404


def test_cannot_delete_others_todo(client, two_users):
    d = two_users
    assert client.delete(f"/courses/{d['crs']['id']}/todos/{d['todo']['id']}", headers=d["bob"]).status_code == 404


def test_cannot_add_exam_to_others_course(client, two_users):
    d = two_users
    assert client.post(f"/courses/{d['crs']['id']}/exams", json={"name": "x", "date": "2026-07-01"}, headers=d["bob"]).status_code == 404


def test_cannot_delete_others_exam(client, two_users):
    d = two_users
    assert client.delete(f"/exams/{d['exam']['id']}", headers=d["bob"]).status_code == 404


def test_cannot_delete_others_semester(client, two_users):
    d = two_users
    assert client.delete(f"/semesters/{d['sem']['id']}", headers=d["bob"]).status_code == 404


def test_others_exam_list_is_empty(client, two_users):
    d = two_users
    assert len(client.get("/exams", headers=d["bob"]).json()) == 0


def test_owner_can_still_access_own_data(client, two_users):
    d = two_users
    # Sanity check: Alice herself is not blocked
    assert client.get(f"/courses/{d['crs']['id']}/todos", headers=d["alice"]).status_code == 200