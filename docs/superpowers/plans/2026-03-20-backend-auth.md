# Backend Auth & User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement JWT-based authentication with admin user CRUD for the gym tracker backend.

**Architecture:** JWT access token (7-day expiry) with bcrypt password hashing. Admin seeded on startup from env vars. FastAPI dependency injection for auth (`get_current_user`, `get_current_admin`). All responses are Pydantic/SQLModel models.

**Tech Stack:** FastAPI, SQLModel, bcrypt, PyJWT, Alembic, pytest

**Spec:** `docs/superpowers/specs/2026-03-19-backend-auth-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `backend/pyproject.toml` | Modify | Add `bcrypt`, `PyJWT` dependencies |
| `backend/.env.example` | Modify | Add `ADMIN_*` env vars |
| `backend/app/config.py` | Modify | Add `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` settings |
| `backend/app/models/__init__.py` | Create | Package init, re-export `User` |
| `backend/app/models/user.py` | Create | `User` SQLModel table model |
| `backend/app/schemas/__init__.py` | Create | Package init |
| `backend/app/schemas/auth.py` | Create | `LoginRequest`, `TokenResponse`, `TokenPayload`, `MessageResponse` |
| `backend/app/schemas/user.py` | Create | `UserCreate`, `UserUpdate`, `UserRead` |
| `backend/app/auth/__init__.py` | Create | Package init |
| `backend/app/auth/password.py` | Create | `hash_password()`, `verify_password()` |
| `backend/app/auth/jwt.py` | Create | `create_access_token()`, `decode_access_token()` |
| `backend/app/auth/dependencies.py` | Create | `get_current_user()`, `get_current_admin()` |
| `backend/app/routes/__init__.py` | Create | Package init |
| `backend/app/routes/auth.py` | Create | `POST /login`, `GET /me` |
| `backend/app/routes/users.py` | Create | Admin CRUD endpoints |
| `backend/app/main.py` | Modify | Add lifespan (admin seed), register routers |
| `backend/alembic/env.py` | Modify | Import `User` model for metadata |
| `backend/tests/conftest.py` | Modify | Import `User`, add auth fixtures |
| `backend/tests/test_auth.py` | Create | Auth endpoint tests |
| `backend/tests/test_users.py` | Create | User CRUD endpoint tests |

---

### Task 1: Dependencies, User Model, and Schemas

**Files:**
- Modify: `backend/pyproject.toml`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/schemas/user.py`

- [ ] **Step 1: Add dependencies to pyproject.toml**

Add `bcrypt` and `PyJWT` to the `dependencies` list in `backend/pyproject.toml`:

```toml
dependencies = [
    "fastapi",
    "uvicorn[standard]",
    "sqlmodel",
    "asyncpg",
    "alembic",
    "greenlet",
    "pydantic-settings",
    "bcrypt",
    "PyJWT",
]
```

- [ ] **Step 2: Install dependencies**

Run: `cd backend && uv sync`
Expected: dependencies installed successfully

- [ ] **Step 3: Create User model**

Create `backend/app/models/__init__.py`:
```python
from app.models.user import User

__all__ = ["User"]
```

Create `backend/app/models/user.py`:
```python
from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True)
    password_hash: str
    is_admin: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
```

- [ ] **Step 4: Create auth schemas**

Create `backend/app/schemas/__init__.py`:
```python
```

Create `backend/app/schemas/auth.py`:
```python
from datetime import datetime

from sqlmodel import SQLModel


class LoginRequest(SQLModel):
    username: str
    password: str


class TokenResponse(SQLModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(SQLModel):
    sub: int
    exp: datetime


class MessageResponse(SQLModel):
    message: str
```

- [ ] **Step 5: Create user schemas**

Create `backend/app/schemas/user.py`:
```python
from datetime import datetime

from sqlmodel import SQLModel


class UserCreate(SQLModel):
    username: str
    email: str
    password: str


class UserUpdate(SQLModel):
    username: str | None = None
    email: str | None = None
    password: str | None = None


class UserRead(SQLModel):
    id: int
    username: str
    email: str
    is_admin: bool
    created_at: datetime
```

- [ ] **Step 6: Verify model imports work**

