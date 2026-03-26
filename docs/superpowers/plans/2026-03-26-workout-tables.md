# Workout Tables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the 7 workout-related database tables (muscle_groups, exercises, workout_plans, plan_exercises, workout_sessions, session_exercises, exercise_sets), the system user for default data, and the auth guard — all with TDD.

**Architecture:** SQLModel models with Base/DB split. Each entity has a `FooBase(SQLModel)` for API responses and a `Foo(FooBase, table=True)` for the database. A system user (no password, cannot login) holds default muscle groups and exercises. On new user signup, the system user's data is copied. The `get_current_user` dependency rejects system user tokens.

**Tech Stack:** FastAPI, SQLModel, asyncpg, Alembic, pytest + pytest-asyncio, httpx

**Spec:** `docs/superpowers/specs/2026-03-26-workout-tables-design.md`

---

## File Map

### Models (new files)
- `backend/app/models/muscle_group.py` — MuscleGroupBase + MuscleGroup
- `backend/app/models/exercise.py` — ExerciseType enum + ExerciseBase + Exercise
- `backend/app/models/workout_plan.py` — WorkoutPlanBase + WorkoutPlan
- `backend/app/models/plan_exercise.py` — PlanExerciseBase + PlanExercise
- `backend/app/models/workout_session.py` — SessionStatus enum + WorkoutSessionBase + WorkoutSession
- `backend/app/models/session_exercise.py` — ExerciseStatus enum + SessionExerciseBase + SessionExercise
- `backend/app/models/exercise_set.py` — ExerciseSetBase + ExerciseSet

### Modified files
- `backend/app/models/__init__.py` — export all new models
- `backend/app/auth/dependencies.py` — add system user guard to `get_current_user`
- `backend/app/main.py` — create system user + seed data in lifespan
- `backend/alembic/env.py` — import new models for autogenerate
- `backend/tests/conftest.py` — import new models for test metadata + add system_user fixture

### Seed data
- `backend/app/seed.py` — default muscle groups and exercises data + copy logic

### Tests
- `backend/tests/test_models.py` — model CRUD tests
- `backend/tests/test_auth_guard.py` — system user auth guard test
- `backend/tests/test_seed.py` — seed data copy logic test

---

### Task 1: MuscleGroup Model

**Files:**
- Create: `backend/app/models/muscle_group.py`
- Modify: `backend/app/models/__init__.py`
- Test: `backend/tests/test_models.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_models.py`:

```python
from app.models.muscle_group import MuscleGroup, MuscleGroupBase


class TestMuscleGroupModel:
    async def test_create_muscle_group(self, session, admin_user):
        group = MuscleGroup(
            name="Chest",
            color="#EF4444",
            user_id=admin_user.id,
        )
        session.add(group)
        await session.flush()

        assert group.id is not None
        assert group.name == "Chest"
        assert group.color == "#EF4444"
        assert group.user_id == admin_user.id
        assert group.is_active is True
        assert group.created_at is not None

    async def test_muscle_group_base_excludes_internal_fields(self):
        base = MuscleGroupBase(id=1, name="Chest", color="#EF4444")
        data = base.model_dump()
        assert data == {"id": 1, "name": "Chest", "color": "#EF4444"}
        assert "user_id" not in data
        assert "is_active" not in data
        assert "created_at" not in data
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_models.py::TestMuscleGroupModel -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.models.muscle_group'`

- [ ] **Step 3: Write the MuscleGroup model**

Create `backend/app/models/muscle_group.py`:

```python
from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


class MuscleGroupBase(SQLModel):
    id: int
    name: str
    color: str


class MuscleGroup(MuscleGroupBase, table=True):
    __tablename__ = "muscle_groups"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
    )
```

- [ ] **Step 4: Update models __init__.py**

Add to `backend/app/models/__init__.py`:

```python
from app.models.muscle_group import MuscleGroup, MuscleGroupBase
from app.models.user import User

__all__ = ["MuscleGroup", "MuscleGroupBase", "User"]
```

- [ ] **Step 5: Import model in conftest.py for metadata registration**

In `backend/tests/conftest.py`, add after the existing User import:

```python
from app.models.muscle_group import MuscleGroup  # noqa: F401 — registers table with metadata
```

