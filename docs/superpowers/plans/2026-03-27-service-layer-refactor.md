# Service Layer Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract business logic from route handlers into service classes, add input validation and sorting, so services are reusable from routes, MCP, or any future interface.

**Architecture:** One service class per model (MuscleGroupService, ExerciseService) with domain exceptions. Routes become thin HTTP wrappers. `get_system_user` moves to shared dependency. Schema validation added via Field constraints.

**Tech Stack:** FastAPI, SQLModel, SQLAlchemy async, pytest + httpx

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/app/services/__init__.py` | Create | Empty package init |
| `backend/app/services/exceptions.py` | Create | NotFoundError, DuplicateNameError, InvalidReferenceError |
| `backend/app/services/muscle_group.py` | Create | MuscleGroupService (list, get, create, update, delete) |
| `backend/app/services/exercise.py` | Create | ExerciseService (list, get, create, update, delete) |
| `backend/app/auth/dependencies.py` | Modify | Add get_system_user dependency |
| `backend/app/schemas/muscle_group.py` | Modify | Add Field validation constraints |
| `backend/app/schemas/exercise.py` | Modify | Add Field validation constraints |
| `backend/app/routes/muscle_groups.py` | Rewrite | Thin wrapper calling MuscleGroupService |
| `backend/app/routes/exercises.py` | Rewrite | Thin wrapper calling ExerciseService |
| `backend/app/routes/admin_muscle_groups.py` | Rewrite | Thin wrapper calling MuscleGroupService with system_user |
| `backend/app/routes/admin_exercises.py` | Rewrite | Thin wrapper calling ExerciseService with system_user |
| `backend/tests/test_services/__init__.py` | Create | Empty package init |
| `backend/tests/test_services/test_muscle_group_service.py` | Create | Service unit tests |
| `backend/tests/test_services/test_exercise_service.py` | Create | Service unit tests |
| `backend/tests/test_muscle_groups.py` | Modify | Add soft-delete re-create test |
| `backend/tests/test_exercises.py` | Modify | Add soft-delete re-create test |
| `backend/tests/test_admin_muscle_groups.py` | Modify | Add soft-delete re-create test |
| `backend/tests/test_admin_exercises.py` | Modify | Add soft-delete re-create test |

---

### Task 1: Domain Exceptions and Schema Validation

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/exceptions.py`
- Modify: `backend/app/schemas/muscle_group.py`
- Modify: `backend/app/schemas/exercise.py`

- [ ] **Step 1: Create services package and exceptions**

```python
# backend/app/services/__init__.py
```

```python
# backend/app/services/exceptions.py
class NotFoundError(Exception):
    def __init__(self, entity: str):
        self.entity = entity
        super().__init__(f"{entity} not found")


class DuplicateNameError(Exception):
    def __init__(self, entity: str, name: str):
        self.entity = entity
        self.name = name
        super().__init__(f"{entity} with name '{name}' already exists")


class InvalidReferenceError(Exception):
    def __init__(self, entity: str, field: str):
        self.entity = entity
        self.field = field
        super().__init__(f"Invalid {field} for {entity}")
```

- [ ] **Step 2: Add Field validation to MuscleGroup schemas**

Replace the full content of `backend/app/schemas/muscle_group.py`:

```python
from datetime import datetime

from sqlmodel import Field, SQLModel


class MuscleGroupCreate(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    color: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")


class MuscleGroupUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")


class MuscleGroupRead(SQLModel):
    id: int
    name: str
    color: str
    is_active: bool
    created_at: datetime
```

- [ ] **Step 3: Add Field validation to Exercise schemas**

Replace the full content of `backend/app/schemas/exercise.py`:

