# Muscle Group & Exercise CRUD Endpoints Design

## Overview

CRUD endpoints for muscle groups and exercises, serving two audiences:
- **Regular users** manage their own personal library (custom muscle groups and exercises)
- **Admins** manage system defaults (seeded to new users on creation)

Admin changes only affect new users going forward — no propagation to existing users.

## Decisions

- Flat resource endpoints with query param filters (not nested routes)
- Soft delete only (`is_active = false`) — preserves workout history references
- User endpoints scope all queries by `current_user.id`
- Admin endpoints scope all queries by the system user's `user_id`
- All endpoints declare `response_model` and typed request schemas for safety and Orval codegen
- Return 404 (not 403) for records owned by other users to avoid leaking existence

## Schemas

### MuscleGroup Schemas (`backend/app/schemas/muscle_group.py`)

```python
class MuscleGroupCreate(BaseModel):
    name: str
    color: str

class MuscleGroupUpdate(BaseModel):
    name: str | None = None
    color: str | None = None

class MuscleGroupRead(BaseModel):
    id: int
    name: str
    color: str
    is_active: bool
    created_at: datetime
```

### Exercise Schemas (`backend/app/schemas/exercise.py`)

```python
class ExerciseCreate(BaseModel):
    name: str
    type: ExerciseType
    muscle_group_id: int

class ExerciseUpdate(BaseModel):
    name: str | None = None
    type: ExerciseType | None = None
    muscle_group_id: int | None = None

class ExerciseRead(BaseModel):
    id: int
    name: str
    type: ExerciseType
    muscle_group_id: int
    is_active: bool
    created_at: datetime
```

## Endpoints

### User Muscle Groups — `/api/v1/muscle-groups`

| Method | Path | Response Model | Status | Operation ID |
|--------|------|---------------|--------|-------------|
| GET | `/` | `list[MuscleGroupRead]` | 200 | `listMuscleGroups` |
| GET | `/{muscle_group_id}` | `MuscleGroupRead` | 200 | `getMuscleGroup` |
| POST | `/` | `MuscleGroupRead` | 201 | `createMuscleGroup` |
| PATCH | `/{muscle_group_id}` | `MuscleGroupRead` | 200 | `updateMuscleGroup` |
| DELETE | `/{muscle_group_id}` | `MessageResponse` | 200 | `deleteMuscleGroup` |

### User Exercises — `/api/v1/exercises`

| Method | Path | Response Model | Status | Operation ID |
|--------|------|---------------|--------|-------------|
| GET | `/` | `list[ExerciseRead]` | 200 | `listExercises` |
| GET | `/{exercise_id}` | `ExerciseRead` | 200 | `getExercise` |
| POST | `/` | `ExerciseRead` | 201 | `createExercise` |
| PATCH | `/{exercise_id}` | `ExerciseRead` | 200 | `updateExercise` |
| DELETE | `/{exercise_id}` | `MessageResponse` | 200 | `deleteExercise` |

- `GET /` accepts optional query param `muscle_group_id: int | None` for filtering

### Admin Muscle Groups — `/api/v1/admin/muscle-groups`

| Method | Path | Response Model | Status | Operation ID |
|--------|------|---------------|--------|-------------|
| GET | `/` | `list[MuscleGroupRead]` | 200 | `adminListMuscleGroups` |
| GET | `/{muscle_group_id}` | `MuscleGroupRead` | 200 | `adminGetMuscleGroup` |
| POST | `/` | `MuscleGroupRead` | 201 | `adminCreateMuscleGroup` |
| PATCH | `/{muscle_group_id}` | `MuscleGroupRead` | 200 | `adminUpdateMuscleGroup` |
| DELETE | `/{muscle_group_id}` | `MessageResponse` | 200 | `adminDeleteMuscleGroup` |

### Admin Exercises — `/api/v1/admin/exercises`

| Method | Path | Response Model | Status | Operation ID |
|--------|------|---------------|--------|-------------|
| GET | `/` | `list[ExerciseRead]` | 200 | `adminListExercises` |
| GET | `/{exercise_id}` | `ExerciseRead` | 200 | `adminGetExercise` |
| POST | `/` | `ExerciseRead` | 201 | `adminCreateExercise` |
| PATCH | `/{exercise_id}` | `ExerciseRead` | 200 | `adminUpdateExercise` |
| DELETE | `/{exercise_id}` | `MessageResponse` | 200 | `adminDeleteExercise` |

- `GET /` accepts optional query param `muscle_group_id: int | None` for filtering

## Route Files

| File | Prefix | Auth Dependency |
|------|--------|----------------|
| `backend/app/routes/muscle_groups.py` | `/api/v1/muscle-groups` | `get_current_user` |
| `backend/app/routes/exercises.py` | `/api/v1/exercises` | `get_current_user` |
| `backend/app/routes/admin_muscle_groups.py` | `/api/v1/admin/muscle-groups` | `get_current_admin` |
| `backend/app/routes/admin_exercises.py` | `/api/v1/admin/exercises` | `get_current_admin` |

All four routers registered in `backend/app/main.py`.

## Error Handling

| Status | Condition |
|--------|-----------|
| 400 | Invalid `muscle_group_id` on exercise create/update (inactive or non-existent group for the user) |
| 404 | Record not found or not owned by requesting user |
| 409 | Duplicate name within user's active records (scoped to `user_id + is_active = True`) |

## Validation Rules

- Name uniqueness scoped to `user_id` + `is_active = True` — reusing a soft-deleted name is allowed
- Exercise type changes are permitted (e.g., reclassify WEIGHT to BODYWEIGHT)
- Soft-deleted records are invisible to all endpoints — no `?include_inactive` param in this phase
- Admin endpoints apply identical rules but scoped to the system user's `user_id`

## Ownership Enforcement

- User endpoints always filter by `Model.user_id == current_user.id` on every query
- Admin endpoints look up the system user (`User.is_system == True`) and filter by its `user_id`
- Records existing but belonging to another user return 404 (not 403)

## Testing

Follow existing patterns in `tests/conftest.py`:
- Use `admin_client` and `user_client` fixtures
- Test ownership isolation (user A cannot see user B's records)
- Test admin endpoints operate on system user data
- Test soft delete behavior (deleted records hidden from lists)
- Test duplicate name detection (409)
- Test invalid muscle_group_id on exercise creation (400)
