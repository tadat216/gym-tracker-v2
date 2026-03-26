import enum
from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


class ExerciseType(enum.StrEnum):
    WEIGHT = "weight"
    BODYWEIGHT = "bodyweight"
    DURATION = "duration"


class ExerciseBase(SQLModel):
    id: int
    name: str
    type: ExerciseType
    muscle_group_id: int


class Exercise(ExerciseBase, table=True):
    __tablename__ = "exercises"

    id: int | None = Field(default=None, primary_key=True)
    muscle_group_id: int = Field(foreign_key="muscle_groups.id")
    user_id: int = Field(foreign_key="users.id")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
    )
