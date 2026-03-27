import pytest
from sqlmodel import select

from app.models.exercise import Exercise
from app.models.muscle_group import MuscleGroup


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
            json={
                "username": "newuser",
                "email": "new@test.com",
                "password": "newpass",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "new@test.com"
        assert data["is_admin"] is False
        assert "password_hash" not in data

    async def test_create_user_copies_system_defaults(
        self, admin_client, session, system_user, system_muscle_group, system_exercise
    ):
        response = await admin_client.post(
            "/api/v1/users",
            json={
                "username": "defaultsuser",
                "email": "defaults@test.com",
                "password": "pass",
            },
        )
        assert response.status_code == 201
        new_user_id = response.json()["id"]

        groups = (
            await session.execute(
                select(MuscleGroup).where(MuscleGroup.user_id == new_user_id)
            )
        ).scalars().all()
        assert len(groups) == 1
        assert groups[0].name == "Chest"

        exercises = (
            await session.execute(
                select(Exercise).where(Exercise.user_id == new_user_id)
            )
        ).scalars().all()
        assert len(exercises) == 1
        assert exercises[0].name == "Bench Press"

    async def test_create_user_succeeds_without_system_user(self, admin_client):
        """User creation works even when no system user exists."""
        response = await admin_client.post(
            "/api/v1/users",
            json={
                "username": "nosystemuser",
                "email": "nosystem@test.com",
                "password": "pass",
            },
        )
        assert response.status_code == 201

    async def test_create_user_duplicate_username(self, admin_client, regular_user):
        response = await admin_client.post(
            "/api/v1/users",
            json={
                "username": "testuser",
                "email": "other@test.com",
                "password": "pass",
            },
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

    async def test_update_user_duplicate_username(
        self, admin_client, admin_user, regular_user
    ):
        response = await admin_client.patch(
            f"/api/v1/users/{regular_user.id}",
            json={"username": "testadmin"},
        )
        assert response.status_code == 409

    async def test_update_user_duplicate_email(
        self, admin_client, admin_user, regular_user
    ):
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
