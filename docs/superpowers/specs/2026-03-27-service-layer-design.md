# Service Layer Refactor Design

## Overview

Extract business logic from route handlers into service classes. Routes become thin HTTP wrappers. Services are reusable from routes, MCP, or any future interface.

Scope: muscle groups and exercises only. Users routes stay as-is for now.

## Architecture

### Service Classes

```
backend/app/services/
├── exceptions.py      # Domain exceptions (NotFoundError, DuplicateNameError, InvalidReferenceError)
├── muscle_group.py    # MuscleGroupService
└── exercise.py        # ExerciseService
```

Each service takes `session: AsyncSession` and `user_id: int`. Services don't know about HTTP, auth, or FastAPI.

### Service Interface

```python
class MuscleGroupService:
    def __init__(self, session: AsyncSession, user_id: int): ...

    async def list(self) -> list[MuscleGroup]: ...
    async def get(self, muscle_group_id: int) -> MuscleGroup: ...
    async def create(self, data: MuscleGroupCreate) -> MuscleGroup: ...
    async def update(self, muscle_group_id: int, data: MuscleGroupUpdate) -> MuscleGroup: ...
    async def delete(self, muscle_group_id: int) -> MuscleGroup: ...
```

```python
class ExerciseService:
    def __init__(self, session: AsyncSession, user_id: int): ...

    async def list(self, muscle_group_id: int | None = None) -> list[Exercise]: ...
    async def get(self, exercise_id: int) -> Exercise: ...
    async def create(self, data: ExerciseCreate) -> Exercise: ...
    async def update(self, exercise_id: int, data: ExerciseUpdate) -> Exercise: ...
    async def delete(self, exercise_id: int) -> Exercise: ...
```

### Domain Exceptions

```python
# backend/app/services/exceptions.py
class NotFoundError(Exception):
    def __init__(self, entity: str): ...

class DuplicateNameError(Exception):
    def __init__(self, entity: str, name: str): ...

class InvalidReferenceError(Exception):
    def __init__(self, entity: str, field: str): ...
```

### Exception-to-HTTP Mapping

| Service Exception | HTTP Status | When |
|---|---|---|
| `NotFoundError` | 404 | Record not found or not owned |
| `DuplicateNameError` | 409 | Name already exists for user |
| `InvalidReferenceError` | 400 | Invalid `muscle_group_id` |

Routes handle this with try/except in each endpoint. No shared middleware (only 4 route files).

### Shared Dependency

`_get_system_user` moves from route files to `app/auth/dependencies.py` as `get_system_user` FastAPI dependency, used by all admin routes.

## Route Pattern After Refactor

Routes become thin wrappers:

```python
@router.post("", response_model=MuscleGroupRead, status_code=201, operation_id="createMuscleGroup")
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
```

Admin routes call the same service with `system_user.id`:

```python
@router.post("", response_model=MuscleGroupRead, status_code=201, operation_id="adminCreateMuscleGroup")
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
```

## Review Fixes (Included)

### Input Validation

Schemas gain field constraints:

```python
# MuscleGroupCreate / MuscleGroupUpdate
name: str = Field(min_length=1, max_length=100)
color: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")

# ExerciseCreate / ExerciseUpdate
name: str = Field(min_length=1, max_length=100)
```

Update schemas keep fields optional but apply the same constraints when a value is provided.

### Default Sorting

All list methods sort alphabetically:

- Muscle groups: `.order_by(MuscleGroup.name)`
- Exercises: `.order_by(Exercise.name)`

### Soft-Delete Re-Create Test

New test in each test file: create → delete → create same name → succeeds (200/201). Validates that name uniqueness is scoped to `is_active = True`.

## Testing Strategy

- **Service tests** (`tests/test_services/`): Test business logic directly against the DB. No HTTP layer.
- **Route tests** (existing `tests/test_*.py`): Keep existing tests. They now also verify HTTP-level concerns (status codes, response models, auth).
- Both test layers use the same conftest fixtures.

## Files Changed

| File | Action |
|------|--------|
| `backend/app/services/__init__.py` | Create (empty) |
| `backend/app/services/exceptions.py` | Create |
| `backend/app/services/muscle_group.py` | Create |
| `backend/app/services/exercise.py` | Create |
| `backend/app/auth/dependencies.py` | Modify (add `get_system_user`) |
| `backend/app/routes/muscle_groups.py` | Refactor (thin wrapper) |
| `backend/app/routes/exercises.py` | Refactor (thin wrapper) |
| `backend/app/routes/admin_muscle_groups.py` | Refactor (thin wrapper, use `get_system_user` dep) |
| `backend/app/routes/admin_exercises.py` | Refactor (thin wrapper, use `get_system_user` dep) |
| `backend/app/schemas/muscle_group.py` | Modify (add Field validation) |
| `backend/app/schemas/exercise.py` | Modify (add Field validation) |
| `backend/tests/test_services/conftest.py` | Create (service test fixtures) |
| `backend/tests/test_services/test_muscle_group_service.py` | Create |
| `backend/tests/test_services/test_exercise_service.py` | Create |
| `backend/tests/test_muscle_groups.py` | Modify (add soft-delete re-create test) |
| `backend/tests/test_exercises.py` | Modify (add soft-delete re-create test) |
| `backend/tests/test_admin_muscle_groups.py` | Modify (add soft-delete re-create test) |
| `backend/tests/test_admin_exercises.py` | Modify (add soft-delete re-create test) |