Run: `cd backend && python -c "from app.models import User; from app.schemas.auth import LoginRequest, TokenResponse, TokenPayload, MessageResponse; from app.schemas.user import UserCreate, UserUpdate, UserRead; print('OK')"`
Expected: `OK`

- [ ] **Step 7: Commit**

```bash
git add backend/pyproject.toml backend/uv.lock backend/app/models/ backend/app/schemas/
git commit -m "feat(auth): add User model, auth/user schemas, and dependencies"
```

---

### Task 2: Password Hashing Utility

**Files:**
- Create: `backend/app/auth/__init__.py`
- Create: `backend/app/auth/password.py`
- Create: `backend/tests/test_password.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_password.py`:
```python
from app.auth.password import hash_password, verify_password


def test_hash_password_returns_string():
    result = hash_password("mysecret")
    assert isinstance(result, str)
    assert result != "mysecret"


def test_verify_password_correct():
    hashed = hash_password("mysecret")
    assert verify_password("mysecret", hashed) is True


def test_verify_password_wrong():
    hashed = hash_password("mysecret")
    assert verify_password("wrongpassword", hashed) is False
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_password.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.auth'`

- [ ] **Step 3: Implement password utilities**

Create `backend/app/auth/__init__.py`:
```python
```

Create `backend/app/auth/password.py`:
```python
import bcrypt


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_password.py -v`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add backend/app/auth/__init__.py backend/app/auth/password.py backend/tests/test_password.py
git commit -m "feat(auth): add bcrypt password hashing utilities"
```

---

### Task 3: JWT Utility

**Files:**
- Create: `backend/app/auth/jwt.py`
- Create: `backend/tests/test_jwt.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_jwt.py`:
```python
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import jwt as pyjwt
import pytest
from fastapi import HTTPException

from app.auth.jwt import create_access_token, decode_access_token
from app.config import settings


def test_create_access_token_returns_string():
    token = create_access_token(1)
    assert isinstance(token, str)


def test_create_access_token_contains_sub():
    token = create_access_token(42)
    payload = pyjwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    assert payload["sub"] == "42"


def test_decode_access_token_valid():
    token = create_access_token(42)
    payload = decode_access_token(token)
    assert payload.sub == 42


def test_decode_access_token_expired():
    payload = {"sub": "1", "exp": datetime.now(UTC) - timedelta(hours=1)}
    token = pyjwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    assert exc_info.value.status_code == 401


def test_decode_access_token_invalid_token():
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token("not.a.token")
    assert exc_info.value.status_code == 401
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_jwt.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.auth.jwt'`

- [ ] **Step 3: Implement JWT utilities**

Create `backend/app/auth/jwt.py`:
```python
from datetime import UTC, datetime, timedelta

import jwt as pyjwt
from fastapi import HTTPException

from app.config import settings
from app.schemas.auth import TokenPayload


def create_access_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return pyjwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> TokenPayload:
    try:
        data = pyjwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return TokenPayload(sub=int(data["sub"]), exp=data["exp"])
    except (pyjwt.InvalidTokenError, KeyError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_jwt.py -v`
Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add backend/app/auth/jwt.py backend/tests/test_jwt.py
git commit -m "feat(auth): add JWT create/decode utilities with PyJWT"
```

---

### Task 4: Auth Dependencies

**Files:**
- Create: `backend/app/auth/dependencies.py`
- Create: `backend/app/routes/__init__.py`
- Modify: `backend/tests/conftest.py`

- [ ] **Step 1: Implement auth dependencies**

Create `backend/app/routes/__init__.py`:
```python
```

Create `backend/app/auth/dependencies.py`:
```python
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import decode_access_token
from app.database import get_session
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    payload = decode_access_token(token)
    user = await session.get(User, payload.sub)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_current_admin(
    user: User = Depends(get_current_user),
) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
```

- [ ] **Step 2: Update conftest with auth fixtures**

Add User model import and auth fixtures to `backend/tests/conftest.py`. The file should become:

```python
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.config import settings
from app.database import get_session
from app.main import app
from app.models.user import User  # noqa: F401 — registers table with metadata