- [ ] **Step 6: Import model in alembic env.py for autogenerate**

In `backend/alembic/env.py`, add after the existing User import:

```python
from app.models.muscle_group import MuscleGroup  # noqa: F401 — registers table with metadata
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_models.py::TestMuscleGroupModel -v`
Expected: PASS (2 tests)

- [ ] **Step 8: Commit**

```bash
git add backend/app/models/muscle_group.py backend/app/models/__init__.py backend/tests/test_models.py backend/tests/conftest.py backend/alembic/env.py
git commit -m "feat: add MuscleGroup model with Base/DB split"
```

---

### Task 2: Exercise Model

**Files:**
- Create: `backend/app/models/exercise.py`
- Modify: `backend/app/models/__init__.py`
- Test: `backend/tests/test_models.py`

- [ ] **Step 1: Write the failing test**

Append to `backend/tests/test_models.py`:

```python
from app.models.exercise import Exercise, ExerciseBase, ExerciseType
from app.models.muscle_group import MuscleGroup


class TestExerciseModel:
    async def test_create_weight_exercise(self, session, admin_user):
        group = MuscleGroup(name="Chest", color="#EF4444", user_id=admin_user.id)
        session.add(group)
        await session.flush()

        exercise = Exercise(
            name="Bench Press",
            type=ExerciseType.WEIGHT,
            muscle_group_id=group.id,
            user_id=admin_user.id,
        )
        session.add(exercise)
        await session.flush()

        assert exercise.id is not None
        assert exercise.name == "Bench Press"
        assert exercise.type == ExerciseType.WEIGHT
        assert exercise.muscle_group_id == group.id
        assert exercise.is_active is True

    async def test_exercise_types(self):
        assert ExerciseType.WEIGHT == "weight"
        assert ExerciseType.BODYWEIGHT == "bodyweight"
        assert ExerciseType.DURATION == "duration"

    async def test_exercise_base_excludes_internal_fields(self):
        base = ExerciseBase(
            id=1, name="Bench Press", type=ExerciseType.WEIGHT, muscle_group_id=1
        )
        data = base.model_dump()
        assert data == {
            "id": 1,
            "name": "Bench Press",
            "type": "weight",
            "muscle_group_id": 1,
        }
        assert "user_id" not in data
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_models.py::TestExerciseModel -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Write the Exercise model**

Create `backend/app/models/exercise.py`:

```python
import enum
from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


class ExerciseType(str, enum.Enum):
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
```

- [ ] **Step 4: Update models __init__.py**

```python
from app.models.exercise import Exercise, ExerciseBase, ExerciseType
from app.models.muscle_group import MuscleGroup, MuscleGroupBase
from app.models.user import User

__all__ = [
    "Exercise",
    "ExerciseBase",
    "ExerciseType",
    "MuscleGroup",
    "MuscleGroupBase",
    "User",
]
```

- [ ] **Step 5: Import in conftest.py and alembic env.py**

Add to both files after MuscleGroup import:

```python
from app.models.exercise import Exercise  # noqa: F401 — registers table with metadata
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_models.py::TestExerciseModel -v`
Expected: PASS (3 tests)

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/exercise.py backend/app/models/__init__.py backend/tests/test_models.py backend/tests/conftest.py backend/alembic/env.py
git commit -m "feat: add Exercise model with ExerciseType enum"
```

---

### Task 3: WorkoutPlan + PlanExercise Models

**Files:**
- Create: `backend/app/models/workout_plan.py`, `backend/app/models/plan_exercise.py`
- Modify: `backend/app/models/__init__.py`
- Test: `backend/tests/test_models.py`

- [ ] **Step 1: Write the failing test**

Append to `backend/tests/test_models.py`:

