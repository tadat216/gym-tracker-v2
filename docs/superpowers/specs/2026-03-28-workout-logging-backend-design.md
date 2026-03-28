# Workout Logging Backend Design

## Overview

Build the backend API for logging workouts. Users can create workout sessions (from a plan or freestyle), add exercises, log sets with reps/weight/duration, and mark sessions as complete. Sessions can be logged on any date (including past dates for retroactive logging).

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Session start | Plan-based + freestyle + quick log | Users can start from a plan, empty session, or log past dates |
| Set logging | Simple (reps/weight/duration + complete) | No auto-fill or smart defaults — keep it minimal |
| Exercise status | Derived from sets | All sets completed = exercise completed; no manual field |
| Session lifecycle | Full CRUD + complete action | Editable after completion, no reopen action |
| Sessions per day | Multiple allowed | No unique constraint on user_id + date |
| Session deletion | Hard delete with cascade | Unlike plans, sessions are not soft-deleted |
| Timestamps | Stored as UTC | Frontend handles Vietnam timezone (UTC+7) display |
| Duration | Computed from started_at/completed_at | Not stored as a separate field |

## Data Model Changes

No new migrations needed. Existing models are used as-is:

### WorkoutSession (no changes)

| Field | Type | Notes |
|-------|------|-------|
| id | int | PK |
| user_id | int | FK → users.id |
| plan_id | int? | FK → workout_plans.id, nullable (freestyle sessions) |
| date | date | Workout date (allows past dates for retroactive logging) |
| status | SessionStatus | `in_progress` / `completed` |
| notes | str? | Optional session notes |
| started_at | datetime(tz) | Auto-set on creation (UTC) |
| completed_at | datetime(tz)? | Set when status → completed |

### SessionExercise (deprecate status field)

| Field | Type | Notes |
|-------|------|-------|
| id | int | PK |
| session_id | int | FK → workout_sessions.id |
| exercise_id | int | FK → exercises.id |
| sort_order | int | Display order |
| status | ExerciseStatus | **DEPRECATED** — completion derived from sets |

The `status` column remains in the database but is marked deprecated in the model code with a comment. No migration needed.

### ExerciseSet (no changes)

| Field | Type | Notes |
|-------|------|-------|
| id | int | PK |
| session_exercise_id | int | FK → session_exercises.id |
| set_number | int | Ordering within exercise |
| reps | int? | For weight/bodyweight exercises |
| weight | Decimal? | For weight exercises |
| duration | int? | For duration exercises (seconds) |
| is_completed | bool | Default false |

## API Schemas

### WorkoutSession Schemas

```python
class WorkoutSessionCreate(SQLModel):
    plan_id: int | None = None          # optional: copies exercises from plan
    date: date | None = None            # defaults to today if not provided
    notes: str | None = None

class WorkoutSessionUpdate(SQLModel):
    notes: str | None = Field(default=None)
    date: date | None = Field(default=None)

class WorkoutSessionRead(SQLModel):
    id: int
    plan_id: int | None
    date: date
    status: SessionStatus
    notes: str | None
    started_at: datetime
    completed_at: datetime | None
    exercises: list[SessionExerciseRead] = []
```

### SessionExercise Schemas

```python
class SessionExerciseCreate(SQLModel):
    exercise_id: int
    sort_order: int

class SessionExerciseRead(SQLModel):
    id: int
    exercise_id: int
    sort_order: int
    exercise_name: str              # denormalized from Exercise
    muscle_group_name: str          # denormalized from MuscleGroup
    sets: list[ExerciseSetRead] = []
    is_completed: bool              # computed: all sets are completed
```

### ExerciseSet Schemas

```python
class ExerciseSetCreate(SQLModel):
    set_number: int
    reps: int | None = None
    weight: Decimal | None = None
    duration: int | None = None

class ExerciseSetUpdate(SQLModel):
    set_number: int | None = None
    reps: int | None = None
    weight: Decimal | None = None
    duration: int | None = None
    is_completed: bool | None = None

class ExerciseSetRead(SQLModel):
    id: int
    set_number: int
    reps: int | None
    weight: Decimal | None
    duration: int | None
    is_completed: bool
```

## API Endpoints

All endpoints require authentication. User-scoped (users can only access their own sessions).

### Workout Sessions

| Method | Path | Operation ID | Description |
|--------|------|-------------|-------------|
| GET | `/api/v1/workout-sessions` | `listWorkoutSessions` | List sessions, filterable by `date_from` and `date_to` query params |
| POST | `/api/v1/workout-sessions` | `createWorkoutSession` | Create session. If `plan_id` provided, copies plan's exercises |
| GET | `/api/v1/workout-sessions/{session_id}` | `getWorkoutSession` | Get session with nested exercises and sets |
| PATCH | `/api/v1/workout-sessions/{session_id}` | `updateWorkoutSession` | Update notes or date |
| DELETE | `/api/v1/workout-sessions/{session_id}` | `deleteWorkoutSession` | Hard delete session + all exercises + sets |
| PATCH | `/api/v1/workout-sessions/{session_id}/complete` | `completeWorkoutSession` | Set status=completed, completed_at=now() |

