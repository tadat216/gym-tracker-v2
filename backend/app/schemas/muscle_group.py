from datetime import datetime

from sqlmodel import Field, SQLModel


class MuscleGroupCreate(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    color: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")


class MuscleGroupUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")


class MuscleGroupRead(SQLModel):
    id: int
    name: str
    color: str
    is_active: bool
    created_at: datetime
