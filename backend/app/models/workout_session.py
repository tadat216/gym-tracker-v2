import enum
from datetime import UTC, date, datetime

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


class SessionStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class WorkoutSessionBase(SQLModel):
    id: int
    plan_id: int | None = None
    date: date
    status: SessionStatus
    notes: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None


class WorkoutSession(WorkoutSessionBase, table=True):
    __tablename__ = "workout_sessions"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    plan_id: int | None = Field(default=None, foreign_key="workout_plans.id")
    started_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
    )
    completed_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
    )
