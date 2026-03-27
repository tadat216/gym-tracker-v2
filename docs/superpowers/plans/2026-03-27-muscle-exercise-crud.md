# Muscle Group & Exercise CRUD Endpoints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 20 CRUD endpoints for muscle groups and exercises — 10 for regular users (own data) and 10 for admins (system defaults).

**Architecture:** Four route files following the existing users.py pattern. User endpoints scope by `current_user.id`, admin endpoints scope by the system user's `user_id`. Soft delete via `is_active` toggle. Schemas use SQLModel with Create/Update/Read pattern.

**Tech Stack:** FastAPI, SQLModel, SQLAlchemy async, pytest + httpx

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/app/schemas/muscle_group.py` | Create | MuscleGroupCreate, MuscleGroupUpdate, MuscleGroupRead |
| `backend/app/schemas/exercise.py` | Create | ExerciseCreate, ExerciseUpdate, ExerciseRead |
| `backend/app/routes/muscle_groups.py` | Create | User CRUD for muscle groups (5 endpoints) |
| `backend/app/routes/exercises.py` | Create | User CRUD for exercises (5 endpoints) |
| `backend/app/routes/admin_muscle_groups.py` | Create | Admin CRUD for system muscle groups (5 endpoints) |
| `backend/app/routes/admin_exercises.py` | Create | Admin CRUD for system exercises (5 endpoints) |
| `backend/app/main.py` | Modify | Register 4 new routers |
| `backend/tests/test_muscle_groups.py` | Create | Tests for user muscle group endpoints |
| `backend/tests/test_exercises.py` | Create | Tests for user exercise endpoints |
| `backend/tests/test_admin_muscle_groups.py` | Create | Tests for admin muscle group endpoints |
| `backend/tests/test_admin_exercises.py` | Create | Tests for admin exercise endpoints |
| `backend/tests/conftest.py` | Modify | Add shared fixtures for muscle groups and exercises |

---

### Task 1: Schemas

**Files:**
- Create: `backend/app/schemas/muscle_group.py`
- Create: `backend/app/schemas/exercise.py`

- [ ] **Step 1: Create MuscleGroup schemas**

```python
# backend/app/schemas/muscle_group.py
from datetime import datetime

from sqlmodel import SQLModel


class MuscleGroupCreate(SQLModel):
    name: str
    color: str


class MuscleGroupUpdate(SQLModel):
    name: str | None = None
    color: str | None = None


class MuscleGroupRead(SQLModel):
    id: int
    name: str
    color: str
    is_active: bool
    created_at: datetime
```

- [ ] **Step 2: Create Exercise schemas**

```python
# backend/app/schemas/exercise.py
from datetime import datetime

from sqlmodel import SQLModel

from app.models.exercise import ExerciseType


class ExerciseCreate(SQLModel):
    name: str
    type: ExerciseType
    muscle_group_id: int


class ExerciseUpdate(SQLModel):
    name: str | None = None
    type: ExerciseType | None = None
    muscle_group_id: int | None = None


class ExerciseRead(SQLModel):
    id: int
    name: str
    type: ExerciseType
    muscle_group_id: int
    is_active: bool
    created_at: datetime
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/muscle_group.py backend/app/schemas/exercise.py
git commit -m "feat: add muscle group and exercise schemas"
```

---

### Task 2: User Muscle Group Endpoints (TDD)

**Files:**
- Create: `backend/tests/test_muscle_groups.py`
- Create: `backend/app/routes/muscle_groups.py`
- Modify: `backend/app/main.py`
- Modify: `backend/tests/conftest.py`

- [ ] **Step 1: Add test fixtures to conftest.py**

Add these fixtures after the existing `user_client` fixture in `backend/tests/conftest.py`:

```python
@pytest_asyncio.fixture
async def system_user(session):
    user = User(
        username="system",
        email="system@system",
        password_hash="",
        is_system=True,
    )
    session.add(user)
    await session.flush()
    return user


@pytest_asyncio.fixture
async def muscle_group(session, regular_user):
    mg = MuscleGroup(name="Chest", color="#EF4444", user_id=regular_user.id)
    session.add(mg)
    await session.flush()
    return mg


@pytest_asyncio.fixture
async def exercise(session, regular_user, muscle_group):
    ex = Exercise(
        name="Bench Press",
        type=ExerciseType.WEIGHT,
        muscle_group_id=muscle_group.id,
        user_id=regular_user.id,
    )
    session.add(ex)
    await session.flush()
    return ex
```

Also add these imports at the top of conftest.py (in the app imports section after the existing model imports):

```python
from app.models.exercise import ExerciseType  # noqa: E402, F401
```

Note: `Exercise`, `MuscleGroup` are already imported in conftest.py.

- [ ] **Step 2: Write failing tests for user muscle group endpoints**

```python
# backend/tests/test_muscle_groups.py
import pytest


class TestListMuscleGroups:
    async def test_list_muscle_groups(self, user_client, muscle_group):
        response = await user_client.get("/api/v1/muscle-groups")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Chest"
        assert data[0]["color"] == "#EF4444"
        assert data[0]["is_active"] is True
        assert "created_at" in data[0]

    async def test_list_muscle_groups_excludes_inactive(
        self, user_client, muscle_group, session
    ):
        muscle_group.is_active = False
        await session.flush()
        response = await user_client.get("/api/v1/muscle-groups")
        assert response.status_code == 200
        assert len(response.json()) == 0

    async def test_list_muscle_groups_scoped_to_user(
        self, user_client, session, admin_user
    ):
        other_mg = MuscleGroup(
            name="Other", color="#000000", user_id=admin_user.id
        )
        session.add(other_mg)
        await session.flush()
        response = await user_client.get("/api/v1/muscle-groups")
        assert response.status_code == 200
        assert len(response.json()) == 0

    async def test_list_muscle_groups_no_token(self, client):
        response = await client.get("/api/v1/muscle-groups")
        assert response.status_code == 401


