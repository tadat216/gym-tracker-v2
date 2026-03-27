# Workout Plans CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CRUD endpoints for workout plans and their exercises, following existing service-layer patterns.

**Architecture:** Service layer (`WorkoutPlanService`) handles business logic, route layer translates HTTP ↔ service calls. Plans are user-scoped with soft delete. Plan exercises managed via separate sub-resource endpoints.

**Tech Stack:** FastAPI, SQLModel, SQLAlchemy async, Alembic, pytest + httpx

---

### Task 1: Add `is_active` to WorkoutPlan model + migration

**Files:**
- Modify: `backend/app/models/workout_plan.py`
- Create: `backend/alembic/versions/<auto>_add_is_active_to_workout_plans.py` (Alembic auto-generates)

- [ ] **Step 1: Update WorkoutPlan model**

In `backend/app/models/workout_plan.py`, add `is_active` field:

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
    is_active: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
    )
```

- [ ] **Step 2: Generate Alembic migration**

Run: `cd backend && uv run alembic revision --autogenerate -m "add is_active to workout_plans"`

Verify the generated migration adds a `is_active` boolean column with default `True` to `workout_plans`.

- [ ] **Step 3: Apply migration to dev DB**

Run: `cd backend && uv run alembic upgrade head`
Expected: Migration applies without errors.

- [ ] **Step 4: Commit**

```bash
git add backend/app/models/workout_plan.py backend/alembic/versions/
git commit -m "feat: add is_active to workout_plans model with migration"
```

---

### Task 2: Create schemas + InvalidReorderError

**Files:**
- Create: `backend/app/schemas/workout_plan.py`
- Modify: `backend/app/services/exceptions.py`

- [ ] **Step 1: Create workout plan schemas**

Create `backend/app/schemas/workout_plan.py`:

```python
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
```

- [ ] **Step 2: Add InvalidReorderError**

In `backend/app/services/exceptions.py`, add:

```python
class InvalidReorderError(Exception):
    def __init__(self, entity: str):
        self.entity = entity
        super().__init__(f"Reorder list must contain all {entity} IDs exactly")
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/workout_plan.py backend/app/services/exceptions.py
git commit -m "feat: add workout plan schemas and InvalidReorderError"
```

---

### Task 3: Implement WorkoutPlanService — plan CRUD

**Files:**
- Create: `backend/app/services/workout_plan.py`
- Create: `backend/tests/test_workout_plans.py`

- [ ] **Step 1: Write tests for plan CRUD**

Create `backend/tests/test_workout_plans.py`:

```python
import pytest  # noqa: F401

from app.models.workout_plan import WorkoutPlan


@pytest.fixture
async def workout_plan(session, regular_user):
    plan = WorkoutPlan(name="Push Day", user_id=regular_user.id)
    session.add(plan)
    await session.flush()
    return plan


class TestListWorkoutPlans:
    async def test_list_plans(self, user_client, workout_plan):
        response = await user_client.get("/api/v1/workout-plans")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Push Day"
        assert data[0]["is_active"] is True
        assert "exercises" in data[0]

    async def test_list_plans_excludes_inactive(
        self, user_client, workout_plan, session
    ):
        workout_plan.is_active = False
        await session.flush()
        response = await user_client.get("/api/v1/workout-plans")
        assert response.status_code == 200
        assert len(response.json()) == 0

    async def test_list_plans_scoped_to_user(
        self, user_client, session, admin_user
    ):
        other_plan = WorkoutPlan(name="Other Plan", user_id=admin_user.id)
        session.add(other_plan)
        await session.flush()
        response = await user_client.get("/api/v1/workout-plans")
        assert response.status_code == 200
        assert len(response.json()) == 0

    async def test_list_plans_no_token(self, client):
        response = await client.get("/api/v1/workout-plans")
        assert response.status_code == 401


