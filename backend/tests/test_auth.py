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