```python
from app.models.exercise import Exercise, ExerciseType
from app.models.muscle_group import MuscleGroup
from app.models.plan_exercise import PlanExercise, PlanExerciseBase
from app.models.workout_plan import WorkoutPlan, WorkoutPlanBase


class TestWorkoutPlanModel:
    async def test_create_plan_with_exercises(self, session, admin_user):
        group = MuscleGroup(name="Chest", color="#EF4444", user_id=admin_user.id)
        session.add(group)
        await session.flush()

        exercise = Exercise(
            name="Bench Press",
            type=ExerciseType.WEIGHT,
            muscle_group_id=group.id,
            user_id=admin_user.id,
        )
        session.add(exercise)
        await session.flush()

        plan = WorkoutPlan(name="Push Day A", user_id=admin_user.id)
        session.add(plan)
        await session.flush()

        assert plan.id is not None
        assert plan.name == "Push Day A"
        assert plan.created_at is not None
        assert plan.updated_at is not None

        plan_exercise = PlanExercise(
            plan_id=plan.id,
            exercise_id=exercise.id,
            sort_order=1,
        )
        session.add(plan_exercise)
        await session.flush()

        assert plan_exercise.id is not None
        assert plan_exercise.sort_order == 1

    async def test_plan_base_excludes_internal_fields(self):
        base = WorkoutPlanBase(id=1, name="Push Day A")
        data = base.model_dump()
        assert data == {"id": 1, "name": "Push Day A"}
        assert "user_id" not in data

    async def test_plan_exercise_base_excludes_plan_id(self):
        base = PlanExerciseBase(id=1, exercise_id=5, sort_order=1)
        data = base.model_dump()
        assert data == {"id": 1, "exercise_id": 5, "sort_order": 1}
        assert "plan_id" not in data
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_models.py::TestWorkoutPlanModel -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Write the WorkoutPlan model**

Create `backend/app/models/workout_plan.py`:

```python
from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


class WorkoutPlanBase(SQLModel):
    id: int
    name: str


class WorkoutPlan(WorkoutPlanBase, table=True):
    __tablename__ = "workout_plans"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
    )
```

- [ ] **Step 4: Write the PlanExercise model**

Create `backend/app/models/plan_exercise.py`:

```python
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
```

- [ ] **Step 5: Update models __init__.py**

```python
from app.models.exercise import Exercise, ExerciseBase, ExerciseType
from app.models.muscle_group import MuscleGroup, MuscleGroupBase
from app.models.plan_exercise import PlanExercise, PlanExerciseBase
from app.models.user import User
from app.models.workout_plan import WorkoutPlan, WorkoutPlanBase

__all__ = [
    "Exercise",
    "ExerciseBase",
    "ExerciseType",
    "MuscleGroup",
    "MuscleGroupBase",
    "PlanExercise",
    "PlanExerciseBase",
    "User",
    "WorkoutPlan",
    "WorkoutPlanBase",
]
```

- [ ] **Step 6: Import in conftest.py and alembic env.py**

Add to both files:

```python
from app.models.workout_plan import WorkoutPlan  # noqa: F401
from app.models.plan_exercise import PlanExercise  # noqa: F401
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_models.py::TestWorkoutPlanModel -v`
Expected: PASS (3 tests)

- [ ] **Step 8: Commit**

```bash
git add backend/app/models/workout_plan.py backend/app/models/plan_exercise.py backend/app/models/__init__.py backend/tests/test_models.py backend/tests/conftest.py backend/alembic/env.py
git commit -m "feat: add WorkoutPlan and PlanExercise models"
```

---

### Task 4: WorkoutSession + SessionExercise + ExerciseSet Models

**Files:**
- Create: `backend/app/models/workout_session.py`, `backend/app/models/session_exercise.py`, `backend/app/models/exercise_set.py`
- Modify: `backend/app/models/__init__.py`
- Test: `backend/tests/test_models.py`

- [ ] **Step 1: Write the failing test**

Append to `backend/tests/test_models.py`:

```python
from datetime import date

from app.models.exercise import Exercise, ExerciseType
from app.models.exercise_set import ExerciseSet, ExerciseSetBase
from app.models.muscle_group import MuscleGroup
from app.models.session_exercise import ExerciseStatus, SessionExercise, SessionExerciseBase
from app.models.workout_session import SessionStatus, WorkoutSession, WorkoutSessionBase


