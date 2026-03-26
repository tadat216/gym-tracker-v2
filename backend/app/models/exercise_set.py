from decimal import Decimal

from sqlmodel import Field, SQLModel


class ExerciseSetBase(SQLModel):
    id: int
    set_number: int
    reps: int | None = None
    weight: Decimal | None = None
    duration: int | None = None
    is_completed: bool


class ExerciseSet(ExerciseSetBase, table=True):
    __tablename__ = "exercise_sets"

    id: int | None = Field(default=None, primary_key=True)
    session_exercise_id: int = Field(foreign_key="session_exercises.id")
    is_completed: bool = Field(default=False)
