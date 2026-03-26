# Workout Tables Design

## Overview

Database schema for the gym tracker's core workout functionality: muscle groups, exercises, workout plans, and workout logging.

## Key Decisions

- **One muscle group per exercise** — muscle groups are organizational categories, not scientific muscle mapping
- **Copy-on-create** — system default muscle groups and exercises are copied into each user's data on account creation. No shared/global rows. Users fully own their data.
- **System user** — a special user (`username = "system"`, no password hash) whose muscle groups and exercises serve as the default templates. On new user signup, copy all active data from the system user. Admin manages defaults via a dedicated UI page that reads/writes the system user's data. No extra tables needed.
- **Soft delete** — `is_active` flag on muscle groups and exercises. Deactivated items disappear from pickers but remain in historical logs.
- **Plans vs Logs** — separate tables. Starting a session from a plan copies exercises into the session. The session is independent from that point — users can modify freely.
- **Single `weight` column** — always in kg, used for barbell weight, extra weight (vest/belt), etc. No unit tracking.
- **3 exercise types** — `weight`, `bodyweight`, `duration`. All share one `exercise_sets` table with nullable fields.
- **Base/DB model split** — each entity has a `FooBase(BaseModel)` with only the fields needed for API responses (id, name, etc.) and a `Foo(SQLModel, table=True)` with all DB columns (user_id, is_active, created_at). API endpoints return the Base schema. This keeps responses lean for both REST and future MCP tool integration.

## Exercise Types

| Type | Example | Per-set fields |
|------|---------|---------------|
| weight | Bench Press, Squat | reps (required) + weight in kg (required) |
| bodyweight | Pull-ups, Dips | reps (required) + weight in kg (optional, for vest/belt) |
| duration | Plank, Farmer's Walk | duration in seconds (required) + weight in kg (optional) |

## Tables

### 1. `muscle_groups`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | int | PK | |
| name | varchar | not null | e.g. "Chest", "Back" |
| color | varchar | not null | hex color e.g. "#FF5733" |
| user_id | int | FK → users.id, not null | owner |
| is_active | bool | not null, default true | soft delete |
| created_at | timestamp(tz) | not null | |

### 2. `exercises`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | int | PK | |
| name | varchar | not null | e.g. "Bench Press" |
| type | enum | not null | `weight`, `bodyweight`, `duration` |
| muscle_group_id | int | FK → muscle_groups.id, not null | |
| user_id | int | FK → users.id, not null | owner |
| is_active | bool | not null, default true | soft delete |
| created_at | timestamp(tz) | not null | |

### 3. `workout_plans`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | int | PK | |
| name | varchar | not null | e.g. "Push Day A" |
| user_id | int | FK → users.id, not null | |
| created_at | timestamp(tz) | not null | |
| updated_at | timestamp(tz) | not null | |

### 4. `plan_exercises`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | int | PK | |
| plan_id | int | FK → workout_plans.id, not null | cascade delete |
| exercise_id | int | FK → exercises.id, not null | |
| sort_order | int | not null | display order in plan |

### 5. `workout_sessions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | int | PK | |
| user_id | int | FK → users.id, not null | |
| plan_id | int | FK → workout_plans.id, nullable | null = freestyle session |
| date | date | not null | workout date |
| status | enum | not null | `in_progress`, `completed` |
| notes | text | nullable | optional session notes |
| started_at | timestamp(tz) | not null | |
| completed_at | timestamp(tz) | nullable | set when completed |

### 6. `session_exercises`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | int | PK | |
| session_id | int | FK → workout_sessions.id, not null | cascade delete |
| exercise_id | int | FK → exercises.id, not null | |
| sort_order | int | not null | display order |
| status | enum | not null, default 'pending' | `pending`, `completed`, `skipped` |

### 7. `exercise_sets`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | int | PK | |
| session_exercise_id | int | FK → session_exercises.id, not null | cascade delete |
| set_number | int | not null | 1, 2, 3... |
| reps | int | nullable | used by weight + bodyweight types |
| weight | decimal | nullable | kg — used by all types where applicable |
| duration | int | nullable | seconds — used by duration type |
| is_completed | bool | not null, default false | |

## Model Schemas

Each entity has a **Base model** (API response — lean) and a **DB model** (full table — extends Base).

### MuscleGroupBase (API response)
| Field | Type |
|-------|------|
| id | int |
| name | str |
| color | str |

