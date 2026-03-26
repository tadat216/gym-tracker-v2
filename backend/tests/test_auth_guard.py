from app.auth.jwt import create_access_token
from app.models.user import User


class TestSystemUserGuard:
    async def test_system_user_rejected(self, client, session):
        """System user tokens must be rejected by get_current_user."""
        system_user = User(
            username="system",
            email="system@system",
            password_hash="",
            is_system=True,
        )
        session.add(system_user)
        await session.flush()

        token = create_access_token(system_user.id)
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        assert response.json()["detail"] == "System user cannot access API"

    async def test_regular_user_not_rejected(self, user_client):
        """Regular users should not be blocked by the guard."""
        response = await user_client.get("/api/v1/auth/me")
        assert response.status_code == 200
