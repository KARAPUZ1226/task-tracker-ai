import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models import Subtask

# In-memory or temporary SQLite test DB
TEST_DB_URL = "sqlite:///./test_tasks.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True, scope="module")
def setup_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_tasks.db"):
        os.remove("./test_tasks.db")

@pytest.fixture
def client():
    return TestClient(app)

def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_auth_flow(client):
    # 1. Register user
    reg_res = client.post("/api/auth/register", json={
        "email": "user1@example.com",
        "password": "secretpassword123"
    })
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "user1@example.com"
    token = data["access_token"]

    # 2. Duplicate registration fails
    dup_res = client.post("/api/auth/register", json={
        "email": "user1@example.com",
        "password": "secretpassword123"
    })
    assert dup_res.status_code == 400

    # 3. Login with wrong password fails
    bad_login = client.post("/api/auth/login", json={
        "email": "user1@example.com",
        "password": "wrongpassword"
    })
    assert bad_login.status_code == 401

    # 4. Login with correct password succeeds
    good_login = client.post("/api/auth/login", json={
        "email": "user1@example.com",
        "password": "secretpassword123"
    })
    assert good_login.status_code == 200
    assert "access_token" in good_login.json()

    # 5. Get current user
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "user1@example.com"

def test_task_crud_and_cascade(client):
    # Register another user
    reg = client.post("/api/auth/register", json={
        "email": "user2@example.com",
        "password": "password456"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create task with subtasks
    create_res = client.post("/api/tasks", headers=headers, json={
        "title": "Сделать крутой дизайн Linear",
        "description": "Сделать темную тему и микробордеры",
        "priority": "high",
        "deadline": "2026-11-05T12:00:00Z",
        "subtasks": ["Выбрать шрифты", "Сделать карточки"]
    })
    assert create_res.status_code == 201
    task_data = create_res.json()
    assert task_data["title"] == "Сделать крутой дизайн Linear"
    assert task_data["status"] == "todo"
    assert len(task_data["subtasks"]) == 2
    task_id = task_data["id"]
    subtask_1_id = task_data["subtasks"][0]["id"]

    # Read tasks
    list_res = client.get("/api/tasks", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # Update task status to in_progress
    update_res = client.patch(f"/api/tasks/{task_id}", headers=headers, json={
        "status": "in_progress",
        "priority": "urgent"
    })
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "in_progress"
    assert update_res.json()["priority"] == "urgent"

    # Toggle subtask completed
    sub_update = client.patch(f"/api/tasks/{task_id}/subtasks/{subtask_1_id}", headers=headers, json={
        "is_completed": True
    })
    assert sub_update.status_code == 200
    assert sub_update.json()["is_completed"] is True

    # Add 3rd subtask
    sub_add = client.post(f"/api/tasks/{task_id}/subtasks", headers=headers, json={
        "title": "Добавить анимации"
    })
    assert sub_add.status_code == 201
    assert sub_add.json()["title"] == "Добавить анимации"

    # Verify cascade delete: delete task and verify subtasks are gone
    del_res = client.delete(f"/api/tasks/{task_id}", headers=headers)
    assert del_res.status_code == 204

    # Verify task 404
    get_res = client.get(f"/api/tasks/{task_id}", headers=headers)
    assert get_res.status_code == 404

    # Check direct db query: subtasks must be 0 for that task_id
    db = TestingSessionLocal()
    st_count = db.query(Subtask).filter(Subtask.task_id == task_id).count()
    db.close()
    assert st_count == 0

def test_filters_and_search(client):
    reg = client.post("/api/auth/register", json={
        "email": "user3@example.com",
        "password": "password789"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create 3 tasks
    client.post("/api/tasks", headers=headers, json={
        "title": "Frontend аутентификация",
        "description": "Форма логина и регистрации",
        "priority": "high",
    })
    client.post("/api/tasks", headers=headers, json={
        "title": "Backend база данных",
        "description": "Схема SQLite с внешними ключами",
        "priority": "medium",
    })
    t3 = client.post("/api/tasks", headers=headers, json={
        "title": "AI интеграция",
        "description": "Декомпозиция задач",
        "priority": "urgent",
    })
    # Set t3 to done
    client.patch(f"/api/tasks/{t3.json()['id']}", headers=headers, json={"status": "done"})

    # Filter by search
    res_search = client.get("/api/tasks?search=Frontend", headers=headers)
    assert len(res_search.json()) == 1
    assert "Frontend" in res_search.json()[0]["title"]

    # Filter by status
    res_done = client.get("/api/tasks?status=done", headers=headers)
    assert len(res_done.json()) == 1
    assert res_done.json()[0]["title"] == "AI интеграция"

    # Filter by priority
    res_high = client.get("/api/tasks?priority=high", headers=headers)
    assert len(res_high.json()) == 1
    assert res_high.json()[0]["title"] == "Frontend аутентификация"

def test_ai_endpoints(client):
    reg = client.post("/api/auth/register", json={
        "email": "user4@example.com",
        "password": "password4"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Decompose
    res_dec = client.post("/api/ai/decompose", headers=headers, json={
        "title": "Разработать REST API на FastAPI"
    })
    assert res_dec.status_code == 200
    dec_data = res_dec.json()
    assert "subtasks" in dec_data
    assert len(dec_data["subtasks"]) >= 3

    # 2. Description
    res_desc = client.post("/api/ai/generate-description", headers=headers, json={
        "title": "Настроить Docker Compose для продакшена"
    })
    assert res_desc.status_code == 200
    desc_data = res_desc.json()
    assert "description" in desc_data
    assert len(desc_data["description"]) > 20

    # 3. Deadline
    res_dl = client.post("/api/ai/suggest-deadline", headers=headers, json={
        "title": "Срочный фикс авторизации",
        "priority": "urgent"
    })
    assert res_dl.status_code == 200
    dl_data = res_dl.json()
    assert "suggested_deadline" in dl_data
    assert dl_data["estimated_days"] >= 1
    assert "reasoning" in dl_data

    # 4. Prioritize
    res_prio = client.post("/api/ai/prioritize", headers=headers, json={
        "title": "Критическая уязвимость в auth модуле",
        "description": "Срочный фикс авторизации"
    })
    assert res_prio.status_code == 200
    prio_data = res_prio.json()
    assert prio_data["suggested_priority"] in ["urgent", "high", "medium", "low"]
    assert "reasoning" in prio_data

def test_edge_cases_and_field_clearing(client):
    reg = client.post("/api/auth/register", json={
        "email": "user5@example.com",
        "password": "password5"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Reject empty or whitespace-only title on create
    bad_task = client.post("/api/tasks", headers=headers, json={
        "title": "   "
    })
    assert bad_task.status_code in [400, 422]

    # 2. Create valid task with description & deadline
    good_task = client.post("/api/tasks", headers=headers, json={
        "title": "Тестовая задача для очистки полей",
        "description": "Исходное описание",
        "deadline": "2026-11-01T10:00:00Z"
    })
    assert good_task.status_code == 201
    tid = good_task.json()["id"]

    # 3. Reject empty or whitespace title on patch
    bad_patch = client.patch(f"/api/tasks/{tid}", headers=headers, json={
        "title": "   "
    })
    assert bad_patch.status_code in [400, 422]

    # 4. Clear description and deadline by sending null
    clear_patch = client.patch(f"/api/tasks/{tid}", headers=headers, json={
        "description": None,
        "deadline": None,
        "subtasks": ["Новая подзадача через patch"]
    })
    assert clear_patch.status_code == 200
    cleared = clear_patch.json()
    assert cleared["description"] is None
    assert cleared["deadline"] is None
    assert len(cleared["subtasks"]) == 1
    assert cleared["subtasks"][0]["title"] == "Новая подзадача через patch"
