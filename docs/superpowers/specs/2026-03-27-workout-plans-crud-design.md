# Workout Plans CRUD — Backend Design Spec

## Overview

Add CRUD endpoints for workout plans and their exercises. Plans are simple ordered exercise lists (placeholders for future sessions). User-scoped only, no admin variant.

## Data Model Changes

### WorkoutPlan — add `is_active`

The `WorkoutPlan` model exists but lacks soft delete support. Add:

- `is_active: bool = True` (default True)

Requires an Alembic migration to add the column to `workout_plans`.

### PlanExercise — no changes

Existing model is sufficient: `id`, `plan_id`, `exercise_id`, `sort_order`.

## Schemas

### Workout Plan

```python
class WorkoutPlanCreate(SQLModel):
    name: str  # min_length=1, max_length=100

class WorkoutPlanUpdate(SQLModel):
    name: str | None  # min_length=1, max_length=100

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
    exercises: list[PlanExerciseRead]
```

### Plan Exercises

```python
class PlanExerciseCreate(SQLModel):
    exercise_id: int
    sort_order: int

class PlanExerciseReorder(SQLModel):
    plan_exercise_ids: list[int]  # ordered list, must match all IDs in plan exactly
```

## Endpoints

### Plan CRUD — `/api/v1/workout-plans`

| Method | Path | Operation ID | Description |
|--------|------|-------------|-------------|
| GET | `/` | `listWorkoutPlans` | List user's active plans with nested exercises |
| GET | `/{plan_id}` | `getWorkoutPlan` | Get single plan with exercises |
| POST | `/` | `createWorkoutPlan` | Create empty plan |
| PATCH | `/{plan_id}` | `updateWorkoutPlan` | Update plan name |
| DELETE | `/{plan_id}` | `deleteWorkoutPlan` | Soft delete (set `is_active=False`) |

### Plan Exercises — `/api/v1/workout-plans/{plan_id}/exercises`

| Method | Path | Operation ID | Description |
|--------|------|-------------|-------------|
| POST | `/` | `addPlanExercise` | Add exercise to plan |
| DELETE | `/{plan_exercise_id}` | `removePlanExercise` | Remove exercise from plan |
| PATCH | `/reorder` | `reorderPlanExercises` | Reorder exercises in plan |

## Service Layer

### `WorkoutPlanService`

Constructor: `__init__(self, session: AsyncSession, user_id: int)`

**Plan operations:**
- `list()` — return active plans with nested exercises, ordered by `updated_at` desc
- `get(plan_id)` — return single active plan with exercises; raise `NotFoundError` if not found
- `create(data)` — create plan, check duplicate name; raise `DuplicateNameError`
- `update(plan_id, data)` — update plan name, check duplicate; raise `NotFoundError`, `DuplicateNameError`
- `delete(plan_id)` — soft delete; raise `NotFoundError`

**Plan exercise operations:**
- `add_exercise(plan_id, data)` — add exercise to plan; raise `NotFoundError` (plan), `InvalidReferenceError` (exercise not found or not owned by user)
- `remove_exercise(plan_id, plan_exercise_id)` — remove exercise from plan; raise `NotFoundError`
- `reorder_exercises(plan_id, plan_exercise_ids)` — reorder all exercises; raise `NotFoundError` (plan), `InvalidReorderError` (IDs don't match plan's exercises exactly)

### New Exception

```python
class InvalidReorderError(Exception):
    def __init__(self, entity: str):
        super().__init__(f"Reorder list must contain all {entity} IDs exactly")
```

## Validations

| Rule | Error |
|------|-------|
| Plan name unique per user (active plans) | 409 `DuplicateNameError` |
| Plan belongs to current user | 404 `NotFoundError` |
| Exercise exists, belongs to user, is active | 400 `InvalidReferenceError` |
| Reorder list matches all plan exercise IDs exactly | 400 `InvalidReorderError` |

## Route → Service Error Mapping

| Service Exception | HTTP Status |
|-------------------|-------------|
| `NotFoundError` | 404 |
| `DuplicateNameError` | 409 |
| `InvalidReferenceError` | 400 |
| `InvalidReorderError` | 400 |

## Query Strategy

Plan list and get endpoints return nested exercises. Fetch plans first, then run a second query for plan exercises (matching the simple query pattern used elsewhere in the codebase). Assemble the nested response in the service layer.

## Files to Create/Modify

### New files
- `backend/app/schemas/workout_plan.py` — schemas
- `backend/app/services/workout_plan.py` — service
- `backend/app/routes/workout_plans.py` — route
- `backend/tests/test_workout_plans.py` — tests
- Alembic migration — add `is_active` to `workout_plans`

### Modified files
- `backend/app/models/workout_plan.py` — add `is_active` field
- `backend/app/services/exceptions.py` — add `InvalidReorderError`
- `backend/app/main.py` — register new router
