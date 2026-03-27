from datetime import datetime

from sqlmodel import Field, SQLModel


class WorkoutPlanCreate(SQLModel):
    name: str = Field(min_length=1, max_length=100)


class WorkoutPlanUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)


class PlanExerciseCreate(SQLModel):
    exercise_id: int
    sort_order: int


class PlanExerciseReorder(SQLModel):
    plan_exercise_ids: list[int]


class PlanExerciseRead(SQLModel):
    id: int
    exercise_id: int
    sort_order: int


class WorkoutPlanRead(SQLModel):
    id: int
    name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    exercises: list[PlanExerciseRead] = []
