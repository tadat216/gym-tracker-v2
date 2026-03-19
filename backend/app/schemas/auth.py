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
