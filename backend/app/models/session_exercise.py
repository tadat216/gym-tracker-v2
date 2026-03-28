import enum

from sqlmodel import Field, SQLModel


# DEPRECATED: status field is kept for DB compatibility but exercise completion
# is now derived from sets (all sets completed = exercise completed).
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
