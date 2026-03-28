import datetime as dt
from decimal import Decimal

from sqlmodel import Field, SQLModel

from app.models.workout_session import SessionStatus


class WorkoutSessionCreate(SQLModel):
    plan_id: int | None = None
    date: dt.date | None = None
    notes: str | None = None


class WorkoutSessionUpdate(SQLModel):
    notes: str | None = Field(default=None)
    date: dt.date | None = Field(default=None)


class ExerciseSetCreate(SQLModel):
    set_number: int
    reps: int | None = None
    weight: Decimal | None = None
    duration: int | None = None


class ExerciseSetUpdate(SQLModel):
    set_number: int | None = None
    reps: int | None = None
    weight: Decimal | None = None
    duration: int | None = None
    is_completed: bool | None = None


class ExerciseSetRead(SQLModel):
    id: int
    set_number: int
    reps: int | None
    weight: Decimal | None
    duration: int | None
    is_completed: bool


class SessionExerciseCreate(SQLModel):
    exercise_id: int
    sort_order: int


class SessionExerciseRead(SQLModel):
    id: int
    exercise_id: int
    sort_order: int
    exercise_name: str
    muscle_group_name: str
    sets: list[ExerciseSetRead] = []
    is_completed: bool


class WorkoutSessionRead(SQLModel):
    id: int
    plan_id: int | None
    date: dt.date
    status: SessionStatus
    notes: str | None
    started_at: dt.datetime
    completed_at: dt.datetime | None
    exercises: list[SessionExerciseRead] = []
