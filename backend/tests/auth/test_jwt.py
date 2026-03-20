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