class TestWorkoutSessionModels:
    async def test_full_session_workflow(self, session, admin_user):
        """Test creating a full session with exercises and sets."""
        group = MuscleGroup(name="Chest", color="#EF4444", user_id=admin_user.id)
        session.add(group)
        await session.flush()

        exercise = Exercise(
            name="Bench Press",
            type=ExerciseType.WEIGHT,
            muscle_group_id=group.id,
            user_id=admin_user.id,
        )
        session.add(exercise)
        await session.flush()

        workout = WorkoutSession(
            user_id=admin_user.id,
            date=date(2026, 3, 26),
            status=SessionStatus.IN_PROGRESS,
        )
        session.add(workout)
        await session.flush()

        assert workout.id is not None
        assert workout.plan_id is None
        assert workout.status == SessionStatus.IN_PROGRESS
        assert workout.completed_at is None

        session_ex = SessionExercise(
            session_id=workout.id,
            exercise_id=exercise.id,
            sort_order=1,
            status=ExerciseStatus.PENDING,
        )
        session.add(session_ex)
        await session.flush()

        assert session_ex.id is not None
        assert session_ex.status == ExerciseStatus.PENDING

        ex_set = ExerciseSet(
            session_exercise_id=session_ex.id,
            set_number=1,
            reps=8,
            weight=80.0,
            is_completed=True,
        )
        session.add(ex_set)
        await session.flush()

        assert ex_set.id is not None
        assert ex_set.reps == 8
        assert float(ex_set.weight) == 80.0
        assert ex_set.duration is None
        assert ex_set.is_completed is True

    async def test_duration_exercise_set(self, session, admin_user):
        """Test a duration-type set (e.g. plank)."""
        group = MuscleGroup(name="Core", color="#6366F1", user_id=admin_user.id)
        session.add(group)
        await session.flush()

        exercise = Exercise(
            name="Plank",
            type=ExerciseType.DURATION,
            muscle_group_id=group.id,
            user_id=admin_user.id,
        )
        session.add(exercise)
        await session.flush()

        workout = WorkoutSession(
            user_id=admin_user.id,
            date=date(2026, 3, 26),
            status=SessionStatus.IN_PROGRESS,
        )
        session.add(workout)
        await session.flush()

        session_ex = SessionExercise(
            session_id=workout.id,
            exercise_id=exercise.id,
            sort_order=1,
            status=ExerciseStatus.COMPLETED,
        )
        session.add(session_ex)
        await session.flush()

        ex_set = ExerciseSet(
            session_exercise_id=session_ex.id,
            set_number=1,
            duration=60,
            is_completed=True,
        )
        session.add(ex_set)
        await session.flush()

        assert ex_set.duration == 60
        assert ex_set.reps is None
        assert ex_set.weight is None

    async def test_session_base_excludes_user_id(self):
        base = WorkoutSessionBase(
            id=1,
            plan_id=None,
            date=date(2026, 3, 26),
            status=SessionStatus.IN_PROGRESS,
            notes=None,
        )
        data = base.model_dump()
        assert "user_id" not in data
        assert data["status"] == "in_progress"

    async def test_session_exercise_base_excludes_session_id(self):
        base = SessionExerciseBase(
            id=1, exercise_id=5, sort_order=1, status=ExerciseStatus.PENDING
        )
        data = base.model_dump()
        assert "session_id" not in data

    async def test_exercise_set_base_excludes_session_exercise_id(self):
        base = ExerciseSetBase(
            id=1, set_number=1, reps=8, weight=80.0, duration=None, is_completed=True
        )
        data = base.model_dump()
        assert "session_exercise_id" not in data

    async def test_session_status_enum(self):
        assert SessionStatus.IN_PROGRESS == "in_progress"
        assert SessionStatus.COMPLETED == "completed"

    async def test_exercise_status_enum(self):
        assert ExerciseStatus.PENDING == "pending"
        assert ExerciseStatus.COMPLETED == "completed"
        assert ExerciseStatus.SKIPPED == "skipped"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_models.py::TestWorkoutSessionModels -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Write the WorkoutSession model**

Create `backend/app/models/workout_session.py`:

```python
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
    started_at: datetime
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
```

- [ ] **Step 4: Write the SessionExercise model**

Create `backend/app/models/session_exercise.py`:

```python
import enum

from sqlmodel import Field, SQLModel


class ExerciseStatus(str, enum.Enum):
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
```

- [ ] **Step 5: Write the ExerciseSet model**

Create `backend/app/models/exercise_set.py`:

```python
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
```

- [ ] **Step 6: Update models __init__.py**

