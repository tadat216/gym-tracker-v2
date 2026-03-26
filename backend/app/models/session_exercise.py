import enum

from sqlmodel import Field, SQLModel


class ExerciseStatus(enum.StrEnum):
    PENDING = "pending"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class SessionExerciseBase(SQLModel):
    id: int
    exercise_id: int
    sort_order: int
    status: ExerciseStatus


class SessionExercise(SessionExerciseBase, table=True):
    __tablename__ = "session_exercises"

    id: int | None = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="workout_sessions.id")
    exercise_id: int = Field(foreign_key="exercises.id")
    sort_order: int
    status: ExerciseStatus = Field(default=ExerciseStatus.PENDING)