### MuscleGroup (DB model, extends MuscleGroupBase)
| Extra Field | Type |
|-------------|------|
| user_id | int |
| is_active | bool |
| created_at | datetime |

---

### ExerciseBase (API response)
| Field | Type |
|-------|------|
| id | int |
| name | str |
| type | ExerciseType |
| muscle_group_id | int |

### Exercise (DB model, extends ExerciseBase)
| Extra Field | Type |
|-------------|------|
| user_id | int |
| is_active | bool |
| created_at | datetime |

---

### WorkoutPlanBase (API response)
| Field | Type |
|-------|------|
| id | int |
| name | str |

### WorkoutPlan (DB model, extends WorkoutPlanBase)
| Extra Field | Type |
|-------------|------|
| user_id | int |
| created_at | datetime |
| updated_at | datetime |

---

### PlanExerciseBase (API response)
| Field | Type |
|-------|------|
| id | int |
| exercise_id | int |
| sort_order | int |

### PlanExercise (DB model, extends PlanExerciseBase)
| Extra Field | Type |
|-------------|------|
| plan_id | int |

---

### WorkoutSessionBase (API response)
| Field | Type |
|-------|------|
| id | int |
| plan_id | int \| None |
| date | date |
| status | SessionStatus |
| notes | str \| None |
| started_at | datetime |
| completed_at | datetime \| None |

### WorkoutSession (DB model, extends WorkoutSessionBase)
| Extra Field | Type |
|-------------|------|
| user_id | int |

---

### SessionExerciseBase (API response)
| Field | Type |
|-------|------|
| id | int |
| exercise_id | int |
| sort_order | int |
| status | ExerciseStatus |

### SessionExercise (DB model, extends SessionExerciseBase)
| Extra Field | Type |
|-------------|------|
| session_id | int |

---

### ExerciseSetBase (API response)
| Field | Type |
|-------|------|
| id | int |
| set_number | int |
| reps | int \| None |
| weight | Decimal \| None |
| duration | int \| None |
| is_completed | bool |

### ExerciseSet (DB model, extends ExerciseSetBase)
| Extra Field | Type |
|-------------|------|
| session_exercise_id | int |

---

**Pattern:** Base models exclude `user_id`, `is_active`, `created_at`, and parent FK fields (like `session_id`, `plan_id` on child entities) — those are internal/contextual. The parent already knows its children, so the FK back to parent is redundant in nested responses.

## UX Flows

### Start from plan
1. User picks a plan (e.g. "Push Day A")
2. App creates `workout_session` with `plan_id` set
3. App copies `plan_exercises` → `session_exercises` (same exercises, same order)
4. Session starts with zero sets — user adds sets as they train
5. User can add/remove/reorder exercises freely
6. Exercises not done are marked as `skipped`
7. User marks session as completed

### Freestyle session
1. User starts a new session without a plan (`plan_id = null`)
2. User adds exercises manually
3. Logs sets as they train
4. Marks session as completed

## Pre-seeded Data

A `system` user is created during initial database setup (migration or seed script). This user has no password hash and cannot log in. Its muscle groups and exercises are the defaults that get copied to every new user on signup.

Admin can modify these defaults via a dedicated "Default Exercises" page in the admin UI, which reads/writes the system user's data.

### Initial seed data for the system user

### Muscle Groups
- Chest (#EF4444)
- Back (#3B82F6)
- Shoulders (#F59E0B)
- Biceps (#8B5CF6)
- Triceps (#EC4899)
- Legs (#10B981)
- Core (#6366F1)
- Cardio (#F97316)

### Exercises (examples per group)

**Chest:** Bench Press (weight), Incline Dumbbell Press (weight), Push-ups (bodyweight), Cable Fly (weight)

**Back:** Deadlift (weight), Pull-ups (bodyweight), Barbell Row (weight), Lat Pulldown (weight)

**Shoulders:** Overhead Press (weight), Lateral Raise (weight), Face Pull (weight)

**Biceps:** Barbell Curl (weight), Dumbbell Curl (weight), Hammer Curl (weight)

**Triceps:** Tricep Pushdown (weight), Skull Crusher (weight), Dips (bodyweight)

**Legs:** Squat (weight), Leg Press (weight), Romanian Deadlift (weight), Leg Curl (weight), Calf Raise (weight)

**Core:** Plank (duration), Hanging Leg Raise (bodyweight), Ab Wheel Rollout (bodyweight)

**Cardio:** Treadmill (duration), Jump Rope (duration)
