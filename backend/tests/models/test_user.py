from sqlalchemy import inspect
from sqlmodel import SQLModel

from app.models.user import User


class TestUserModel:
    def test_tablename(self):
        assert User.__tablename__ == "users"

    def test_is_registered_in_metadata(self):
        assert "users" in SQLModel.metadata.tables

    def test_columns_exist(self):
        mapper = inspect(User)
        column_names = {col.key for col in mapper.columns}
        expected = {
            "id",
            "username",
            "email",
            "password_hash",
            "is_admin",
            "is_system",
            "created_at",
        }
        assert expected == column_names

    def test_id_is_primary_key(self):
        mapper = inspect(User)
        pk_cols = [col.name for col in mapper.primary_key]
        assert pk_cols == ["id"]

    def test_username_is_unique(self):
        table = SQLModel.metadata.tables["users"]
        username_col = table.c.username
        assert username_col.unique is True

    def test_email_is_unique(self):
        table = SQLModel.metadata.tables["users"]
        email_col = table.c.email
        assert email_col.unique is True

    def test_is_admin_defaults_false(self):
        user = User(username="test", email="t@t.com", password_hash="hash")
        assert user.is_admin is False

    def test_created_at_auto_set(self):
        user = User(username="test", email="t@t.com", password_hash="hash")
        assert user.created_at is not None