@pytest_asyncio.fixture(scope="session")
async def engine():
    engine = create_async_engine(settings.TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def session(engine):
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(session):
    async def override_get_session():
        yield session

    app.dependency_overrides[get_session] = override_get_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_user(session):
    user = User(
        username="testadmin",
        email="admin@test.com",
        password_hash=hash_password("adminpass"),
        is_admin=True,
    )
    session.add(user)
    await session.flush()
    return user


@pytest_asyncio.fixture
async def regular_user(session):
    user = User(
        username="testuser",
        email="user@test.com",
        password_hash=hash_password("userpass"),
        is_admin=False,
    )
    session.add(user)
    await session.flush()
    return user


@pytest_asyncio.fixture
async def admin_token(admin_user):
    return create_access_token(admin_user.id)


@pytest_asyncio.fixture
async def user_token(regular_user):
    return create_access_token(regular_user.id)


@pytest_asyncio.fixture
async def admin_client(session, admin_token):
    async def override_get_session():
        yield session

    app.dependency_overrides[get_session] = override_get_session
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {admin_token}"}
    async with AsyncClient(transport=transport, base_url="http://test", headers=headers) as client:
        yield client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def user_client(session, user_token):
    async def override_get_session():
        yield session

    app.dependency_overrides[get_session] = override_get_session
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {user_token}"}
    async with AsyncClient(transport=transport, base_url="http://test", headers=headers) as client:
        yield client
    app.dependency_overrides.clear()
```

- [ ] **Step 3: Verify imports work**

Run: `cd backend && python -c "from app.auth.dependencies import get_current_user, get_current_admin; print('OK')"`
Expected: `OK`

- [ ] **Step 4: Run existing tests still pass**

Run: `cd backend && python -m pytest tests/test_health.py -v`
Expected: 1 passed

- [ ] **Step 5: Commit**

```bash
git add backend/app/auth/dependencies.py backend/app/routes/__init__.py backend/tests/conftest.py
git commit -m "feat(auth): add auth dependencies and test fixtures"
```

---

### Task 5: Auth Routes (Login + Me)

**Files:**
- Create: `backend/app/routes/auth.py`
- Create: `backend/tests/test_auth.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_auth.py`:
```python
import pytest


class TestLogin:
    async def test_login_success(self, client, admin_user):
        response = await client.post(
            "/api/v1/auth/login",
            json={"username": "testadmin", "password": "adminpass"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client, admin_user):
        response = await client.post(
            "/api/v1/auth/login",
            json={"username": "testadmin", "password": "wrong"},
        )
        assert response.status_code == 401

    async def test_login_nonexistent_user(self, client):
        response = await client.post(
            "/api/v1/auth/login",
            json={"username": "nobody", "password": "pass"},
        )
        assert response.status_code == 401


class TestMe:
    async def test_me_authenticated(self, admin_client, admin_user):
        response = await admin_client.get("/api/v1/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testadmin"
        assert data["email"] == "admin@test.com"
        assert data["is_admin"] is True
        assert "password_hash" not in data

    async def test_me_no_token(self, client):
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401

    async def test_me_expired_token(self, client):
        from datetime import UTC, datetime, timedelta

        import jwt as pyjwt

        from app.config import settings

        payload = {"sub": "1", "exp": datetime.now(UTC) - timedelta(hours=1)}
        expired_token = pyjwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert response.status_code == 401
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_auth.py -v`
Expected: FAIL — 404 (routes not registered yet)

- [ ] **Step 3: Implement auth routes**

Create `backend/app/routes/auth.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import verify_password
from app.database import get_session
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserRead

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    stmt = select(User).where(User.username == body.username)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserRead)
async def me(
    current_user: User = Depends(get_current_user),
) -> UserRead:
    return UserRead.model_validate(current_user)
```

- [ ] **Step 4: Register auth router in main.py**

Modify `backend/app/main.py` to register the router:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.auth import router as auth_router

app = FastAPI(title="Gym Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_auth.py -v`
Expected: 6 passed

- [ ] **Step 6: Run all tests**

Run: `cd backend && python -m pytest tests/ -v`
Expected: all passed (health + password + jwt + auth tests)

- [ ] **Step 7: Commit**

```bash
git add backend/app/routes/auth.py backend/app/main.py backend/tests/test_auth.py
git commit -m "feat(auth): add login and me endpoints"
```

---

### Task 6: User CRUD Routes

**Files:**
- Create: `backend/app/routes/users.py`
- Create: `backend/tests/test_users.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_users.py`:
```python
import pytest


class TestListUsers:
    async def test_list_users_as_admin(self, admin_client, admin_user, regular_user):
        response = await admin_client.get("/api/v1/users")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    async def test_list_users_as_non_admin(self, user_client):
        response = await user_client.get("/api/v1/users")
        assert response.status_code == 403

    async def test_list_users_no_token(self, client):
        response = await client.get("/api/v1/users")
        assert response.status_code == 401


class TestCreateUser:
    async def test_create_user(self, admin_client):
        response = await admin_client.post(
            "/api/v1/users",
            json={"username": "newuser", "email": "new@test.com", "password": "newpass"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "new@test.com"
        assert data["is_admin"] is False
        assert "password_hash" not in data

    async def test_create_user_duplicate_username(self, admin_client, regular_user):
        response = await admin_client.post(
            "/api/v1/users",
            json={"username": "testuser", "email": "other@test.com", "password": "pass"},
        )
        assert response.status_code == 409

    async def test_create_user_duplicate_email(self, admin_client, regular_user):
        response = await admin_client.post(
            "/api/v1/users",
            json={"username": "other", "email": "user@test.com", "password": "pass"},
        )
        assert response.status_code == 409


class TestGetUser:
    async def test_get_user(self, admin_client, regular_user):
        response = await admin_client.get(f"/api/v1/users/{regular_user.id}")
        assert response.status_code == 200
        assert response.json()["username"] == "testuser"

    async def test_get_user_not_found(self, admin_client):
        response = await admin_client.get("/api/v1/users/99999")
        assert response.status_code == 404


class TestUpdateUser:
    async def test_update_user(self, admin_client, regular_user):
        response = await admin_client.patch(
            f"/api/v1/users/{regular_user.id}",
            json={"username": "updated"},
        )
        assert response.status_code == 200
        assert response.json()["username"] == "updated"

    async def test_update_user_duplicate_username(self, admin_client, admin_user, regular_user):
        response = await admin_client.patch(
            f"/api/v1/users/{regular_user.id}",
            json={"username": "testadmin"},
        )
        assert response.status_code == 409

    async def test_update_user_duplicate_email(self, admin_client, admin_user, regular_user):
        response = await admin_client.patch(
            f"/api/v1/users/{regular_user.id}",
            json={"email": "admin@test.com"},
        )
        assert response.status_code == 409


class TestDeleteUser:
    async def test_delete_user(self, admin_client, regular_user):
        response = await admin_client.delete(f"/api/v1/users/{regular_user.id}")
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()

    async def test_delete_user_not_found(self, admin_client):
        response = await admin_client.delete("/api/v1/users/99999")
        assert response.status_code == 404

    async def test_delete_self(self, admin_client, admin_user):
        response = await admin_client.delete(f"/api/v1/users/{admin_user.id}")
        assert response.status_code == 400

    async def test_delete_user_as_non_admin(self, user_client, admin_user):
        response = await user_client.delete(f"/api/v1/users/{admin_user.id}")
        assert response.status_code == 403
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_users.py -v`
Expected: FAIL — 404 (routes not registered yet)

- [ ] **Step 3: Implement user CRUD routes**

Create `backend/app/routes/users.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.auth.dependencies import get_current_admin
from app.auth.password import hash_password
from app.database import get_session
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("", response_model=list[UserRead])
async def list_users(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> list[UserRead]:
    result = await session.execute(select(User))
    users = result.scalars().all()
    return [UserRead.model_validate(u) for u in users]


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> UserRead:
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserRead.model_validate(user)


@router.post("", response_model=UserRead, status_code=201)
async def create_user(
    body: UserCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> UserRead:
    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
    )
    session.add(user)
    try:
        await session.flush()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="Username or email already exists") from exc
    return UserRead.model_validate(user)


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    body: UserUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> UserRead:
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = body.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["password_hash"] = hash_password(update_data.pop("password"))
    for key, value in update_data.items():
        setattr(user, key, value)
    try:
        await session.flush()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="Username or email already exists") from exc
    return UserRead.model_validate(user)


@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_admin: User = Depends(get_current_admin),
) -> MessageResponse:
    if current_admin.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    await session.delete(user)
    await session.flush()
    return MessageResponse(message=f"User '{user.username}' deleted")
```

- [ ] **Step 4: Register users router in main.py**

Add to `backend/app/main.py`:

```python
from app.routes.users import router as users_router
```

And below the existing `app.include_router(auth_router)`:

```python
app.include_router(users_router)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_users.py -v`
Expected: 14 passed

- [ ] **Step 6: Run all tests**

Run: `cd backend && python -m pytest tests/ -v`
Expected: all passed

- [ ] **Step 7: Commit**

```bash
git add backend/app/routes/users.py backend/app/main.py backend/tests/test_users.py
git commit -m "feat(auth): add admin user CRUD endpoints"
```

---

### Task 7: Admin Seed on Startup

**Files:**
- Modify: `backend/app/config.py`
- Modify: `backend/app/main.py`
- Modify: `backend/.env.example`

- [ ] **Step 1: Add admin settings to config**

Modify `backend/app/config.py` — add these fields to the `Settings` class:

```python
ADMIN_USERNAME: str = "admin"
ADMIN_EMAIL: str = "admin@gym-tracker.local"
ADMIN_PASSWORD: str = "changeme"
```

- [ ] **Step 2: Update .env.example**

Add to the end of `backend/.env.example`:

```
# Admin seed (used on first startup only)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@gym-tracker.local
ADMIN_PASSWORD=changeme
```

- [ ] **Step 3: Add lifespan with admin seed to main.py**

Modify `backend/app/main.py` to use a lifespan that seeds the admin:

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import select

from app.auth.password import hash_password
from app.config import settings
from app.database import async_session
from app.models.user import User
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with async_session() as session:
        result = await session.execute(select(User).where(User.is_admin == True))  # noqa: E712
        if result.scalar_one_or_none() is None:
            admin = User(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                is_admin=True,
            )
            session.add(admin)
            await session.commit()

    yield


app = FastAPI(title="Gym Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 4: Run all tests to verify nothing breaks**

Run: `cd backend && python -m pytest tests/ -v`
Expected: all passed (lifespan uses the real DB session, not the test override, so it won't interfere with tests)

- [ ] **Step 5: Commit**

```bash
git add backend/app/config.py backend/app/main.py backend/.env.example
git commit -m "feat(auth): add admin seed on startup via lifespan"
```

---

### Task 8: Alembic Migration + CI Config

**Files:**
- Modify: `backend/alembic/env.py`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add User model import to Alembic env.py**

Add this import to `backend/alembic/env.py` after the existing `from app.config import settings` line:

```python
from app.models.user import User  # noqa: F401 — registers table with metadata
```

- [ ] **Step 2: Generate Alembic migration**

Run: `cd backend && alembic revision --autogenerate -m "create users table"`
Expected: creates a new file in `alembic/versions/`

- [ ] **Step 3: Verify migration file looks correct**

Read the generated migration file. It should contain:
- `op.create_table("users", ...)` with all columns
- `op.create_index` for username
- `op.drop_table("users")` in downgrade

- [ ] **Step 4: Add ADMIN_* env vars to CI workflow**

Modify `.github/workflows/ci.yml` — add these env vars to the `backend-test` job alongside the existing `SECRET_KEY` and `CORS_ORIGINS`:

```yaml
ADMIN_USERNAME: admin
ADMIN_EMAIL: admin@test.com
ADMIN_PASSWORD: testpass
```

- [ ] **Step 5: Run all tests**

Run: `cd backend && python -m pytest tests/ -v`
Expected: all passed

- [ ] **Step 6: Run lint**

Run: `cd backend && bash scripts/lint.sh`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add backend/alembic/env.py backend/alembic/versions/ .github/workflows/ci.yml
git commit -m "feat(auth): add users table migration and update CI config"
```

---

## Verification Checklist

After all tasks complete:

- [ ] `cd backend && python -m pytest tests/ -v` — all tests pass
- [ ] `cd backend && bash scripts/lint.sh` — no lint errors
- [ ] `cd backend && bash scripts/test.sh` — test script works
- [ ] All 8 tasks committed