### Session Exercises

| Method | Path | Operation ID | Description |
|--------|------|-------------|-------------|
| POST | `/api/v1/workout-sessions/{session_id}/exercises` | `addSessionExercise` | Add exercise to session |
| DELETE | `/api/v1/workout-sessions/{session_id}/exercises/{session_exercise_id}` | `removeSessionExercise` | Remove exercise + its sets |

### Exercise Sets

| Method | Path | Operation ID | Description |
|--------|------|-------------|-------------|
| POST | `/api/v1/workout-sessions/{session_id}/exercises/{session_exercise_id}/sets` | `addExerciseSet` | Add set to exercise |
| PATCH | `/api/v1/workout-sessions/{session_id}/exercises/{session_exercise_id}/sets/{set_id}` | `updateExerciseSet` | Update set fields |
| DELETE | `/api/v1/workout-sessions/{session_id}/exercises/{session_exercise_id}/sets/{set_id}` | `deleteExerciseSet` | Remove set |

### List Filtering

The `GET /workout-sessions` endpoint accepts optional query parameters:
- `date_from: date` — filter sessions on or after this date
- `date_to: date` — filter sessions on or before this date

Both are optional. When both provided, returns sessions within the date range (inclusive).

### Create with Plan

When `POST /workout-sessions` includes a `plan_id`:
1. Validate the plan belongs to the current user and is active
2. Create the session with the plan reference
3. Copy all `PlanExercise` entries into `SessionExercise` rows with the same sort_order
4. No sets are created — user adds those during the workout

## Service Layer

### WorkoutSessionService

Single service class following the existing `WorkoutPlanService` pattern:

```python
class WorkoutSessionService:
    def __init__(self, session: AsyncSession, user_id: int):
        self.session = session
        self.user_id = user_id
```

**Methods:**

| Method | Description | Errors |
|--------|-------------|--------|
| `list(date_from?, date_to?)` | List sessions with enriched exercises + sets | — |
| `get(session_id)` | Get single session with enriched exercises + sets | `NotFoundError` |
| `create(data)` | Create session, optionally copy plan exercises | `InvalidReferenceError` (bad plan_id) |
| `update(session_id, data)` | Update notes/date | `NotFoundError` |
| `delete(session_id)` | Hard delete with cascading exercises + sets | `NotFoundError` |
| `complete(session_id)` | Set completed status + timestamp | `NotFoundError` |
| `add_exercise(session_id, data)` | Add exercise to session | `NotFoundError`, `InvalidReferenceError` |
| `remove_exercise(session_id, se_id)` | Remove exercise + its sets | `NotFoundError` |
| `add_set(session_id, se_id, data)` | Add set to exercise | `NotFoundError` |
| `update_set(session_id, se_id, set_id, data)` | Update set | `NotFoundError` |
| `delete_set(session_id, se_id, set_id)` | Delete set | `NotFoundError` |

**Enriched exercise query** follows the same join pattern as `WorkoutPlanService._fetch_enriched_exercises` — joins SessionExercise → Exercise → MuscleGroup to denormalize names.

**Computed `is_completed`** on `SessionExerciseRead`: derived in the service layer by checking if all sets for that exercise have `is_completed=True` (and at least one set exists).

### Route File

Route file (`app/routes/workout_sessions.py`) handles only HTTP concerns:
- Instantiates `WorkoutSessionService` with session + current_user.id
- Maps service exceptions to HTTP status codes:
  - `NotFoundError` → 404
  - `InvalidReferenceError` → 400
- Returns appropriate response models

### Error Handling

Reuses existing exceptions from `app/services/exceptions.py`:
- `NotFoundError` — session/exercise/set not found or doesn't belong to user
- `InvalidReferenceError` — invalid plan_id or exercise_id reference

## Testing Strategy

Single test file: `tests/test_workout_sessions.py`

### Test Categories

**Session CRUD:**
- Create freestyle session (no plan_id)
- Create plan-based session (exercises copied from plan)
- Create session with past date (quick log)
- Create plan-based session with invalid plan_id → 400
- Get session with nested exercises and sets
- Update session notes and date
- Delete session cascades to exercises and sets
- List sessions with date range filtering
- User scoping — cannot access another user's session → 404

**Session Completion:**
- Complete session sets status + completed_at
- Complete session with no sets still succeeds
- Editing a completed session (update notes) works

**Session Exercises:**
- Add exercise to session
- Add exercise with invalid exercise_id → 400
- Remove exercise cascades to its sets

**Exercise Sets:**
- Add set to exercise
- Update set (reps, weight, duration, is_completed)
- Delete set
- Verify is_completed computed field on exercise read

**Edge Cases:**
- Multiple sessions on same date
- Session with mixed exercise types (weight, bodyweight, duration)
