from datetime import datetime

from sqlmodel import SQLModel


class UserCreate(SQLModel):
    username: str
    email: str
    password: str


class UserUpdate(SQLModel):
    username: str | None = None
    email: str | None = None
    password: str | None = None


class UserRead(SQLModel):
    id: int
    username: str
    email: str
    is_admin: bool
    created_at: datetime