```python
from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models.exercise import ExerciseType


class ExerciseCreate(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    type: ExerciseType
    muscle_group_id: int


class ExerciseUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
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

- [ ] **Step 4: Commit**

```bash
git add backend/app/services/__init__.py backend/app/services/exceptions.py backend/app/schemas/muscle_group.py backend/app/schemas/exercise.py
git commit -m "feat: add service exceptions and schema field validation"
```

---

### Task 2: MuscleGroupService

**Files:**
- Create: `backend/app/services/muscle_group.py`
- Create: `backend/tests/test_services/__init__.py`
- Create: `backend/tests/test_services/test_muscle_group_service.py`

- [ ] **Step 1: Write service tests**

```python
# backend/tests/test_services/__init__.py
```

```python
# backend/tests/test_services/test_muscle_group_service.py
import pytest

from app.models.muscle_group import MuscleGroup
from app.schemas.muscle_group import MuscleGroupCreate, MuscleGroupUpdate
from app.services.exceptions import DuplicateNameError, NotFoundError
from app.services.muscle_group import MuscleGroupService


class TestMuscleGroupServiceList:
    async def test_list_returns_active_groups(self, session, regular_user, muscle_group):
        svc = MuscleGroupService(session, regular_user.id)
        result = await svc.list()
        assert len(result) == 1
        assert result[0].name == "Chest"

    async def test_list_excludes_inactive(self, session, regular_user, muscle_group):
        muscle_group.is_active = False
        await session.flush()
        svc = MuscleGroupService(session, regular_user.id)
        result = await svc.list()
        assert len(result) == 0

    async def test_list_scoped_to_user(self, session, regular_user, admin_user):
        mg = MuscleGroup(name="Other", color="#000000", user_id=admin_user.id)
        session.add(mg)
        await session.flush()
        svc = MuscleGroupService(session, regular_user.id)
        result = await svc.list()
        assert len(result) == 0

    async def test_list_sorted_by_name(self, session, regular_user):
        session.add(MuscleGroup(name="Zzz", color="#000000", user_id=regular_user.id))
        session.add(MuscleGroup(name="Aaa", color="#111111", user_id=regular_user.id))
        await session.flush()
        svc = MuscleGroupService(session, regular_user.id)
        result = await svc.list()
        assert [r.name for r in result] == ["Aaa", "Zzz"]


class TestMuscleGroupServiceGet:
    async def test_get_returns_group(self, session, regular_user, muscle_group):
        svc = MuscleGroupService(session, regular_user.id)
        result = await svc.get(muscle_group.id)
        assert result.name == "Chest"

    async def test_get_not_found(self, session, regular_user):
        svc = MuscleGroupService(session, regular_user.id)
        with pytest.raises(NotFoundError):
            await svc.get(99999)

    async def test_get_other_user(self, session, regular_user, admin_user):
        mg = MuscleGroup(name="Other", color="#000000", user_id=admin_user.id)
        session.add(mg)
        await session.flush()
        svc = MuscleGroupService(session, regular_user.id)
        with pytest.raises(NotFoundError):
            await svc.get(mg.id)


class TestMuscleGroupServiceCreate:
    async def test_create(self, session, regular_user):
        svc = MuscleGroupService(session, regular_user.id)
        mg = await svc.create(MuscleGroupCreate(name="Arms", color="#FF0000"))
        assert mg.name == "Arms"
        assert mg.color == "#FF0000"
        assert mg.user_id == regular_user.id

    async def test_create_duplicate_name(self, session, regular_user, muscle_group):
        svc = MuscleGroupService(session, regular_user.id)
        with pytest.raises(DuplicateNameError):
            await svc.create(MuscleGroupCreate(name="Chest", color="#000000"))

    async def test_create_reuse_deleted_name(self, session, regular_user, muscle_group):
        muscle_group.is_active = False
        await session.flush()
        svc = MuscleGroupService(session, regular_user.id)
        mg = await svc.create(MuscleGroupCreate(name="Chest", color="#00FF00"))
        assert mg.name == "Chest"