```python
from app.models.exercise import Exercise, ExerciseBase, ExerciseType
from app.models.exercise_set import ExerciseSet, ExerciseSetBase
from app.models.muscle_group import MuscleGroup, MuscleGroupBase
from app.models.plan_exercise import PlanExercise, PlanExerciseBase
from app.models.session_exercise import (
    ExerciseStatus,
    SessionExercise,
    SessionExerciseBase,
)
from app.models.user import User
from app.models.workout_plan import WorkoutPlan, WorkoutPlanBase
from app.models.workout_session import (
    SessionStatus,
    WorkoutSession,
    WorkoutSessionBase,
)

__all__ = [
    "Exercise",
    "ExerciseBase",
    "ExerciseSet",
    "ExerciseSetBase",
    "ExerciseStatus",
    "ExerciseType",
    "MuscleGroup",
    "MuscleGroupBase",
    "PlanExercise",
    "PlanExerciseBase",
    "SessionExercise",
    "SessionExerciseBase",
    "SessionStatus",
    "User",
    "WorkoutPlan",
    "WorkoutPlanBase",
    "WorkoutSession",
    "WorkoutSessionBase",
]
```

- [ ] **Step 7: Import in conftest.py and alembic env.py**

Add to both files:

```python
from app.models.workout_session import WorkoutSession  # noqa: F401
from app.models.session_exercise import SessionExercise  # noqa: F401
from app.models.exercise_set import ExerciseSet  # noqa: F401
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_models.py::TestWorkoutSessionModels -v`
Expected: PASS (7 tests)

- [ ] **Step 9: Commit**

```bash
git add backend/app/models/workout_session.py backend/app/models/session_exercise.py backend/app/models/exercise_set.py backend/app/models/__init__.py backend/tests/test_models.py backend/tests/conftest.py backend/alembic/env.py
git commit -m "feat: add WorkoutSession, SessionExercise, and ExerciseSet models"
```

---

### Task 5: System User Auth Guard

**Files:**
- Modify: `backend/app/models/user.py`
- Modify: `backend/app/auth/dependencies.py`
- Test: `backend/tests/test_auth_guard.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_auth_guard.py`:

```python
from app.auth.jwt import create_access_token
from app.models.user import User


class TestSystemUserGuard:
    async def test_system_user_rejected(self, client, session):
        """System user tokens must be rejected by get_current_user."""
        system_user = User(
            username="system",
            email="system@system",
            password_hash="",
            is_system=True,
        )
        session.add(system_user)
        await session.flush()

        token = create_access_token(system_user.id)
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        assert response.json()["detail"] == "System user cannot access API"

    async def test_regular_user_not_rejected(self, user_client):
        """Regular users should not be blocked by the guard."""
        response = await user_client.get("/api/v1/auth/me")
        assert response.status_code == 200
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_auth_guard.py -v`
Expected: FAIL (User model has no `is_system` field)

- [ ] **Step 3: Add is_system field to User model**

In `backend/app/models/user.py`, add the field:

```python
from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True)
    password_hash: str
    is_admin: bool = Field(default=False)
    is_system: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
    )
```

- [ ] **Step 4: Add guard to get_current_user**

In `backend/app/auth/dependencies.py`, add the system user check:

```python
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import decode_access_token
from app.database import get_session
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    payload = decode_access_token(token)
    user = await session.get(User, payload.sub)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    if user.is_system:
        raise HTTPException(status_code=403, detail="System user cannot access API")
    return user


async def get_current_admin(
    user: User = Depends(get_current_user),
) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_auth_guard.py -v`
Expected: PASS (2 tests)

- [ ] **Step 6: Run all existing tests to ensure no regression**

Run: `cd backend && python -m pytest tests/ -v`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/user.py backend/app/auth/dependencies.py backend/tests/test_auth_guard.py
git commit -m "feat: add system user auth guard to get_current_user"
```

---

### Task 6: Seed Data and System User Creation

**Files:**
- Create: `backend/app/seed.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_seed.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_seed.py`:

```python
from sqlmodel import select

from app.models.exercise import Exercise, ExerciseType
from app.models.muscle_group import MuscleGroup
from app.models.user import User
from app.seed import SEED_EXERCISES, SEED_MUSCLE_GROUPS, copy_defaults_to_user, create_system_user


