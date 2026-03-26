import os
import socket

# --- Test safety: set env vars BEFORE any app imports ---
# Must happen at module level (not in pytest_configure) because
# app imports below trigger Settings() which reads env vars immediately.
os.environ.setdefault("ENV_FILE", "../.env.example")

# Block outbound network — allow localhost (test DB), block everything else.
# Prevents accidentally calling paid third-party APIs during tests.
_original_connect = socket.socket.connect


def _guarded_connect(self, address):
    host = address[0] if isinstance(address, tuple) else address
    if host not in ("localhost", "127.0.0.1", "::1"):
        raise RuntimeError(f"Tests blocked outbound connection to {host}")
    return _original_connect(self, address)


socket.socket.connect = _guarded_connect

# --- App imports (after env vars are set) ---

import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import NullPool  # noqa: E402
from sqlmodel import SQLModel  # noqa: E402

from app.auth.jwt import create_access_token  # noqa: E402
from app.auth.password import hash_password  # noqa: E402
from app.config import settings  # noqa: E402
from app.database import get_session  # noqa: E402
from app.main import app  # noqa: E402
from app.models.exercise import Exercise  # noqa: E402, F401 — registers table with metadata
from app.models.muscle_group import MuscleGroup  # noqa: E402, F401 — registers table with metadata
from app.models.plan_exercise import PlanExercise  # noqa: E402, F401 — registers table with metadata
from app.models.user import User  # noqa: E402, F401 — registers table with metadata
from app.models.workout_plan import WorkoutPlan  # noqa: E402, F401 — registers table with metadata


@pytest_asyncio.fixture(scope="session")
async def engine():
    engine = create_async_engine(settings.TEST_DATABASE_URL, poolclass=NullPool)
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
