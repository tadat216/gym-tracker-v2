from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models.exercise import ExerciseType


class ExerciseCreate(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    type: ExerciseType
    muscle_group_id: int


class ExerciseUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    type: ExerciseType | None = None
    muscle_group_id: int | None = None


class ExerciseRead(SQLModel):
    id: int
    name: str
    type: ExerciseType
    muscle_group_id: int
    is_active: bool
    created_at: datetime