class TestSeedData:
    async def test_seed_data_constants_valid(self):
        """Seed data lists should not be empty and all exercises should reference valid groups."""
        assert len(SEED_MUSCLE_GROUPS) == 11
        group_names = {g["name"] for g in SEED_MUSCLE_GROUPS}
        for ex in SEED_EXERCISES:
            assert ex["muscle_group"] in group_names, f"{ex['name']} references unknown group {ex['muscle_group']}"
            assert ex["type"] in ("weight", "bodyweight", "duration")

    async def test_create_system_user(self, session):
        """create_system_user should create the system user with seed data."""
        system_user = await create_system_user(session)

        assert system_user.username == "system"
        assert system_user.is_system is True
        assert system_user.password_hash == ""

        groups = (await session.execute(
            select(MuscleGroup).where(MuscleGroup.user_id == system_user.id)
        )).scalars().all()
        assert len(groups) == 11

        exercises = (await session.execute(
            select(Exercise).where(Exercise.user_id == system_user.id)
        )).scalars().all()
        assert len(exercises) == len(SEED_EXERCISES)

    async def test_create_system_user_idempotent(self, session):
        """Calling create_system_user twice should return the same user."""
        user1 = await create_system_user(session)
        user2 = await create_system_user(session)
        assert user1.id == user2.id

    async def test_copy_defaults_to_user(self, session):
        """copy_defaults_to_user should copy system user's data to a new user."""
        system_user = await create_system_user(session)

        new_user = User(
            username="newguy",
            email="new@test.com",
            password_hash="hash",
        )
        session.add(new_user)
        await session.flush()

        await copy_defaults_to_user(session, system_user.id, new_user.id)

        groups = (await session.execute(
            select(MuscleGroup).where(MuscleGroup.user_id == new_user.id)
        )).scalars().all()
        assert len(groups) == 11

        exercises = (await session.execute(
            select(Exercise).where(Exercise.user_id == new_user.id)
        )).scalars().all()
        assert len(exercises) == len(SEED_EXERCISES)

        # Verify exercises point to the new user's muscle groups, not the system user's
        new_group_ids = {g.id for g in groups}
        for ex in exercises:
            assert ex.user_id == new_user.id
            assert ex.muscle_group_id in new_group_ids
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_seed.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.seed'`

- [ ] **Step 3: Write the seed module**

Create `backend/app/seed.py`:

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.exercise import Exercise, ExerciseType
from app.models.muscle_group import MuscleGroup
from app.models.user import User

SEED_MUSCLE_GROUPS = [
    {"name": "Chest", "color": "#EF4444"},
    {"name": "Lats", "color": "#3B82F6"},
    {"name": "Upper Back", "color": "#0EA5E9"},
    {"name": "Shoulders", "color": "#F59E0B"},
    {"name": "Biceps", "color": "#8B5CF6"},
    {"name": "Triceps", "color": "#EC4899"},
    {"name": "Quads", "color": "#10B981"},
    {"name": "Hamstrings", "color": "#14B8A6"},
    {"name": "Calves", "color": "#059669"},
    {"name": "Core", "color": "#6366F1"},
    {"name": "Cardio", "color": "#F97316"},
]

