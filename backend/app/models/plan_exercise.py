from sqlmodel import Field, SQLModel


class PlanExerciseBase(SQLModel):
    id: int
    exercise_id: int
    sort_order: int


class PlanExercise(PlanExerciseBase, table=True):
    __tablename__ = "plan_exercises"

    id: int | None = Field(default=None, primary_key=True)
    plan_id: int = Field(foreign_key="workout_plans.id")
    exercise_id: int = Field(foreign_key="exercises.id")
    sort_order: int
