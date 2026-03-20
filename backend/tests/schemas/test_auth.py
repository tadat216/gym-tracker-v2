from datetime import UTC, datetime

from app.schemas.auth import LoginRequest, MessageResponse, TokenPayload, TokenResponse


class TestLoginRequest:
    def test_valid(self):
        req = LoginRequest(username="admin", password="secret")
        assert req.username == "admin"
        assert req.password == "secret"


class TestTokenResponse:
    def test_default_token_type(self):
        resp = TokenResponse(access_token="abc123")
        assert resp.token_type == "bearer"

    def test_custom_token_type(self):
        resp = TokenResponse(access_token="abc123", token_type="custom")
        assert resp.token_type == "custom"


class TestTokenPayload:
    def test_fields(self):
        now = datetime.now(UTC)
        payload = TokenPayload(sub=42, exp=now)
        assert payload.sub == 42
        assert payload.exp == now


class TestMessageResponse:
    def test_message(self):
        resp = MessageResponse(message="done")
        assert resp.message == "done"