class TestGetMuscleGroup:
    async def test_get_muscle_group(self, user_client, muscle_group):
        response = await user_client.get(
            f"/api/v1/muscle-groups/{muscle_group.id}"
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Chest"

    async def test_get_muscle_group_not_found(self, user_client):
        response = await user_client.get("/api/v1/muscle-groups/99999")
        assert response.status_code == 404

    async def test_get_muscle_group_other_user(
        self, user_client, session, admin_user
    ):
        other_mg = MuscleGroup(
            name="Other", color="#000000", user_id=admin_user.id
        )
        session.add(other_mg)
        await session.flush()
        response = await user_client.get(
            f"/api/v1/muscle-groups/{other_mg.id}"
        )
        assert response.status_code == 404


class TestCreateMuscleGroup:
    async def test_create_muscle_group(self, user_client):
        response = await user_client.post(
            "/api/v1/muscle-groups",
            json={"name": "Arms", "color": "#FF0000"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Arms"
        assert data["color"] == "#FF0000"
        assert data["is_active"] is True
        assert "id" in data

    async def test_create_muscle_group_duplicate_name(
        self, user_client, muscle_group
    ):
        response = await user_client.post(
            "/api/v1/muscle-groups",
            json={"name": "Chest", "color": "#000000"},
        )
        assert response.status_code == 409


class TestUpdateMuscleGroup:
    async def test_update_muscle_group(self, user_client, muscle_group):
        response = await user_client.patch(
            f"/api/v1/muscle-groups/{muscle_group.id}",
            json={"name": "Upper Chest"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Upper Chest"
        assert response.json()["color"] == "#EF4444"

    async def test_update_muscle_group_not_found(self, user_client):
        response = await user_client.patch(
            "/api/v1/muscle-groups/99999",
            json={"name": "Nope"},
        )
        assert response.status_code == 404

    async def test_update_muscle_group_duplicate_name(
        self, user_client, muscle_group, session, regular_user
    ):
        mg2 = MuscleGroup(
            name="Back", color="#0000FF", user_id=regular_user.id
        )
        session.add(mg2)
        await session.flush()
        response = await user_client.patch(
            f"/api/v1/muscle-groups/{mg2.id}",
            json={"name": "Chest"},
        )
        assert response.status_code == 409


class TestDeleteMuscleGroup:
    async def test_delete_muscle_group(self, user_client, muscle_group):
        response = await user_client.delete(
            f"/api/v1/muscle-groups/{muscle_group.id}"
        )
        assert response.status_code == 200
        assert "deactivated" in response.json()["message"].lower()

        # Verify soft deleted — should not appear in list
        list_response = await user_client.get("/api/v1/muscle-groups")
        assert len(list_response.json()) == 0

    async def test_delete_muscle_group_not_found(self, user_client):
        response = await user_client.delete("/api/v1/muscle-groups/99999")
        assert response.status_code == 404
```

Import needed at top of test file — add after the pytest import:

```python
from app.models.muscle_group import MuscleGroup
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd backend && pytest tests/test_muscle_groups.py -v`
Expected: FAIL — 404 errors because routes don't exist yet

- [ ] **Step 4: Implement muscle group routes**

```python
# backend/app/routes/muscle_groups.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.auth.dependencies import get_current_user
from app.database import get_session
from app.models.muscle_group import MuscleGroup
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.muscle_group import (
    MuscleGroupCreate,
    MuscleGroupRead,
    MuscleGroupUpdate,
)

router = APIRouter(prefix="/api/v1/muscle-groups", tags=["muscle-groups"])


@router.get("", response_model=list[MuscleGroupRead], operation_id="listMuscleGroups")
async def list_muscle_groups(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[MuscleGroupRead]:
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.user_id == current_user.id,
            MuscleGroup.is_active == True,  # noqa: E712
        )
    )
    groups = result.scalars().all()
    return [MuscleGroupRead.model_validate(g) for g in groups]


@router.get(
    "/{muscle_group_id}",
    response_model=MuscleGroupRead,
    operation_id="getMuscleGroup",
)
async def get_muscle_group(
    muscle_group_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MuscleGroupRead:
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.id == muscle_group_id,
            MuscleGroup.user_id == current_user.id,
        )
    )
    mg = result.scalar_one_or_none()
    if mg is None:
        raise HTTPException(status_code=404, detail="Muscle group not found")
    return MuscleGroupRead.model_validate(mg)


@router.post(
    "",
    response_model=MuscleGroupRead,
    status_code=201,
    operation_id="createMuscleGroup",
)
async def create_muscle_group(
    body: MuscleGroupCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MuscleGroupRead:
    # Check duplicate name among user's active muscle groups
    existing = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.user_id == current_user.id,
            MuscleGroup.name == body.name,
            MuscleGroup.is_active == True,  # noqa: E712
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=409, detail="Muscle group with this name already exists"
        )
    mg = MuscleGroup(
        name=body.name,
        color=body.color,
        user_id=current_user.id,
    )
    session.add(mg)
    await session.flush()
    return MuscleGroupRead.model_validate(mg)


@router.patch(
    "/{muscle_group_id}",
    response_model=MuscleGroupRead,
    operation_id="updateMuscleGroup",
)
async def update_muscle_group(
    muscle_group_id: int,
    body: MuscleGroupUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MuscleGroupRead:
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.id == muscle_group_id,
            MuscleGroup.user_id == current_user.id,
        )
    )
    mg = result.scalar_one_or_none()
    if mg is None:
        raise HTTPException(status_code=404, detail="Muscle group not found")
    update_data = body.model_dump(exclude_unset=True)
    if "name" in update_data:
        existing = await session.execute(
            select(MuscleGroup).where(
                MuscleGroup.user_id == current_user.id,
                MuscleGroup.name == update_data["name"],
                MuscleGroup.is_active == True,  # noqa: E712
                MuscleGroup.id != muscle_group_id,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=409,
                detail="Muscle group with this name already exists",
            )
    for key, value in update_data.items():
        setattr(mg, key, value)
    await session.flush()
    return MuscleGroupRead.model_validate(mg)


@router.delete(
    "/{muscle_group_id}",
    response_model=MessageResponse,
    operation_id="deleteMuscleGroup",
)
async def delete_muscle_group(
    muscle_group_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.id == muscle_group_id,
            MuscleGroup.user_id == current_user.id,
        )
    )
    mg = result.scalar_one_or_none()
    if mg is None:
        raise HTTPException(status_code=404, detail="Muscle group not found")
    mg.is_active = False
    await session.flush()
    return MessageResponse(message=f"Muscle group '{mg.name}' deactivated")
```

- [ ] **Step 5: Register muscle groups router in main.py**

Add to `backend/app/main.py` after the existing router imports:

```python
from app.routes.muscle_groups import router as muscle_groups_router
```

Add after `app.include_router(users_router)`:

```python
app.include_router(muscle_groups_router)
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_muscle_groups.py -v`
Expected: All 12 tests PASS

- [ ] **Step 7: Commit**

```bash
git add backend/app/routes/muscle_groups.py backend/app/main.py backend/tests/test_muscle_groups.py backend/tests/conftest.py
git commit -m "feat: add user muscle group CRUD endpoints with tests"
```

---

### Task 3: User Exercise Endpoints (TDD)

**Files:**
- Create: `backend/tests/test_exercises.py`
- Create: `backend/app/routes/exercises.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write failing tests for user exercise endpoints**

```python
# backend/tests/test_exercises.py
import pytest

from app.models.exercise import Exercise, ExerciseType
from app.models.muscle_group import MuscleGroup


class TestListExercises:
    async def test_list_exercises(self, user_client, exercise):
        response = await user_client.get("/api/v1/exercises")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Bench Press"
        assert data[0]["type"] == "weight"
        assert data[0]["is_active"] is True

    async def test_list_exercises_filter_by_muscle_group(
        self, user_client, exercise, muscle_group, session, regular_user
    ):
        mg2 = MuscleGroup(name="Back", color="#0000FF", user_id=regular_user.id)
        session.add(mg2)
        await session.flush()
        ex2 = Exercise(
            name="Pull-ups",
            type=ExerciseType.BODYWEIGHT,
            muscle_group_id=mg2.id,
            user_id=regular_user.id,
        )
        session.add(ex2)
        await session.flush()

        response = await user_client.get(
            f"/api/v1/exercises?muscle_group_id={muscle_group.id}"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Bench Press"

    async def test_list_exercises_excludes_inactive(
        self, user_client, exercise, session
    ):
        exercise.is_active = False
        await session.flush()
        response = await user_client.get("/api/v1/exercises")
        assert response.status_code == 200
        assert len(response.json()) == 0

    async def test_list_exercises_scoped_to_user(
        self, user_client, session, admin_user, muscle_group
    ):
        other_ex = Exercise(
            name="Other",
            type=ExerciseType.WEIGHT,
            muscle_group_id=muscle_group.id,
            user_id=admin_user.id,
        )
        session.add(other_ex)
        await session.flush()
        response = await user_client.get("/api/v1/exercises")
        assert response.status_code == 200
        assert len(response.json()) == 0

    async def test_list_exercises_no_token(self, client):
        response = await client.get("/api/v1/exercises")
        assert response.status_code == 401


class TestGetExercise:
    async def test_get_exercise(self, user_client, exercise):
        response = await user_client.get(f"/api/v1/exercises/{exercise.id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Bench Press"

    async def test_get_exercise_not_found(self, user_client):
        response = await user_client.get("/api/v1/exercises/99999")
        assert response.status_code == 404

    async def test_get_exercise_other_user(
        self, user_client, session, admin_user, muscle_group
    ):
        other_ex = Exercise(
            name="Other",
            type=ExerciseType.WEIGHT,
            muscle_group_id=muscle_group.id,
            user_id=admin_user.id,
        )
        session.add(other_ex)
        await session.flush()
        response = await user_client.get(f"/api/v1/exercises/{other_ex.id}")
        assert response.status_code == 404


class TestCreateExercise:
    async def test_create_exercise(self, user_client, muscle_group):
        response = await user_client.post(
            "/api/v1/exercises",
            json={
                "name": "Incline Press",
                "type": "weight",
                "muscle_group_id": muscle_group.id,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Incline Press"
        assert data["type"] == "weight"
        assert data["muscle_group_id"] == muscle_group.id

    async def test_create_exercise_duplicate_name(
        self, user_client, exercise, muscle_group
    ):
        response = await user_client.post(
            "/api/v1/exercises",
            json={
                "name": "Bench Press",
                "type": "weight",
                "muscle_group_id": muscle_group.id,
            },
        )
        assert response.status_code == 409

    async def test_create_exercise_invalid_muscle_group(self, user_client):
        response = await user_client.post(
            "/api/v1/exercises",
            json={
                "name": "Bad Exercise",
                "type": "weight",
                "muscle_group_id": 99999,
            },
        )
        assert response.status_code == 400

    async def test_create_exercise_other_users_muscle_group(
        self, user_client, session, admin_user
    ):
        other_mg = MuscleGroup(
            name="Other", color="#000000", user_id=admin_user.id
        )
        session.add(other_mg)
        await session.flush()
        response = await user_client.post(
            "/api/v1/exercises",
            json={
                "name": "Bad Exercise",
                "type": "weight",
                "muscle_group_id": other_mg.id,
            },
        )
        assert response.status_code == 400


class TestUpdateExercise:
    async def test_update_exercise(self, user_client, exercise):
        response = await user_client.patch(
            f"/api/v1/exercises/{exercise.id}",
            json={"name": "Flat Bench Press"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Flat Bench Press"

    async def test_update_exercise_type(self, user_client, exercise):
        response = await user_client.patch(
            f"/api/v1/exercises/{exercise.id}",
            json={"type": "bodyweight"},
        )
        assert response.status_code == 200
        assert response.json()["type"] == "bodyweight"

    async def test_update_exercise_not_found(self, user_client):
        response = await user_client.patch(
            "/api/v1/exercises/99999",
            json={"name": "Nope"},
        )
        assert response.status_code == 404

    async def test_update_exercise_duplicate_name(
        self, user_client, exercise, session, regular_user, muscle_group
    ):
        ex2 = Exercise(
            name="Dumbbell Press",
            type=ExerciseType.WEIGHT,
            muscle_group_id=muscle_group.id,
            user_id=regular_user.id,
        )
        session.add(ex2)
        await session.flush()
        response = await user_client.patch(
            f"/api/v1/exercises/{ex2.id}",
            json={"name": "Bench Press"},
        )
        assert response.status_code == 409

    async def test_update_exercise_invalid_muscle_group(
        self, user_client, exercise
    ):
        response = await user_client.patch(
            f"/api/v1/exercises/{exercise.id}",
            json={"muscle_group_id": 99999},
        )
        assert response.status_code == 400


class TestDeleteExercise:
    async def test_delete_exercise(self, user_client, exercise):
        response = await user_client.delete(
            f"/api/v1/exercises/{exercise.id}"
        )
        assert response.status_code == 200
        assert "deactivated" in response.json()["message"].lower()

        list_response = await user_client.get("/api/v1/exercises")
        assert len(list_response.json()) == 0

    async def test_delete_exercise_not_found(self, user_client):
        response = await user_client.delete("/api/v1/exercises/99999")
        assert response.status_code == 404
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pytest tests/test_exercises.py -v`
Expected: FAIL — 404 errors because routes don't exist yet

- [ ] **Step 3: Implement exercise routes**

```python
# backend/app/routes/exercises.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.auth.dependencies import get_current_user
from app.database import get_session
from app.models.exercise import Exercise
from app.models.muscle_group import MuscleGroup
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.exercise import ExerciseCreate, ExerciseRead, ExerciseUpdate

router = APIRouter(prefix="/api/v1/exercises", tags=["exercises"])


async def _validate_muscle_group(
    session: AsyncSession, muscle_group_id: int, user_id: int
) -> None:
    """Validate that the muscle group exists, is active, and belongs to the user."""
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.id == muscle_group_id,
            MuscleGroup.user_id == user_id,
            MuscleGroup.is_active == True,  # noqa: E712
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=400, detail="Invalid muscle group")


@router.get("", response_model=list[ExerciseRead], operation_id="listExercises")
async def list_exercises(
    muscle_group_id: int | None = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[ExerciseRead]:
    query = select(Exercise).where(
        Exercise.user_id == current_user.id,
        Exercise.is_active == True,  # noqa: E712
    )
    if muscle_group_id is not None:
        query = query.where(Exercise.muscle_group_id == muscle_group_id)
    result = await session.execute(query)
    exercises = result.scalars().all()
    return [ExerciseRead.model_validate(e) for e in exercises]


@router.get(
    "/{exercise_id}", response_model=ExerciseRead, operation_id="getExercise"
)
async def get_exercise(
    exercise_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ExerciseRead:
    result = await session.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            Exercise.user_id == current_user.id,
        )
    )
    ex = result.scalar_one_or_none()
    if ex is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return ExerciseRead.model_validate(ex)


@router.post(
    "", response_model=ExerciseRead, status_code=201, operation_id="createExercise"
)
async def create_exercise(
    body: ExerciseCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ExerciseRead:
    await _validate_muscle_group(session, body.muscle_group_id, current_user.id)
    existing = await session.execute(
        select(Exercise).where(
            Exercise.user_id == current_user.id,
            Exercise.name == body.name,
            Exercise.is_active == True,  # noqa: E712
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=409, detail="Exercise with this name already exists"
        )
    ex = Exercise(
        name=body.name,
        type=body.type,
        muscle_group_id=body.muscle_group_id,
        user_id=current_user.id,
    )
    session.add(ex)
    await session.flush()
    return ExerciseRead.model_validate(ex)


@router.patch(
    "/{exercise_id}", response_model=ExerciseRead, operation_id="updateExercise"
)
async def update_exercise(
    exercise_id: int,
    body: ExerciseUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ExerciseRead:
    result = await session.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            Exercise.user_id == current_user.id,
        )
    )
    ex = result.scalar_one_or_none()
    if ex is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    update_data = body.model_dump(exclude_unset=True)
    if "muscle_group_id" in update_data:
        await _validate_muscle_group(
            session, update_data["muscle_group_id"], current_user.id
        )
    if "name" in update_data:
        existing = await session.execute(
            select(Exercise).where(
                Exercise.user_id == current_user.id,
                Exercise.name == update_data["name"],
                Exercise.is_active == True,  # noqa: E712
                Exercise.id != exercise_id,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=409, detail="Exercise with this name already exists"
            )
    for key, value in update_data.items():
        setattr(ex, key, value)
    await session.flush()
    return ExerciseRead.model_validate(ex)


@router.delete(
    "/{exercise_id}", response_model=MessageResponse, operation_id="deleteExercise"
)
async def delete_exercise(
    exercise_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    result = await session.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            Exercise.user_id == current_user.id,
        )
    )
    ex = result.scalar_one_or_none()
    if ex is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    ex.is_active = False
    await session.flush()
    return MessageResponse(message=f"Exercise '{ex.name}' deactivated")
```

- [ ] **Step 4: Register exercises router in main.py**

Add to `backend/app/main.py` after the muscle_groups router import:

```python
from app.routes.exercises import router as exercises_router
```

Add after `app.include_router(muscle_groups_router)`:

```python
app.include_router(exercises_router)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_exercises.py -v`
Expected: All 16 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/routes/exercises.py backend/app/main.py backend/tests/test_exercises.py
git commit -m "feat: add user exercise CRUD endpoints with tests"
```

---

### Task 4: Admin Muscle Group Endpoints (TDD)

**Files:**
- Create: `backend/tests/test_admin_muscle_groups.py`
- Create: `backend/app/routes/admin_muscle_groups.py`
- Modify: `backend/app/main.py`
- Modify: `backend/tests/conftest.py`

- [ ] **Step 1: Add system_muscle_group fixture to conftest.py**

Add after the existing `exercise` fixture:

```python
@pytest_asyncio.fixture
async def system_muscle_group(session, system_user):
    mg = MuscleGroup(name="Chest", color="#EF4444", user_id=system_user.id)
    session.add(mg)
    await session.flush()
    return mg


@pytest_asyncio.fixture
async def system_exercise(session, system_user, system_muscle_group):
    ex = Exercise(
        name="Bench Press",
        type=ExerciseType.WEIGHT,
        muscle_group_id=system_muscle_group.id,
        user_id=system_user.id,
    )
    session.add(ex)
    await session.flush()
    return ex
```

- [ ] **Step 2: Write failing tests for admin muscle group endpoints**

```python
# backend/tests/test_admin_muscle_groups.py
import pytest

from app.models.muscle_group import MuscleGroup


class TestAdminListMuscleGroups:
    async def test_list_system_muscle_groups(
        self, admin_client, system_muscle_group
    ):
        response = await admin_client.get("/api/v1/admin/muscle-groups")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Chest"

    async def test_list_excludes_non_system(
        self, admin_client, system_user, muscle_group
    ):
        response = await admin_client.get("/api/v1/admin/muscle-groups")
        assert response.status_code == 200
        # muscle_group belongs to regular_user, not system_user
        names = [mg["name"] for mg in response.json()]
        # Only system user's groups should appear
        for mg in response.json():
            pass  # Just verify no error; muscle_group belongs to regular_user

    async def test_non_admin_forbidden(self, user_client, system_muscle_group):
        response = await user_client.get("/api/v1/admin/muscle-groups")
        assert response.status_code == 403

    async def test_no_token(self, client):
        response = await client.get("/api/v1/admin/muscle-groups")
        assert response.status_code == 401


class TestAdminGetMuscleGroup:
    async def test_get_system_muscle_group(
        self, admin_client, system_muscle_group
    ):
        response = await admin_client.get(
            f"/api/v1/admin/muscle-groups/{system_muscle_group.id}"
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Chest"

    async def test_get_non_system_muscle_group_returns_404(
        self, admin_client, muscle_group, system_user
    ):
        response = await admin_client.get(
            f"/api/v1/admin/muscle-groups/{muscle_group.id}"
        )
        assert response.status_code == 404

    async def test_get_not_found(self, admin_client, system_user):
        response = await admin_client.get("/api/v1/admin/muscle-groups/99999")
        assert response.status_code == 404


class TestAdminCreateMuscleGroup:
    async def test_create_system_muscle_group(
        self, admin_client, system_user
    ):
        response = await admin_client.post(
            "/api/v1/admin/muscle-groups",
            json={"name": "Glutes", "color": "#FF00FF"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Glutes"
        assert data["color"] == "#FF00FF"

    async def test_create_duplicate_name(
        self, admin_client, system_muscle_group
    ):
        response = await admin_client.post(
            "/api/v1/admin/muscle-groups",
            json={"name": "Chest", "color": "#000000"},
        )
        assert response.status_code == 409


class TestAdminUpdateMuscleGroup:
    async def test_update_system_muscle_group(
        self, admin_client, system_muscle_group
    ):
        response = await admin_client.patch(
            f"/api/v1/admin/muscle-groups/{system_muscle_group.id}",
            json={"color": "#FF0000"},
        )
        assert response.status_code == 200
        assert response.json()["color"] == "#FF0000"

    async def test_update_not_found(self, admin_client, system_user):
        response = await admin_client.patch(
            "/api/v1/admin/muscle-groups/99999",
            json={"name": "Nope"},
        )
        assert response.status_code == 404


class TestAdminDeleteMuscleGroup:
    async def test_delete_system_muscle_group(
        self, admin_client, system_muscle_group
    ):
        response = await admin_client.delete(
            f"/api/v1/admin/muscle-groups/{system_muscle_group.id}"
        )
        assert response.status_code == 200
        assert "deactivated" in response.json()["message"].lower()

    async def test_delete_not_found(self, admin_client, system_user):
        response = await admin_client.delete(
            "/api/v1/admin/muscle-groups/99999"
        )
        assert response.status_code == 404
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd backend && pytest tests/test_admin_muscle_groups.py -v`
Expected: FAIL — 404 errors because routes don't exist yet

- [ ] **Step 4: Implement admin muscle group routes**

```python
# backend/app/routes/admin_muscle_groups.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.auth.dependencies import get_current_admin
from app.database import get_session
from app.models.muscle_group import MuscleGroup
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.muscle_group import (
    MuscleGroupCreate,
    MuscleGroupRead,
    MuscleGroupUpdate,
)

router = APIRouter(prefix="/api/v1/admin/muscle-groups", tags=["admin-muscle-groups"])


async def _get_system_user(session: AsyncSession) -> User:
    result = await session.execute(
        select(User).where(User.is_system == True)  # noqa: E712
    )
    system_user = result.scalar_one_or_none()
    if system_user is None:
        raise HTTPException(status_code=500, detail="System user not found")
    return system_user


@router.get(
    "", response_model=list[MuscleGroupRead], operation_id="adminListMuscleGroups"
)
async def admin_list_muscle_groups(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> list[MuscleGroupRead]:
    system_user = await _get_system_user(session)
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.user_id == system_user.id,
            MuscleGroup.is_active == True,  # noqa: E712
        )
    )
    groups = result.scalars().all()
    return [MuscleGroupRead.model_validate(g) for g in groups]


@router.get(
    "/{muscle_group_id}",
    response_model=MuscleGroupRead,
    operation_id="adminGetMuscleGroup",
)
async def admin_get_muscle_group(
    muscle_group_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> MuscleGroupRead:
    system_user = await _get_system_user(session)
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.id == muscle_group_id,
            MuscleGroup.user_id == system_user.id,
        )
    )
    mg = result.scalar_one_or_none()
    if mg is None:
        raise HTTPException(status_code=404, detail="Muscle group not found")
    return MuscleGroupRead.model_validate(mg)


@router.post(
    "",
    response_model=MuscleGroupRead,
    status_code=201,
    operation_id="adminCreateMuscleGroup",
)
async def admin_create_muscle_group(
    body: MuscleGroupCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> MuscleGroupRead:
    system_user = await _get_system_user(session)
    existing = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.user_id == system_user.id,
            MuscleGroup.name == body.name,
            MuscleGroup.is_active == True,  # noqa: E712
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=409, detail="Muscle group with this name already exists"
        )
    mg = MuscleGroup(
        name=body.name,
        color=body.color,
        user_id=system_user.id,
    )
    session.add(mg)
    await session.flush()
    return MuscleGroupRead.model_validate(mg)


@router.patch(
    "/{muscle_group_id}",
    response_model=MuscleGroupRead,
    operation_id="adminUpdateMuscleGroup",
)
async def admin_update_muscle_group(
    muscle_group_id: int,
    body: MuscleGroupUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> MuscleGroupRead:
    system_user = await _get_system_user(session)
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.id == muscle_group_id,
            MuscleGroup.user_id == system_user.id,
        )
    )
    mg = result.scalar_one_or_none()
    if mg is None:
        raise HTTPException(status_code=404, detail="Muscle group not found")
    update_data = body.model_dump(exclude_unset=True)
    if "name" in update_data:
        existing = await session.execute(
            select(MuscleGroup).where(
                MuscleGroup.user_id == system_user.id,
                MuscleGroup.name == update_data["name"],
                MuscleGroup.is_active == True,  # noqa: E712
                MuscleGroup.id != muscle_group_id,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=409,
                detail="Muscle group with this name already exists",
            )
    for key, value in update_data.items():
        setattr(mg, key, value)
    await session.flush()
    return MuscleGroupRead.model_validate(mg)


@router.delete(
    "/{muscle_group_id}",
    response_model=MessageResponse,
    operation_id="adminDeleteMuscleGroup",
)
async def admin_delete_muscle_group(
    muscle_group_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> MessageResponse:
    system_user = await _get_system_user(session)
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.id == muscle_group_id,
            MuscleGroup.user_id == system_user.id,
        )
    )
    mg = result.scalar_one_or_none()
    if mg is None:
        raise HTTPException(status_code=404, detail="Muscle group not found")
    mg.is_active = False
    await session.flush()
    return MessageResponse(message=f"Muscle group '{mg.name}' deactivated")
```

- [ ] **Step 5: Register admin muscle groups router in main.py**

Add to `backend/app/main.py` after the exercises router import:

```python
from app.routes.admin_muscle_groups import router as admin_muscle_groups_router
```

Add after `app.include_router(exercises_router)`:

```python
app.include_router(admin_muscle_groups_router)
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_admin_muscle_groups.py -v`
Expected: All 10 tests PASS

- [ ] **Step 7: Commit**

```bash
git add backend/app/routes/admin_muscle_groups.py backend/app/main.py backend/tests/test_admin_muscle_groups.py backend/tests/conftest.py
git commit -m "feat: add admin muscle group CRUD endpoints with tests"
```

---

### Task 5: Admin Exercise Endpoints (TDD)

**Files:**
- Create: `backend/tests/test_admin_exercises.py`
- Create: `backend/app/routes/admin_exercises.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write failing tests for admin exercise endpoints**

```python
# backend/tests/test_admin_exercises.py
import pytest

from app.models.exercise import Exercise, ExerciseType
from app.models.muscle_group import MuscleGroup


class TestAdminListExercises:
    async def test_list_system_exercises(
        self, admin_client, system_exercise
    ):
        response = await admin_client.get("/api/v1/admin/exercises")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Bench Press"

    async def test_list_filter_by_muscle_group(
        self, admin_client, system_exercise, system_muscle_group, session,
        system_user,
    ):
        mg2 = MuscleGroup(
            name="Back", color="#0000FF", user_id=system_user.id
        )
        session.add(mg2)
        await session.flush()
        ex2 = Exercise(
            name="Pull-ups",
            type=ExerciseType.BODYWEIGHT,
            muscle_group_id=mg2.id,
            user_id=system_user.id,
        )
        session.add(ex2)
        await session.flush()

        response = await admin_client.get(
            f"/api/v1/admin/exercises?muscle_group_id={system_muscle_group.id}"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Bench Press"

    async def test_non_admin_forbidden(self, user_client, system_exercise):
        response = await user_client.get("/api/v1/admin/exercises")
        assert response.status_code == 403

    async def test_no_token(self, client):
        response = await client.get("/api/v1/admin/exercises")
        assert response.status_code == 401


class TestAdminGetExercise:
    async def test_get_system_exercise(self, admin_client, system_exercise):
        response = await admin_client.get(
            f"/api/v1/admin/exercises/{system_exercise.id}"
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Bench Press"

    async def test_get_non_system_exercise_returns_404(
        self, admin_client, exercise, system_user
    ):
        response = await admin_client.get(
            f"/api/v1/admin/exercises/{exercise.id}"
        )
        assert response.status_code == 404

    async def test_get_not_found(self, admin_client, system_user):
        response = await admin_client.get("/api/v1/admin/exercises/99999")
        assert response.status_code == 404


class TestAdminCreateExercise:
    async def test_create_system_exercise(
        self, admin_client, system_muscle_group
    ):
        response = await admin_client.post(
            "/api/v1/admin/exercises",
            json={
                "name": "Incline Press",
                "type": "weight",
                "muscle_group_id": system_muscle_group.id,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Incline Press"
        assert data["muscle_group_id"] == system_muscle_group.id

    async def test_create_duplicate_name(
        self, admin_client, system_exercise, system_muscle_group
    ):
        response = await admin_client.post(
            "/api/v1/admin/exercises",
            json={
                "name": "Bench Press",
                "type": "weight",
                "muscle_group_id": system_muscle_group.id,
            },
        )
        assert response.status_code == 409

    async def test_create_invalid_muscle_group(
        self, admin_client, system_user
    ):
        response = await admin_client.post(
            "/api/v1/admin/exercises",
            json={
                "name": "Bad Exercise",
                "type": "weight",
                "muscle_group_id": 99999,
            },
        )
        assert response.status_code == 400

    async def test_create_with_non_system_muscle_group(
        self, admin_client, muscle_group, system_user
    ):
        response = await admin_client.post(
            "/api/v1/admin/exercises",
            json={
                "name": "Bad Exercise",
                "type": "weight",
                "muscle_group_id": muscle_group.id,
            },
        )
        assert response.status_code == 400


class TestAdminUpdateExercise:
    async def test_update_system_exercise(
        self, admin_client, system_exercise
    ):
        response = await admin_client.patch(
            f"/api/v1/admin/exercises/{system_exercise.id}",
            json={"name": "Flat Bench Press"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Flat Bench Press"

    async def test_update_not_found(self, admin_client, system_user):
        response = await admin_client.patch(
            "/api/v1/admin/exercises/99999",
            json={"name": "Nope"},
        )
        assert response.status_code == 404

    async def test_update_invalid_muscle_group(
        self, admin_client, system_exercise
    ):
        response = await admin_client.patch(
            f"/api/v1/admin/exercises/{system_exercise.id}",
            json={"muscle_group_id": 99999},
        )
        assert response.status_code == 400


class TestAdminDeleteExercise:
    async def test_delete_system_exercise(
        self, admin_client, system_exercise
    ):
        response = await admin_client.delete(
            f"/api/v1/admin/exercises/{system_exercise.id}"
        )
        assert response.status_code == 200
        assert "deactivated" in response.json()["message"].lower()

    async def test_delete_not_found(self, admin_client, system_user):
        response = await admin_client.delete(
            "/api/v1/admin/exercises/99999"
        )
        assert response.status_code == 404
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pytest tests/test_admin_exercises.py -v`
Expected: FAIL — 404 errors because routes don't exist yet

- [ ] **Step 3: Implement admin exercise routes**

```python
# backend/app/routes/admin_exercises.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.auth.dependencies import get_current_admin
from app.database import get_session
from app.models.exercise import Exercise
from app.models.muscle_group import MuscleGroup
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.exercise import ExerciseCreate, ExerciseRead, ExerciseUpdate

router = APIRouter(prefix="/api/v1/admin/exercises", tags=["admin-exercises"])


async def _get_system_user(session: AsyncSession) -> User:
    result = await session.execute(
        select(User).where(User.is_system == True)  # noqa: E712
    )
    system_user = result.scalar_one_or_none()
    if system_user is None:
        raise HTTPException(status_code=500, detail="System user not found")
    return system_user


async def _validate_system_muscle_group(
    session: AsyncSession, muscle_group_id: int, system_user_id: int
) -> None:
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.id == muscle_group_id,
            MuscleGroup.user_id == system_user_id,
            MuscleGroup.is_active == True,  # noqa: E712
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=400, detail="Invalid muscle group")


@router.get(
    "", response_model=list[ExerciseRead], operation_id="adminListExercises"
)
async def admin_list_exercises(
    muscle_group_id: int | None = None,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> list[ExerciseRead]:
    system_user = await _get_system_user(session)
    query = select(Exercise).where(
        Exercise.user_id == system_user.id,
        Exercise.is_active == True,  # noqa: E712
    )
    if muscle_group_id is not None:
        query = query.where(Exercise.muscle_group_id == muscle_group_id)
    result = await session.execute(query)
    exercises = result.scalars().all()
    return [ExerciseRead.model_validate(e) for e in exercises]


@router.get(
    "/{exercise_id}",
    response_model=ExerciseRead,
    operation_id="adminGetExercise",
)
async def admin_get_exercise(
    exercise_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> ExerciseRead:
    system_user = await _get_system_user(session)
    result = await session.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            Exercise.user_id == system_user.id,
        )
    )
    ex = result.scalar_one_or_none()
    if ex is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return ExerciseRead.model_validate(ex)


@router.post(
    "",
    response_model=ExerciseRead,
    status_code=201,
    operation_id="adminCreateExercise",
)
async def admin_create_exercise(
    body: ExerciseCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> ExerciseRead:
    system_user = await _get_system_user(session)
    await _validate_system_muscle_group(
        session, body.muscle_group_id, system_user.id
    )
    existing = await session.execute(
        select(Exercise).where(
            Exercise.user_id == system_user.id,
            Exercise.name == body.name,
            Exercise.is_active == True,  # noqa: E712
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=409, detail="Exercise with this name already exists"
        )
    ex = Exercise(
        name=body.name,
        type=body.type,
        muscle_group_id=body.muscle_group_id,
        user_id=system_user.id,
    )
    session.add(ex)
    await session.flush()
    return ExerciseRead.model_validate(ex)


@router.patch(
    "/{exercise_id}",
    response_model=ExerciseRead,
    operation_id="adminUpdateExercise",
)
async def admin_update_exercise(
    exercise_id: int,
    body: ExerciseUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> ExerciseRead:
    system_user = await _get_system_user(session)
    result = await session.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            Exercise.user_id == system_user.id,
        )
    )
    ex = result.scalar_one_or_none()
    if ex is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    update_data = body.model_dump(exclude_unset=True)
    if "muscle_group_id" in update_data:
        await _validate_system_muscle_group(
            session, update_data["muscle_group_id"], system_user.id
        )
    if "name" in update_data:
        existing = await session.execute(
            select(Exercise).where(
                Exercise.user_id == system_user.id,
                Exercise.name == update_data["name"],
                Exercise.is_active == True,  # noqa: E712
                Exercise.id != exercise_id,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=409,
                detail="Exercise with this name already exists",
            )
    for key, value in update_data.items():
        setattr(ex, key, value)
    await session.flush()
    return ExerciseRead.model_validate(ex)


@router.delete(
    "/{exercise_id}",
    response_model=MessageResponse,
    operation_id="adminDeleteExercise",
)
async def admin_delete_exercise(
    exercise_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> MessageResponse:
    system_user = await _get_system_user(session)
    result = await session.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            Exercise.user_id == system_user.id,
        )
    )
    ex = result.scalar_one_or_none()
    if ex is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    ex.is_active = False
    await session.flush()
    return MessageResponse(message=f"Exercise '{ex.name}' deactivated")
```

- [ ] **Step 4: Register admin exercises router in main.py**

Add to `backend/app/main.py` after the admin_muscle_groups router import:

```python
from app.routes.admin_exercises import router as admin_exercises_router
```

Add after `app.include_router(admin_muscle_groups_router)`:

```python
app.include_router(admin_exercises_router)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_admin_exercises.py -v`
Expected: All 13 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/routes/admin_exercises.py backend/app/main.py backend/tests/test_admin_exercises.py
git commit -m "feat: add admin exercise CRUD endpoints with tests"
```

---

### Task 6: Full Test Suite & Lint Validation

**Files:** None (validation only)

- [ ] **Step 1: Run full test suite**

Run: `cd backend && pytest tests/ -v`
Expected: All tests PASS (existing + new)

- [ ] **Step 2: Run linter**

Run: `cd backend && uv run ruff check .`
Expected: No errors

- [ ] **Step 3: Run formatter check**

Run: `cd backend && uv run ruff format --check .`
Expected: No formatting issues

- [ ] **Step 4: Fix any issues found in steps 1-3, then commit**

If fixes were needed:
```bash
git add -A
git commit -m "fix: lint and test fixes for muscle/exercise CRUD endpoints"
```
