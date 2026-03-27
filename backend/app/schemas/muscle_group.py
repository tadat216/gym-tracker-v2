from datetime import datetime

from sqlmodel import SQLModel


class MuscleGroupCreate(SQLModel):
    name: str
    color: str


class MuscleGroupUpdate(SQLModel):
    name: str | None = None
    color: str | None = None


class MuscleGroupRead(SQLModel):
    id: int
    name: str
    color: str
    is_active: bool
    created_at: datetime