class TestMuscleGroupServiceUpdate:
    async def test_update(self, session, regular_user, muscle_group):
        svc = MuscleGroupService(session, regular_user.id)
        mg = await svc.update(muscle_group.id, MuscleGroupUpdate(name="Upper Chest"))
        assert mg.name == "Upper Chest"
        assert mg.color == "#EF4444"

    async def test_update_not_found(self, session, regular_user):
        svc = MuscleGroupService(session, regular_user.id)
        with pytest.raises(NotFoundError):
            await svc.update(99999, MuscleGroupUpdate(name="Nope"))

    async def test_update_duplicate_name(self, session, regular_user, muscle_group):
        mg2 = MuscleGroup(name="Back", color="#0000FF", user_id=regular_user.id)
        session.add(mg2)
        await session.flush()
        svc = MuscleGroupService(session, regular_user.id)
        with pytest.raises(DuplicateNameError):
            await svc.update(mg2.id, MuscleGroupUpdate(name="Chest"))


class TestMuscleGroupServiceDelete:
    async def test_delete(self, session, regular_user, muscle_group):
        svc = MuscleGroupService(session, regular_user.id)
        mg = await svc.delete(muscle_group.id)
        assert mg.is_active is False

    async def test_delete_not_found(self, session, regular_user):
        svc = MuscleGroupService(session, regular_user.id)
        with pytest.raises(NotFoundError):
            await svc.delete(99999)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_services/test_muscle_group_service.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.services.muscle_group'`

- [ ] **Step 3: Implement MuscleGroupService**

```python
# backend/app/services/muscle_group.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.muscle_group import MuscleGroup
from app.schemas.muscle_group import MuscleGroupCreate, MuscleGroupUpdate
from app.services.exceptions import DuplicateNameError, NotFoundError


class MuscleGroupService:
    def __init__(self, session: AsyncSession, user_id: int):
        self.session = session
        self.user_id = user_id

    async def list(self) -> list[MuscleGroup]:
        result = await self.session.execute(
            select(MuscleGroup)
            .where(
                MuscleGroup.user_id == self.user_id,
                MuscleGroup.is_active == True,  # noqa: E712
            )
            .order_by(MuscleGroup.name)
        )
        return list(result.scalars().all())

    async def get(self, muscle_group_id: int) -> MuscleGroup:
        result = await self.session.execute(
            select(MuscleGroup).where(
                MuscleGroup.id == muscle_group_id,
                MuscleGroup.user_id == self.user_id,
                MuscleGroup.is_active == True,  # noqa: E712
            )
        )
        mg = result.scalar_one_or_none()
        if mg is None:
            raise NotFoundError("Muscle group")
        return mg

    async def create(self, data: MuscleGroupCreate) -> MuscleGroup:
        await self._check_duplicate_name(data.name)
        mg = MuscleGroup(
            name=data.name,
            color=data.color,
            user_id=self.user_id,
        )
        self.session.add(mg)
        await self.session.flush()
        return mg

    async def update(
        self, muscle_group_id: int, data: MuscleGroupUpdate
    ) -> MuscleGroup:
        mg = await self.get(muscle_group_id)
        update_data = data.model_dump(exclude_unset=True)
        if "name" in update_data:
            await self._check_duplicate_name(
                update_data["name"], exclude_id=muscle_group_id
            )
        for key, value in update_data.items():
            setattr(mg, key, value)
        await self.session.flush()
        return mg

    async def delete(self, muscle_group_id: int) -> MuscleGroup:
        mg = await self.get(muscle_group_id)
        mg.is_active = False
        await self.session.flush()
        return mg

    async def _check_duplicate_name(
        self, name: str, *, exclude_id: int | None = None
    ) -> None:
        query = select(MuscleGroup).where(
            MuscleGroup.user_id == self.user_id,
            MuscleGroup.name == name,
            MuscleGroup.is_active == True,  # noqa: E712
        )
        if exclude_id is not None:
            query = query.where(MuscleGroup.id != exclude_id)
        result = await self.session.execute(query)
        if result.scalar_one_or_none() is not None:
            raise DuplicateNameError("Muscle group", name)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_services/test_muscle_group_service.py -v`
Expected: All 12 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/muscle_group.py backend/tests/test_services/__init__.py backend/tests/test_services/test_muscle_group_service.py
git commit -m "feat: add MuscleGroupService with tests"
```

---

### Task 3: ExerciseService

**Files:**
- Create: `backend/app/services/exercise.py`
- Create: `backend/tests/test_services/test_exercise_service.py`

- [ ] **Step 1: Write service tests**

```python
# backend/tests/test_services/test_exercise_service.py
import pytest

