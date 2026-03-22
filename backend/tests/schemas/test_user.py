from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from app.schemas.user import UserCreate, UserRead, UserUpdate


class TestUserCreate:
    def test_valid(self):
        user = UserCreate(username="alice", email="alice@example.com", password="pass123")
        assert user.username == "alice"
        assert user.email == "alice@example.com"
        assert user.password == "pass123"

    def test_missing_required_fields(self):
        with pytest.raises(ValidationError):
            UserCreate(username="alice")


class TestUserUpdate:
    def test_all_optional(self):
        update = UserUpdate()
        assert update.username is None
        assert update.email is None
        assert update.password is None

    def test_partial_update(self):
        update = UserUpdate(username="bob")
        assert update.username == "bob"
        assert update.email is None


class TestUserRead:
    def test_fields(self):
        now = datetime.now(UTC)
        user = UserRead(id=1, username="alice", email="alice@example.com", is_admin=False, created_at=now)
        assert user.id == 1
        assert user.username == "alice"
        assert user.is_admin is False

    def test_missing_required_fields(self):
        with pytest.raises(ValidationError):
            UserRead(id=1, username="alice")
