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
