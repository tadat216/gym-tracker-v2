from datetime import datetime

from sqlmodel import SQLModel

from app.models.exercise import ExerciseType


class ExerciseCreate(SQLModel):
    name: str
    type: ExerciseType
    muscle_group_id: int


class ExerciseUpdate(SQLModel):
    name: str | None = None
    type: ExerciseType | None = None
    muscle_group_id: int | None = None


class ExerciseRead(SQLModel):
    id: int
    name: str
    type: ExerciseType
    muscle_group_id: int
    is_active: bool
    created_at: datetime