class TestGetWorkoutPlan:
    async def test_get_plan(self, user_client, workout_plan):
        response = await user_client.get(
            f"/api/v1/workout-plans/{workout_plan.id}"
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Push Day"

    async def test_get_plan_not_found(self, user_client):
        response = await user_client.get("/api/v1/workout-plans/99999")
        assert response.status_code == 404

    async def test_get_plan_other_user(self, user_client, session, admin_user):
        other_plan = WorkoutPlan(name="Other", user_id=admin_user.id)
        session.add(other_plan)
        await session.flush()
        response = await user_client.get(
            f"/api/v1/workout-plans/{other_plan.id}"
        )
        assert response.status_code == 404


class TestCreateWorkoutPlan:
    async def test_create_plan(self, user_client):
        response = await user_client.post(
            "/api/v1/workout-plans",
            json={"name": "Leg Day"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Leg Day"
        assert data["is_active"] is True
        assert data["exercises"] == []

    async def test_create_plan_duplicate_name(self, user_client, workout_plan):
        response = await user_client.post(
            "/api/v1/workout-plans",
            json={"name": "Push Day"},
        )
        assert response.status_code == 409

    async def test_create_plan_reuse_deleted_name(
        self, user_client, workout_plan
    ):
        await user_client.delete(f"/api/v1/workout-plans/{workout_plan.id}")
        response = await user_client.post(
            "/api/v1/workout-plans",
            json={"name": "Push Day"},
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Push Day"


class TestUpdateWorkoutPlan:
    async def test_update_plan(self, user_client, workout_plan):
        response = await user_client.patch(
            f"/api/v1/workout-plans/{workout_plan.id}",
            json={"name": "Pull Day"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Pull Day"

    async def test_update_plan_not_found(self, user_client):
        response = await user_client.patch(
            "/api/v1/workout-plans/99999",
            json={"name": "Nope"},
        )
        assert response.status_code == 404

    async def test_update_plan_duplicate_name(
        self, user_client, workout_plan, session, regular_user
    ):
        plan2 = WorkoutPlan(name="Pull Day", user_id=regular_user.id)
        session.add(plan2)
        await session.flush()
        response = await user_client.patch(
            f"/api/v1/workout-plans/{plan2.id}",
            json={"name": "Push Day"},
        )
        assert response.status_code == 409


class TestDeleteWorkoutPlan:
    async def test_delete_plan(self, user_client, workout_plan):
        response = await user_client.delete(
            f"/api/v1/workout-plans/{workout_plan.id}"
        )
        assert response.status_code == 200
        assert "deactivated" in response.json()["message"].lower()

        list_response = await user_client.get("/api/v1/workout-plans")
        assert len(list_response.json()) == 0

    async def test_delete_plan_not_found(self, user_client):
        response = await user_client.delete("/api/v1/workout-plans/99999")
        assert response.status_code == 404
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pytest tests/test_workout_plans.py -v`
Expected: FAIL — no route registered yet.

- [ ] **Step 3: Implement WorkoutPlanService**

Create `backend/app/services/workout_plan.py`:

```python
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.plan_exercise import PlanExercise
from app.models.workout_plan import WorkoutPlan
from app.schemas.workout_plan import WorkoutPlanCreate, WorkoutPlanUpdate
from app.services.exceptions import DuplicateNameError, NotFoundError


class WorkoutPlanService:
    def __init__(self, session: AsyncSession, user_id: int):
        self.session = session
        self.user_id = user_id

    async def list(self) -> list[tuple[WorkoutPlan, list[PlanExercise]]]:
        result = await self.session.execute(
            select(WorkoutPlan)
            .where(
                WorkoutPlan.user_id == self.user_id,
                WorkoutPlan.is_active == True,  # noqa: E712
            )
            .order_by(WorkoutPlan.updated_at.desc())
        )
        plans = list(result.scalars().all())
        if not plans:
            return []

        plan_ids = [p.id for p in plans]
        ex_result = await self.session.execute(
            select(PlanExercise)
            .where(PlanExercise.plan_id.in_(plan_ids))
            .order_by(PlanExercise.sort_order)
        )
        all_exercises = list(ex_result.scalars().all())

        exercises_by_plan: dict[int, list[PlanExercise]] = {}
        for ex in all_exercises:
            exercises_by_plan.setdefault(ex.plan_id, []).append(ex)

        return [(p, exercises_by_plan.get(p.id, [])) for p in plans]

    async def get(self, plan_id: int) -> tuple[WorkoutPlan, list[PlanExercise]]:
        result = await self.session.execute(
            select(WorkoutPlan).where(
                WorkoutPlan.id == plan_id,
                WorkoutPlan.user_id == self.user_id,
                WorkoutPlan.is_active == True,  # noqa: E712
            )
        )
        plan = result.scalar_one_or_none()
        if plan is None:
            raise NotFoundError("Workout plan")

        ex_result = await self.session.execute(
            select(PlanExercise)
            .where(PlanExercise.plan_id == plan.id)
            .order_by(PlanExercise.sort_order)
        )
        exercises = list(ex_result.scalars().all())
        return (plan, exercises)

    async def create(self, data: WorkoutPlanCreate) -> WorkoutPlan:
        await self._check_duplicate_name(data.name)
        plan = WorkoutPlan(
            name=data.name,
            user_id=self.user_id,
        )
        self.session.add(plan)
        await self.session.flush()
        return plan

    async def update(
        self, plan_id: int, data: WorkoutPlanUpdate
    ) -> WorkoutPlan:
        plan, _ = await self.get(plan_id)
        update_data = data.model_dump(exclude_unset=True)
        if "name" in update_data:
            await self._check_duplicate_name(
                update_data["name"], exclude_id=plan_id
            )
        for key, value in update_data.items():
            setattr(plan, key, value)
        plan.updated_at = datetime.now(UTC)
        await self.session.flush()
        return plan

    async def delete(self, plan_id: int) -> WorkoutPlan:
        plan, _ = await self.get(plan_id)
        plan.is_active = False
        await self.session.flush()
        return plan

    async def _check_duplicate_name(
        self, name: str, *, exclude_id: int | None = None
    ) -> None:
        query = select(WorkoutPlan).where(
            WorkoutPlan.user_id == self.user_id,
            WorkoutPlan.name == name,
            WorkoutPlan.is_active == True,  # noqa: E712
        )
        if exclude_id is not None:
            query = query.where(WorkoutPlan.id != exclude_id)
        result = await self.session.execute(query)
        if result.scalar_one_or_none() is not None:
            raise DuplicateNameError("Workout plan", name)
```

- [ ] **Step 4: Create workout plans route**

Create `backend/app/routes/workout_plans.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_session
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.workout_plan import (
    PlanExerciseRead,
    WorkoutPlanCreate,
    WorkoutPlanRead,
    WorkoutPlanUpdate,
)
from app.services.exceptions import DuplicateNameError, NotFoundError
from app.services.workout_plan import WorkoutPlanService

router = APIRouter(prefix="/api/v1/workout-plans", tags=["workout-plans"])


def _to_plan_read(plan, exercises) -> WorkoutPlanRead:
    return WorkoutPlanRead(
        id=plan.id,
        name=plan.name,
        is_active=plan.is_active,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        exercises=[PlanExerciseRead.model_validate(e) for e in exercises],
    )


@router.get(
    "", response_model=list[WorkoutPlanRead], operation_id="listWorkoutPlans"
)
async def list_workout_plans(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[WorkoutPlanRead]:
    svc = WorkoutPlanService(session, current_user.id)
    plans = await svc.list()
    return [_to_plan_read(p, exs) for p, exs in plans]


@router.get(
    "/{plan_id}",
    response_model=WorkoutPlanRead,
    operation_id="getWorkoutPlan",
)
async def get_workout_plan(
    plan_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> WorkoutPlanRead:
    svc = WorkoutPlanService(session, current_user.id)
    try:
        plan, exercises = await svc.get(plan_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return _to_plan_read(plan, exercises)


@router.post(
    "",
    response_model=WorkoutPlanRead,
    status_code=201,
    operation_id="createWorkoutPlan",
)
async def create_workout_plan(
    body: WorkoutPlanCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> WorkoutPlanRead:
    svc = WorkoutPlanService(session, current_user.id)
    try:
        plan = await svc.create(body)
    except DuplicateNameError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return _to_plan_read(plan, [])


@router.patch(
    "/{plan_id}",
    response_model=WorkoutPlanRead,
    operation_id="updateWorkoutPlan",
)
async def update_workout_plan(
    plan_id: int,
    body: WorkoutPlanUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> WorkoutPlanRead:
    svc = WorkoutPlanService(session, current_user.id)
    try:
        plan = await svc.update(plan_id, body)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except DuplicateNameError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    _, exercises = await svc.get(plan_id)
    return _to_plan_read(plan, exercises)


@router.delete(
    "/{plan_id}",
    response_model=MessageResponse,
    operation_id="deleteWorkoutPlan",
)
async def delete_workout_plan(
    plan_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    svc = WorkoutPlanService(session, current_user.id)
    try:
        plan = await svc.delete(plan_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return MessageResponse(message=f"Workout plan '{plan.name}' deactivated")
```

- [ ] **Step 5: Register router in main.py**

In `backend/app/main.py`, add the import and include:

```python
from app.routes.workout_plans import router as workout_plans_router
```

Add after the existing `app.include_router(admin_exercises_router)` line:

```python
app.include_router(workout_plans_router)
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_workout_plans.py -v`
Expected: All plan CRUD tests PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/app/services/workout_plan.py backend/app/routes/workout_plans.py backend/app/main.py backend/tests/test_workout_plans.py
git commit -m "feat: add workout plan CRUD endpoints with tests"
```

---

### Task 4: Add plan exercise endpoints — add and remove

**Files:**
- Modify: `backend/app/services/workout_plan.py`
- Modify: `backend/app/routes/workout_plans.py`
- Modify: `backend/tests/test_workout_plans.py`

- [ ] **Step 1: Write tests for add/remove plan exercises**

Append to `backend/tests/test_workout_plans.py`:

```python
from app.models.exercise import Exercise, ExerciseType
from app.models.muscle_group import MuscleGroup
from app.models.plan_exercise import PlanExercise


class TestAddPlanExercise:
    async def test_add_exercise_to_plan(
        self, user_client, workout_plan, exercise
    ):
        response = await user_client.post(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["exercise_id"] == exercise.id
        assert data["sort_order"] == 0

    async def test_add_exercise_plan_not_found(self, user_client, exercise):
        response = await user_client.post(
            "/api/v1/workout-plans/99999/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        assert response.status_code == 404

    async def test_add_exercise_not_found(self, user_client, workout_plan):
        response = await user_client.post(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises",
            json={"exercise_id": 99999, "sort_order": 0},
        )
        assert response.status_code == 400

    async def test_add_exercise_other_users_exercise(
        self, user_client, workout_plan, session, admin_user
    ):
        mg = MuscleGroup(name="Back", color="#0000FF", user_id=admin_user.id)
        session.add(mg)
        await session.flush()
        other_ex = Exercise(
            name="Other",
            type=ExerciseType.WEIGHT,
            muscle_group_id=mg.id,
            user_id=admin_user.id,
        )
        session.add(other_ex)
        await session.flush()
        response = await user_client.post(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises",
            json={"exercise_id": other_ex.id, "sort_order": 0},
        )
        assert response.status_code == 400

    async def test_add_exercise_shows_in_plan(
        self, user_client, workout_plan, exercise
    ):
        await user_client.post(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        response = await user_client.get(
            f"/api/v1/workout-plans/{workout_plan.id}"
        )
        assert len(response.json()["exercises"]) == 1


class TestRemovePlanExercise:
    async def test_remove_exercise_from_plan(
        self, user_client, workout_plan, exercise, session
    ):
        pe = PlanExercise(
            plan_id=workout_plan.id,
            exercise_id=exercise.id,
            sort_order=0,
        )
        session.add(pe)
        await session.flush()
        response = await user_client.delete(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises/{pe.id}"
        )
        assert response.status_code == 200
        assert "removed" in response.json()["message"].lower()

    async def test_remove_exercise_plan_not_found(self, user_client):
        response = await user_client.delete(
            "/api/v1/workout-plans/99999/exercises/1"
        )
        assert response.status_code == 404

    async def test_remove_exercise_not_in_plan(
        self, user_client, workout_plan
    ):
        response = await user_client.delete(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises/99999"
        )
        assert response.status_code == 404
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pytest tests/test_workout_plans.py::TestAddPlanExercise -v`
Expected: FAIL — endpoints not implemented yet.

- [ ] **Step 3: Add service methods for add/remove**

In `backend/app/services/workout_plan.py`, add these imports at top:

```python
from app.models.exercise import Exercise
from app.schemas.workout_plan import PlanExerciseCreate
from app.services.exceptions import InvalidReferenceError
```

Add these methods to `WorkoutPlanService`:

```python
    async def add_exercise(
        self, plan_id: int, data: PlanExerciseCreate
    ) -> PlanExercise:
        plan, _ = await self.get(plan_id)
        await self._validate_exercise(data.exercise_id)
        pe = PlanExercise(
            plan_id=plan.id,
            exercise_id=data.exercise_id,
            sort_order=data.sort_order,
        )
        self.session.add(pe)
        await self.session.flush()
        return pe

    async def remove_exercise(
        self, plan_id: int, plan_exercise_id: int
    ) -> None:
        await self.get(plan_id)
        result = await self.session.execute(
            select(PlanExercise).where(
                PlanExercise.id == plan_exercise_id,
                PlanExercise.plan_id == plan_id,
            )
        )
        pe = result.scalar_one_or_none()
        if pe is None:
            raise NotFoundError("Plan exercise")
        await self.session.delete(pe)
        await self.session.flush()

    async def _validate_exercise(self, exercise_id: int) -> None:
        result = await self.session.execute(
            select(Exercise).where(
                Exercise.id == exercise_id,
                Exercise.user_id == self.user_id,
                Exercise.is_active == True,  # noqa: E712
            )
        )
        if result.scalar_one_or_none() is None:
            raise InvalidReferenceError("Plan exercise", "exercise_id")
```

- [ ] **Step 4: Add route endpoints for add/remove**

In `backend/app/routes/workout_plans.py`, add `InvalidReferenceError` to the exceptions import:

```python
from app.services.exceptions import (
    DuplicateNameError,
    InvalidReferenceError,
    NotFoundError,
)
```

Add `PlanExerciseCreate` to the schema import:

```python
from app.schemas.workout_plan import (
    PlanExerciseCreate,
    PlanExerciseRead,
    WorkoutPlanCreate,
    WorkoutPlanRead,
    WorkoutPlanUpdate,
)
```

Add these route handlers:

```python
@router.post(
    "/{plan_id}/exercises",
    response_model=PlanExerciseRead,
    status_code=201,
    operation_id="addPlanExercise",
)
async def add_plan_exercise(
    plan_id: int,
    body: PlanExerciseCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PlanExerciseRead:
    svc = WorkoutPlanService(session, current_user.id)
    try:
        pe = await svc.add_exercise(plan_id, body)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidReferenceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return PlanExerciseRead.model_validate(pe)


@router.delete(
    "/{plan_id}/exercises/{plan_exercise_id}",
    response_model=MessageResponse,
    operation_id="removePlanExercise",
)
async def remove_plan_exercise(
    plan_id: int,
    plan_exercise_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    svc = WorkoutPlanService(session, current_user.id)
    try:
        await svc.remove_exercise(plan_id, plan_exercise_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return MessageResponse(message="Exercise removed from plan")
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_workout_plans.py -v`
Expected: All tests PASS (plan CRUD + add/remove).

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/workout_plan.py backend/app/routes/workout_plans.py backend/tests/test_workout_plans.py
git commit -m "feat: add plan exercise add/remove endpoints with tests"
```

---

### Task 5: Add plan exercise reorder endpoint

**Files:**
- Modify: `backend/app/services/workout_plan.py`
- Modify: `backend/app/routes/workout_plans.py`
- Modify: `backend/tests/test_workout_plans.py`

- [ ] **Step 1: Write tests for reorder**

Append to `backend/tests/test_workout_plans.py`:

```python
class TestReorderPlanExercises:
    async def test_reorder_exercises(
        self, user_client, workout_plan, exercise, session, regular_user,
        muscle_group,
    ):
        ex2 = Exercise(
            name="Incline Press",
            type=ExerciseType.WEIGHT,
            muscle_group_id=muscle_group.id,
            user_id=regular_user.id,
        )
        session.add(ex2)
        await session.flush()

        pe1 = PlanExercise(
            plan_id=workout_plan.id, exercise_id=exercise.id, sort_order=0
        )
        pe2 = PlanExercise(
            plan_id=workout_plan.id, exercise_id=ex2.id, sort_order=1
        )
        session.add_all([pe1, pe2])
        await session.flush()

        response = await user_client.patch(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises/reorder",
            json={"plan_exercise_ids": [pe2.id, pe1.id]},
        )
        assert response.status_code == 200

        plan_response = await user_client.get(
            f"/api/v1/workout-plans/{workout_plan.id}"
        )
        exercises = plan_response.json()["exercises"]
        assert exercises[0]["id"] == pe2.id
        assert exercises[0]["sort_order"] == 0
        assert exercises[1]["id"] == pe1.id
        assert exercises[1]["sort_order"] == 1

    async def test_reorder_plan_not_found(self, user_client):
        response = await user_client.patch(
            "/api/v1/workout-plans/99999/exercises/reorder",
            json={"plan_exercise_ids": []},
        )
        assert response.status_code == 404

    async def test_reorder_missing_ids(
        self, user_client, workout_plan, exercise, session
    ):
        pe = PlanExercise(
            plan_id=workout_plan.id, exercise_id=exercise.id, sort_order=0
        )
        session.add(pe)
        await session.flush()
        response = await user_client.patch(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises/reorder",
            json={"plan_exercise_ids": []},
        )
        assert response.status_code == 400

    async def test_reorder_extra_ids(
        self, user_client, workout_plan, exercise, session
    ):
        pe = PlanExercise(
            plan_id=workout_plan.id, exercise_id=exercise.id, sort_order=0
        )
        session.add(pe)
        await session.flush()
        response = await user_client.patch(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises/reorder",
            json={"plan_exercise_ids": [pe.id, 99999]},
        )
        assert response.status_code == 400
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pytest tests/test_workout_plans.py::TestReorderPlanExercises -v`
Expected: FAIL — endpoint not implemented yet.

- [ ] **Step 3: Add reorder service method**

In `backend/app/services/workout_plan.py`, add the import:

```python
from app.schemas.workout_plan import PlanExerciseCreate, PlanExerciseReorder
from app.services.exceptions import (
    DuplicateNameError,
    InvalidReorderError,
    InvalidReferenceError,
    NotFoundError,
)
```

Add this method to `WorkoutPlanService`:

```python
    async def reorder_exercises(
        self, plan_id: int, data: PlanExerciseReorder
    ) -> None:
        _, exercises = await self.get(plan_id)
        current_ids = {e.id for e in exercises}
        new_ids = set(data.plan_exercise_ids)
        if current_ids != new_ids:
            raise InvalidReorderError("plan exercise")

        id_to_exercise = {e.id: e for e in exercises}
        for order, pe_id in enumerate(data.plan_exercise_ids):
            id_to_exercise[pe_id].sort_order = order
        await self.session.flush()
```

- [ ] **Step 4: Add reorder route endpoint**

In `backend/app/routes/workout_plans.py`, add `InvalidReorderError` to the exceptions import:

```python
from app.services.exceptions import (
    DuplicateNameError,
    InvalidReorderError,
    InvalidReferenceError,
    NotFoundError,
)
```

Add `PlanExerciseReorder` to the schema import:

```python
from app.schemas.workout_plan import (
    PlanExerciseCreate,
    PlanExerciseRead,
    PlanExerciseReorder,
    WorkoutPlanCreate,
    WorkoutPlanRead,
    WorkoutPlanUpdate,
)
```

Add this route handler (place it **before** the `remove_plan_exercise` handler so `/reorder` matches before `/{plan_exercise_id}`):

```python
@router.patch(
    "/{plan_id}/exercises/reorder",
    response_model=MessageResponse,
    operation_id="reorderPlanExercises",
)
async def reorder_plan_exercises(
    plan_id: int,
    body: PlanExerciseReorder,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    svc = WorkoutPlanService(session, current_user.id)
    try:
        await svc.reorder_exercises(plan_id, body)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidReorderError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return MessageResponse(message="Exercises reordered")
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_workout_plans.py -v`
Expected: All tests PASS.

- [ ] **Step 6: Run full test suite**

Run: `cd backend && pytest tests/ -v`
Expected: All existing tests still PASS — no regressions.

- [ ] **Step 7: Commit**

```bash
git add backend/app/services/workout_plan.py backend/app/routes/workout_plans.py backend/app/services/exceptions.py backend/tests/test_workout_plans.py
git commit -m "feat: add plan exercise reorder endpoint with tests"
```

---

### Task 6: Run linting and final verification

**Files:** None (verification only)

- [ ] **Step 1: Run ruff linter**

Run: `cd backend && uv run ruff check .`
Expected: No errors.

- [ ] **Step 2: Run ruff formatter check**

Run: `cd backend && uv run ruff format --check .`
Expected: No formatting issues.

- [ ] **Step 3: Fix any issues found, commit if needed**

If ruff reports issues, fix them and commit:

```bash
git add -A
git commit -m "fix: resolve linting issues"
```