SEED_EXERCISES = [
    # Chest
    {"name": "Bench Press", "type": "weight", "muscle_group": "Chest"},
    {"name": "Dumbbell Press", "type": "weight", "muscle_group": "Chest"},
    {"name": "Incline Dumbbell Press", "type": "weight", "muscle_group": "Chest"},
    {"name": "Push-ups", "type": "bodyweight", "muscle_group": "Chest"},
    {"name": "Cable Fly", "type": "weight", "muscle_group": "Chest"},
    {"name": "Machine Fly", "type": "weight", "muscle_group": "Chest"},
    # Lats
    {"name": "Pull-ups", "type": "bodyweight", "muscle_group": "Lats"},
    {"name": "Lat Pulldown", "type": "weight", "muscle_group": "Lats"},
    {"name": "Seated Cable Row", "type": "weight", "muscle_group": "Lats"},
    {"name": "Dumbbell Row", "type": "weight", "muscle_group": "Lats"},
    {"name": "Machine Close Grip Row", "type": "weight", "muscle_group": "Lats"},
    # Upper Back
    {"name": "Barbell Row", "type": "weight", "muscle_group": "Upper Back"},
    {"name": "Face Pull", "type": "weight", "muscle_group": "Upper Back"},
    {"name": "Shrugs", "type": "weight", "muscle_group": "Upper Back"},
    {"name": "Machine High Grip Row", "type": "weight", "muscle_group": "Upper Back"},
    # Shoulders
    {"name": "Overhead Press", "type": "weight", "muscle_group": "Shoulders"},
    {"name": "Overhead Press Machine", "type": "weight", "muscle_group": "Shoulders"},
    {"name": "Lateral Raise", "type": "weight", "muscle_group": "Shoulders"},
    {"name": "Lateral Cable Raise", "type": "weight", "muscle_group": "Shoulders"},
    {"name": "Front Raise", "type": "weight", "muscle_group": "Shoulders"},
    {"name": "Reverse Fly", "type": "weight", "muscle_group": "Shoulders"},
    {"name": "Reverse Cable Fly", "type": "weight", "muscle_group": "Shoulders"},
    # Biceps
    {"name": "Barbell Curl", "type": "weight", "muscle_group": "Biceps"},
    {"name": "Dumbbell Curl", "type": "weight", "muscle_group": "Biceps"},
    {"name": "Hammer Curl", "type": "weight", "muscle_group": "Biceps"},
    {"name": "Cable Barbell Curl", "type": "weight", "muscle_group": "Biceps"},
    {"name": "Cable Dumbbell Curl", "type": "weight", "muscle_group": "Biceps"},
    {"name": "Cable Hammer Curl", "type": "weight", "muscle_group": "Biceps"},
    # Triceps
    {"name": "Tricep Pushdown", "type": "weight", "muscle_group": "Triceps"},
    {"name": "Skull Crusher", "type": "weight", "muscle_group": "Triceps"},
    {"name": "Dips", "type": "bodyweight", "muscle_group": "Triceps"},
    {"name": "Cable Tricep Pushdown", "type": "weight", "muscle_group": "Triceps"},
    {"name": "Cable Overhead Tricep Extension", "type": "weight", "muscle_group": "Triceps"},
    # Quads
    {"name": "Squat", "type": "weight", "muscle_group": "Quads"},
    {"name": "Leg Press", "type": "weight", "muscle_group": "Quads"},
    {"name": "Leg Extension", "type": "weight", "muscle_group": "Quads"},
    {"name": "Bulgarian Split Squat", "type": "weight", "muscle_group": "Quads"},
    # Hamstrings
    {"name": "Romanian Deadlift", "type": "weight", "muscle_group": "Hamstrings"},
    {"name": "Leg Curl", "type": "weight", "muscle_group": "Hamstrings"},
    {"name": "Good Morning", "type": "weight", "muscle_group": "Hamstrings"},
    # Calves
    {"name": "Standing Calf Raise", "type": "weight", "muscle_group": "Calves"},
    {"name": "Seated Calf Raise", "type": "weight", "muscle_group": "Calves"},
    # Core
    {"name": "Plank", "type": "duration", "muscle_group": "Core"},
    {"name": "Hanging Leg Raise", "type": "bodyweight", "muscle_group": "Core"},
    {"name": "Ab Wheel Rollout", "type": "bodyweight", "muscle_group": "Core"},
    {"name": "Cable Crunch", "type": "weight", "muscle_group": "Core"},
    # Cardio
    {"name": "Treadmill", "type": "duration", "muscle_group": "Cardio"},
    {"name": "Jump Rope", "type": "duration", "muscle_group": "Cardio"},
]