from app.models.exercise import Exercise, ExerciseType
from app.models.muscle_group import MuscleGroup
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate
from app.services.exceptions import (
    DuplicateNameError,
    InvalidReferenceError,
    NotFoundError,
)
from app.services.exercise import ExerciseService


class TestExerciseServiceList:
    async def test_list_returns_active_exercises(self, session, regular_user, exercise):
        svc = ExerciseService(session, regular_user.id)
        result = await svc.list()
        assert len(result) == 1
        assert result[0].name == "Bench Press"

    async def test_list_filter_by_muscle_group(
        self, session, regular_user, exercise, muscle_group
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
        svc = ExerciseService(session, regular_user.id)
        result = await svc.list(muscle_group_id=muscle_group.id)
        assert len(result) == 1
        assert result[0].name == "Bench Press"

    async def test_list_sorted_by_name(self, session, regular_user, muscle_group):
        session.add(
            Exercise(
                name="Zzz",
                type=ExerciseType.WEIGHT,
                muscle_group_id=muscle_group.id,
                user_id=regular_user.id,
            )
        )
        session.add(
            Exercise(
                name="Aaa",
                type=ExerciseType.WEIGHT,
                muscle_group_id=muscle_group.id,
                user_id=regular_user.id,
            )
        )
        await session.flush()
        svc = ExerciseService(session, regular_user.id)
        result = await svc.list()
        assert [r.name for r in result] == ["Aaa", "Zzz"]


class TestExerciseServiceGet:
    async def test_get_returns_exercise(self, session, regular_user, exercise):
        svc = ExerciseService(session, regular_user.id)
        result = await svc.get(exercise.id)
        assert result.name == "Bench Press"

    async def test_get_not_found(self, session, regular_user):
        svc = ExerciseService(session, regular_user.id)
        with pytest.raises(NotFoundError):
            await svc.get(99999)


class TestExerciseServiceCreate:
    async def test_create(self, session, regular_user, muscle_group):
        svc = ExerciseService(session, regular_user.id)
        ex = await svc.create(
            ExerciseCreate(name="Incline Press", type=ExerciseType.WEIGHT, muscle_group_id=muscle_group.id)
        )
        assert ex.name == "Incline Press"
        assert ex.user_id == regular_user.id

    async def test_create_duplicate_name(self, session, regular_user, exercise, muscle_group):
        svc = ExerciseService(session, regular_user.id)
        with pytest.raises(DuplicateNameError):
            await svc.create(
                ExerciseCreate(name="Bench Press", type=ExerciseType.WEIGHT, muscle_group_id=muscle_group.id)
            )

    async def test_create_invalid_muscle_group(self, session, regular_user):
        svc = ExerciseService(session, regular_user.id)
        with pytest.raises(InvalidReferenceError):
            await svc.create(
                ExerciseCreate(name="Bad", type=ExerciseType.WEIGHT, muscle_group_id=99999)
            )

    async def test_create_other_users_muscle_group(self, session, regular_user, admin_user):
        mg = MuscleGroup(name="Other", color="#000000", user_id=admin_user.id)
        session.add(mg)
        await session.flush()
        svc = ExerciseService(session, regular_user.id)
        with pytest.raises(InvalidReferenceError):
            await svc.create(
                ExerciseCreate(name="Bad", type=ExerciseType.WEIGHT, muscle_group_id=mg.id)
            )

    async def test_create_reuse_deleted_name(self, session, regular_user, exercise, muscle_group):
        exercise.is_active = False
        await session.flush()
        svc = ExerciseService(session, regular_user.id)
        ex = await svc.create(
            ExerciseCreate(name="Bench Press", type=ExerciseType.WEIGHT, muscle_group_id=muscle_group.id)
        )
        assert ex.name == "Bench Press"


class TestExerciseServiceUpdate:
    async def test_update(self, session, regular_user, exercise):
        svc = ExerciseService(session, regular_user.id)
        ex = await svc.update(exercise.id, ExerciseUpdate(name="Flat Bench Press"))
        assert ex.name == "Flat Bench Press"

    async def test_update_not_found(self, session, regular_user):
        svc = ExerciseService(session, regular_user.id)
        with pytest.raises(NotFoundError):
            await svc.update(99999, ExerciseUpdate(name="Nope"))

    async def test_update_invalid_muscle_group(self, session, regular_user, exercise):
        svc = ExerciseService(session, regular_user.id)
        with pytest.raises(InvalidReferenceError):
            await svc.update(exercise.id, ExerciseUpdate(muscle_group_id=99999))


class TestExerciseServiceDelete:
    async def test_delete(self, session, regular_user, exercise):
        svc = ExerciseService(session, regular_user.id)
        ex = await svc.delete(exercise.id)
        assert ex.is_active is False

    async def test_delete_not_found(self, session, regular_user):
        svc = ExerciseService(session, regular_user.id)
        with pytest.raises(NotFoundError):
            await svc.delete(99999)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_services/test_exercise_service.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.services.exercise'`

- [ ] **Step 3: Implement ExerciseService**

```python
# backend/app/services/exercise.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.exercise import Exercise
from app.models.muscle_group import MuscleGroup
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate
from app.services.exceptions import (
    DuplicateNameError,
    InvalidReferenceError,
    NotFoundError,
)


class ExerciseService:
    def __init__(self, session: AsyncSession, user_id: int):
        self.session = session
        self.user_id = user_id

    async def list(self, muscle_group_id: int | None = None) -> list[Exercise]:
        query = (
            select(Exercise)
            .where(
                Exercise.user_id == self.user_id,
                Exercise.is_active == True,  # noqa: E712
            )
            .order_by(Exercise.name)
        )
        if muscle_group_id is not None:
            query = query.where(Exercise.muscle_group_id == muscle_group_id)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get(self, exercise_id: int) -> Exercise:
        result = await self.session.execute(
            select(Exercise).where(
                Exercise.id == exercise_id,
                Exercise.user_id == self.user_id,
                Exercise.is_active == True,  # noqa: E712
            )
        )
        ex = result.scalar_one_or_none()
        if ex is None:
            raise NotFoundError("Exercise")
        return ex

    async def create(self, data: ExerciseCreate) -> Exercise:
        await self._validate_muscle_group(data.muscle_group_id)
        await self._check_duplicate_name(data.name)
        ex = Exercise(
            name=data.name,
            type=data.type,
            muscle_group_id=data.muscle_group_id,
            user_id=self.user_id,
        )
        self.session.add(ex)
        await self.session.flush()
        return ex

    async def update(self, exercise_id: int, data: ExerciseUpdate) -> Exercise:
        ex = await self.get(exercise_id)
        update_data = data.model_dump(exclude_unset=True)
        if "muscle_group_id" in update_data:
            await self._validate_muscle_group(update_data["muscle_group_id"])
        if "name" in update_data:
            await self._check_duplicate_name(
                update_data["name"], exclude_id=exercise_id
            )
        for key, value in update_data.items():
            setattr(ex, key, value)
        await self.session.flush()
        return ex

    async def delete(self, exercise_id: int) -> Exercise:
        ex = await self.get(exercise_id)
        ex.is_active = False
        await self.session.flush()
        return ex

    async def _validate_muscle_group(self, muscle_group_id: int) -> None:
        result = await self.session.execute(
            select(MuscleGroup).where(
                MuscleGroup.id == muscle_group_id,
                MuscleGroup.user_id == self.user_id,
                MuscleGroup.is_active == True,  # noqa: E712
            )
        )
        if result.scalar_one_or_none() is None:
            raise InvalidReferenceError("Exercise", "muscle_group_id")

    async def _check_duplicate_name(
        self, name: str, *, exclude_id: int | None = None
    ) -> None:
        query = select(Exercise).where(
            Exercise.user_id == self.user_id,
            Exercise.name == name,
            Exercise.is_active == True,  # noqa: E712
        )
        if exclude_id is not None:
            query = query.where(Exercise.id != exclude_id)
        result = await self.session.execute(query)
        if result.scalar_one_or_none() is not None:
            raise DuplicateNameError("Exercise", name)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_services/test_exercise_service.py -v`
Expected: All 13 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/exercise.py backend/tests/test_services/test_exercise_service.py
git commit -m "feat: add ExerciseService with tests"
```

---

### Task 4: Add get_system_user Dependency

**Files:**
- Modify: `backend/app/auth/dependencies.py`

- [ ] **Step 1: Add get_system_user to dependencies**

Add at the end of `backend/app/auth/dependencies.py`:

```python
from sqlmodel import select


async def get_system_user(
    session: AsyncSession = Depends(get_session),
) -> User:
    result = await session.execute(
        select(User).where(User.is_system == True)  # noqa: E712
    )
    system_user = result.scalar_one_or_none()
    if system_user is None:
        raise HTTPException(status_code=500, detail="System user not found")
    return system_user
```

Note: `select` import must be added at the top. The existing imports already include `HTTPException`, `Depends`, `AsyncSession`, `get_session`, and `User`.

- [ ] **Step 2: Commit**

```bash
git add backend/app/auth/dependencies.py
git commit -m "feat: add get_system_user shared dependency"
```

---

### Task 5: Refactor Route Files to Use Services

**Files:**
- Rewrite: `backend/app/routes/muscle_groups.py`
- Rewrite: `backend/app/routes/exercises.py`
- Rewrite: `backend/app/routes/admin_muscle_groups.py`
- Rewrite: `backend/app/routes/admin_exercises.py`

- [ ] **Step 1: Rewrite user muscle groups routes**

Replace entire content of `backend/app/routes/muscle_groups.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_session
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.muscle_group import (
    MuscleGroupCreate,
    MuscleGroupRead,
    MuscleGroupUpdate,
)
from app.services.exceptions import DuplicateNameError, NotFoundError
from app.services.muscle_group import MuscleGroupService

router = APIRouter(prefix="/api/v1/muscle-groups", tags=["muscle-groups"])


@router.get("", response_model=list[MuscleGroupRead], operation_id="listMuscleGroups")
async def list_muscle_groups(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[MuscleGroupRead]:
    svc = MuscleGroupService(session, current_user.id)
    groups = await svc.list()
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
    svc = MuscleGroupService(session, current_user.id)
    try:
        mg = await svc.get(muscle_group_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
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
    svc = MuscleGroupService(session, current_user.id)
    try:
        mg = await svc.create(body)
    except DuplicateNameError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
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
    svc = MuscleGroupService(session, current_user.id)
    try:
        mg = await svc.update(muscle_group_id, body)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except DuplicateNameError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
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
    svc = MuscleGroupService(session, current_user.id)
    try:
        mg = await svc.delete(muscle_group_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return MessageResponse(message=f"Muscle group '{mg.name}' deactivated")
```

- [ ] **Step 2: Rewrite user exercises routes**

Replace entire content of `backend/app/routes/exercises.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_session
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.exercise import ExerciseCreate, ExerciseRead, ExerciseUpdate
from app.services.exceptions import (
    DuplicateNameError,
    InvalidReferenceError,
    NotFoundError,
)
from app.services.exercise import ExerciseService

router = APIRouter(prefix="/api/v1/exercises", tags=["exercises"])


@router.get("", response_model=list[ExerciseRead], operation_id="listExercises")
async def list_exercises(
    muscle_group_id: int | None = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[ExerciseRead]:
    svc = ExerciseService(session, current_user.id)
    exercises = await svc.list(muscle_group_id=muscle_group_id)
    return [ExerciseRead.model_validate(e) for e in exercises]


@router.get("/{exercise_id}", response_model=ExerciseRead, operation_id="getExercise")
async def get_exercise(
    exercise_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ExerciseRead:
    svc = ExerciseService(session, current_user.id)
    try:
        ex = await svc.get(exercise_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ExerciseRead.model_validate(ex)


@router.post(
    "", response_model=ExerciseRead, status_code=201, operation_id="createExercise"
)
async def create_exercise(
    body: ExerciseCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ExerciseRead:
    svc = ExerciseService(session, current_user.id)
    try:
        ex = await svc.create(body)
    except InvalidReferenceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except DuplicateNameError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
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
    svc = ExerciseService(session, current_user.id)
    try:
        ex = await svc.update(exercise_id, body)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidReferenceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except DuplicateNameError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return ExerciseRead.model_validate(ex)


@router.delete(
    "/{exercise_id}", response_model=MessageResponse, operation_id="deleteExercise"
)
async def delete_exercise(
    exercise_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    svc = ExerciseService(session, current_user.id)
    try:
        ex = await svc.delete(exercise_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return MessageResponse(message=f"Exercise '{ex.name}' deactivated")
```

- [ ] **Step 3: Rewrite admin muscle groups routes**

Replace entire content of `backend/app/routes/admin_muscle_groups.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_admin, get_system_user
from app.database import get_session
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.muscle_group import (
    MuscleGroupCreate,
    MuscleGroupRead,
    MuscleGroupUpdate,
)
from app.services.exceptions import DuplicateNameError, NotFoundError
from app.services.muscle_group import MuscleGroupService

router = APIRouter(prefix="/api/v1/admin/muscle-groups", tags=["admin-muscle-groups"])


@router.get(
    "", response_model=list[MuscleGroupRead], operation_id="adminListMuscleGroups"
)
async def admin_list_muscle_groups(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
    system_user: User = Depends(get_system_user),
) -> list[MuscleGroupRead]:
    svc = MuscleGroupService(session, system_user.id)
    groups = await svc.list()
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
    system_user: User = Depends(get_system_user),
) -> MuscleGroupRead:
    svc = MuscleGroupService(session, system_user.id)
    try:
        mg = await svc.get(muscle_group_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
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
    system_user: User = Depends(get_system_user),
) -> MuscleGroupRead:
    svc = MuscleGroupService(session, system_user.id)
    try:
        mg = await svc.create(body)
    except DuplicateNameError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
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
    system_user: User = Depends(get_system_user),
) -> MuscleGroupRead:
    svc = MuscleGroupService(session, system_user.id)
    try:
        mg = await svc.update(muscle_group_id, body)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except DuplicateNameError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
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
    system_user: User = Depends(get_system_user),
) -> MessageResponse:
    svc = MuscleGroupService(session, system_user.id)
    try:
        mg = await svc.delete(muscle_group_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return MessageResponse(message=f"Muscle group '{mg.name}' deactivated")
```

- [ ] **Step 4: Rewrite admin exercises routes**

Replace entire content of `backend/app/routes/admin_exercises.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_admin, get_system_user
from app.database import get_session
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.exercise import ExerciseCreate, ExerciseRead, ExerciseUpdate
from app.services.exceptions import (
    DuplicateNameError,
    InvalidReferenceError,
    NotFoundError,
)
from app.services.exercise import ExerciseService

router = APIRouter(prefix="/api/v1/admin/exercises", tags=["admin-exercises"])


@router.get("", response_model=list[ExerciseRead], operation_id="adminListExercises")
async def admin_list_exercises(
    muscle_group_id: int | None = None,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
    system_user: User = Depends(get_system_user),
) -> list[ExerciseRead]:
    svc = ExerciseService(session, system_user.id)
    exercises = await svc.list(muscle_group_id=muscle_group_id)
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
    system_user: User = Depends(get_system_user),
) -> ExerciseRead:
    svc = ExerciseService(session, system_user.id)
    try:
        ex = await svc.get(exercise_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
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
    system_user: User = Depends(get_system_user),
) -> ExerciseRead:
    svc = ExerciseService(session, system_user.id)
    try:
        ex = await svc.create(body)
    except InvalidReferenceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except DuplicateNameError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
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
    system_user: User = Depends(get_system_user),
) -> ExerciseRead:
    svc = ExerciseService(session, system_user.id)
    try:
        ex = await svc.update(exercise_id, body)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidReferenceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except DuplicateNameError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
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
    system_user: User = Depends(get_system_user),
) -> MessageResponse:
    svc = ExerciseService(session, system_user.id)
    try:
        ex = await svc.delete(exercise_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return MessageResponse(message=f"Exercise '{ex.name}' deactivated")
```

- [ ] **Step 5: Run all existing route tests**

Run: `cd backend && uv run pytest tests/test_muscle_groups.py tests/test_exercises.py tests/test_admin_muscle_groups.py tests/test_admin_exercises.py -v`
Expected: All existing tests PASS (behavior unchanged)

- [ ] **Step 6: Commit**

```bash
git add backend/app/routes/muscle_groups.py backend/app/routes/exercises.py backend/app/routes/admin_muscle_groups.py backend/app/routes/admin_exercises.py
git commit -m "refactor: route handlers to use service layer"
```

---

### Task 6: Add Soft-Delete Re-Create Tests

**Files:**
- Modify: `backend/tests/test_muscle_groups.py`
- Modify: `backend/tests/test_exercises.py`
- Modify: `backend/tests/test_admin_muscle_groups.py`
- Modify: `backend/tests/test_admin_exercises.py`

- [ ] **Step 1: Add test to test_muscle_groups.py**

Add at the end of `TestCreateMuscleGroup` class in `backend/tests/test_muscle_groups.py`:

```python
    async def test_create_muscle_group_reuse_deleted_name(
        self, user_client, muscle_group
    ):
        await user_client.delete(f"/api/v1/muscle-groups/{muscle_group.id}")
        response = await user_client.post(
            "/api/v1/muscle-groups",
            json={"name": "Chest", "color": "#00FF00"},
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Chest"
```

- [ ] **Step 2: Add test to test_exercises.py**

Add at the end of `TestCreateExercise` class in `backend/tests/test_exercises.py`:

```python
    async def test_create_exercise_reuse_deleted_name(
        self, user_client, exercise, muscle_group
    ):
        await user_client.delete(f"/api/v1/exercises/{exercise.id}")
        response = await user_client.post(
            "/api/v1/exercises",
            json={
                "name": "Bench Press",
                "type": "weight",
                "muscle_group_id": muscle_group.id,
            },
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Bench Press"
```

- [ ] **Step 3: Add test to test_admin_muscle_groups.py**

Add at the end of `TestAdminCreateMuscleGroup` class in `backend/tests/test_admin_muscle_groups.py`:

```python
    async def test_create_reuse_deleted_name(
        self, admin_client, system_muscle_group
    ):
        await admin_client.delete(
            f"/api/v1/admin/muscle-groups/{system_muscle_group.id}"
        )
        response = await admin_client.post(
            "/api/v1/admin/muscle-groups",
            json={"name": "Chest", "color": "#00FF00"},
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Chest"
```

- [ ] **Step 4: Add test to test_admin_exercises.py**

Add at the end of `TestAdminCreateExercise` class in `backend/tests/test_admin_exercises.py`:

```python
    async def test_create_reuse_deleted_name(
        self, admin_client, system_exercise, system_muscle_group
    ):
        await admin_client.delete(
            f"/api/v1/admin/exercises/{system_exercise.id}"
        )
        response = await admin_client.post(
            "/api/v1/admin/exercises",
            json={
                "name": "Bench Press",
                "type": "weight",
                "muscle_group_id": system_muscle_group.id,
            },
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Bench Press"
```

- [ ] **Step 5: Run all tests**

Run: `cd backend && uv run pytest tests/ -v`
Expected: All tests PASS

- [ ] **Step 6: Run lint and format**

Run: `cd backend && uv run ruff check . && uv run ruff format --check .`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add backend/tests/test_muscle_groups.py backend/tests/test_exercises.py backend/tests/test_admin_muscle_groups.py backend/tests/test_admin_exercises.py
git commit -m "test: add soft-delete name reuse tests"
```