async def create_system_user(session: AsyncSession) -> User:
    """Create or return the system user with seeded muscle groups and exercises."""
    result = await session.execute(
        select(User).where(User.username == "system")
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        return existing

    system_user = User(
        username="system",
        email="system@system",
        password_hash="",
        is_system=True,
    )
    session.add(system_user)
    await session.flush()

    group_map: dict[str, int] = {}
    for g in SEED_MUSCLE_GROUPS:
        mg = MuscleGroup(name=g["name"], color=g["color"], user_id=system_user.id)
        session.add(mg)
        await session.flush()
        group_map[g["name"]] = mg.id

    for ex in SEED_EXERCISES:
        exercise = Exercise(
            name=ex["name"],
            type=ExerciseType(ex["type"]),
            muscle_group_id=group_map[ex["muscle_group"]],
            user_id=system_user.id,
        )
        session.add(exercise)

    await session.flush()
    return system_user


async def copy_defaults_to_user(
    session: AsyncSession, system_user_id: int, target_user_id: int
) -> None:
    """Copy system user's active muscle groups and exercises to a target user."""
    source_groups = (await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.user_id == system_user_id,
            MuscleGroup.is_active == True,  # noqa: E712
        )
    )).scalars().all()

    group_id_map: dict[int, int] = {}
    for sg in source_groups:
        new_group = MuscleGroup(
            name=sg.name,
            color=sg.color,
            user_id=target_user_id,
        )
        session.add(new_group)
        await session.flush()
        group_id_map[sg.id] = new_group.id

    source_exercises = (await session.execute(
        select(Exercise).where(
            Exercise.user_id == system_user_id,
            Exercise.is_active == True,  # noqa: E712
        )
    )).scalars().all()

    for se in source_exercises:
        new_exercise = Exercise(
            name=se.name,
            type=se.type,
            muscle_group_id=group_id_map[se.muscle_group_id],
            user_id=target_user_id,
        )
        session.add(new_exercise)

    await session.flush()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_seed.py -v`
Expected: PASS (4 tests)

- [ ] **Step 5: Update main.py lifespan to create system user**

Update `backend/app/main.py`:

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import select

from app.auth.password import hash_password
from app.config import settings
from app.database import async_session
from app.models.user import User
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.seed import create_system_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with async_session() as session:
        # Create system user with seed data
        await create_system_user(session)

        # Create admin user if none exists
        result = await session.execute(
            select(User).where(User.is_admin == True)  # noqa: E712
        )
        if result.scalar_one_or_none() is None:
            admin = User(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                is_admin=True,
            )
            session.add(admin)

        await session.commit()

    yield


app = FastAPI(title="Gym Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 6: Run all tests**

Run: `cd backend && python -m pytest tests/ -v`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add backend/app/seed.py backend/app/main.py backend/tests/test_seed.py
git commit -m "feat: add seed data and system user creation on startup"
```

---

### Task 7: Alembic Migration

**Files:**
- Generate: `backend/alembic/versions/<hash>_add_workout_tables.py`

- [ ] **Step 1: Generate migration**

Make sure the dev database is running, then:

```bash
cd backend && uv run alembic revision --autogenerate -m "add workout tables and system user fields"
```

- [ ] **Step 2: Review the generated migration**

Open the generated file and verify it includes:
- `create_table('muscle_groups', ...)` with columns: id, name, color, user_id, is_active, created_at
- `create_table('exercises', ...)` with columns: id, name, type, muscle_group_id, user_id, is_active, created_at
- `create_table('workout_plans', ...)` with columns: id, name, user_id, created_at, updated_at
- `create_table('plan_exercises', ...)` with columns: id, plan_id, exercise_id, sort_order
- `create_table('workout_sessions', ...)` with columns: id, user_id, plan_id, date, status, notes, started_at, completed_at
- `create_table('session_exercises', ...)` with columns: id, session_id, exercise_id, sort_order, status
- `create_table('exercise_sets', ...)` with columns: id, session_exercise_id, set_number, reps, weight, duration, is_completed
- `add_column('users', Column('is_system', Boolean, default=False))`

The `downgrade()` should drop all new tables and remove the `is_system` column.

- [ ] **Step 3: Run the migration**

```bash
cd backend && uv run alembic upgrade head
```

Expected: Migration applies successfully.

- [ ] **Step 4: Commit**

```bash
git add backend/alembic/versions/
git commit -m "feat: add alembic migration for workout tables"
```

---

### Task 8: Run Full Test Suite and Lint

- [ ] **Step 1: Run all backend tests**

```bash
cd backend && python -m pytest tests/ -v
```

Expected: All tests PASS

- [ ] **Step 2: Run linter**

```bash
cd backend && uv run ruff check .
cd backend && uv run ruff format --check .
```

Expected: No lint errors. If there are, fix them.

- [ ] **Step 3: Final commit (if lint fixes needed)**

```bash
git add -A
git commit -m "fix: lint fixes for workout tables"
```
