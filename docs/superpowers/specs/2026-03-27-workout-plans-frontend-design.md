# Workout Plans Frontend — Design Spec

## Overview

Add a Workout Plans feature to the frontend, allowing users to create, view, edit, and delete workout plans, and manage exercises within each plan (add, remove, reorder). Follows the existing hooks/views/container pattern used by the exercise library feature.

## Screens

### 1. Plans List (`/plans`)

Displays all user's workout plans as card rows.

Each **PlanCard** shows:
- Plan name (bold)
- Exercise count ("5 exercises")
- Exercise name preview (comma-separated, truncated with ellipsis)
- Muscle group badges (unique groups derived from exercises)
- `RowActionMenu` (edit/delete)

**Empty state:** `ListEmpty` with clipboard icon, "No workout plans yet" title, and prompt to create first plan.

**FAB** at bottom-right opens the create plan form sheet.

**Loading state:** 3 skeleton rows matching card dimensions.

### 2. Create/Edit Plan Sheet

`FormSheet` bottom sheet with:
- `FormField` for plan name (required, 1-100 chars)
- Submit button: "Create Plan" or "Save Changes"
- Delete button (edit mode only, triggers `ConfirmDialog`)
- Error display on name field for 409 duplicate name conflicts

### 3. Plan Detail (`/plans/:planId`)

Header shows plan name with back arrow and horizontal three-dot menu (edit plan name, delete plan).

Displays ordered exercise list where each **PlanExerciseRow** shows:
- Drag handle (three horizontal lines)
- Order number (1-based, muted)
- Exercise name (bold)
- Muscle group name (muted subtitle)
- `Badge` for exercise type (Weight/Bodyweight/Duration) — not available in current API response, omit for now
- Remove button (X icon, muted, red on hover)

Below the list: dashed "Add Exercise" button opens the exercise picker.

**Empty state within plan:** `ListEmpty` with "No exercises yet" and prompt to add first exercise.

Drag-to-reorder calls the reorder endpoint on drop. Use `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop (or check if already in dependencies, otherwise use a simpler approach with move-up/move-down buttons as v1).

### 4. Add Exercise Picker Sheet

`FormSheet` bottom sheet showing all user's exercises grouped by muscle group.

Each picker item shows:
- Avatar with initials (`.avatar-initial` pattern)
- Exercise name + type subtitle
- Checkbox (multi-select)

Features:
- Search input at top to filter by exercise name
- Exercises already in the plan are disabled/dimmed with "Already added" label
- Submit button: "Add N Exercises" (disabled when none selected)
- Fetches exercises via `useListExercises` from the existing exercises API

On submit, calls `addPlanExercise` for each selected exercise with `sort_order` = current count + index.

### 5. Delete Plan Confirmation

Standard `ConfirmDialog` with plan name in the description. On confirm, calls `deleteWorkoutPlan` and navigates back to plans list.

## Component Structure

Two containers (one per route), views as pure single-file components, and one child sub-component (`exercise-picker`) that has its own data lifecycle.

```
components/workout-plans/
├── exercise-picker/                  # Child with own lifecycle (fetches exercises, manages selection)
│   ├── hooks/
│   │   └── use-exercise-picker.ts    # useListExercises + search filter + selection state
│   ├── views/
│   │   ├── exercise-picker-sheet.tsx  # FormSheet wrapper: search input + grouped list + submit
│   │   └── exercise-picker-item.tsx   # Single selectable row: avatar, name, type, checkbox
│   ├── types.ts                       # PickerSelection, grouped exercise types
│   └── index.ts
├── hooks/
│   ├── use-plans-data.ts             # useListWorkoutPlans + create/update/delete mutations
│   ├── use-plan-detail-data.ts       # useGetWorkoutPlan + add/remove/reorder exercise mutations
│   └── use-plan-form.ts             # Plan name form state (create/edit mode, values, open/close)
├── views/
│   ├── plans-page.tsx                # List layout: count label + plan cards + empty state
│   ├── plan-card.tsx                 # Card row: name, exercise preview, muscle group badges, menu
│   ├── plan-card-skeleton.tsx        # Shimmer skeleton matching card dimensions
│   ├── plan-detail-page.tsx          # Detail layout: exercise list + add button + empty state
│   ├── plan-exercise-row.tsx         # Row: drag handle, order number, name, muscle group, remove
│   └── plan-form-sheet.tsx           # FormSheet: name input, submit, delete (edit mode)
├── types.ts                          # PlanFormMode, PlanFormValues, all view prop interfaces
├── plans-container.tsx               # Wires hooks → views for /plans route
├── plan-detail-container.tsx         # Wires hooks → views for /plans/$planId route
└── index.ts
```

### Why this structure

**Two containers, not one:** Unlike exercise-library (single page), workout plans has two routes (`/plans` list and `/plans/$planId` detail). Each container stays small by owning only its route's concerns.

**exercise-picker as child folder:** It fetches its own data (`useListExercises` — different API from plans), manages its own state (search query, selected IDs), and composes its own views (sheet → items). Same pattern as `exercises/` and `muscle-groups/` inside exercise-library.

**Every view is a single file, pure props, unit-testable:**
- `plan-card.tsx` — render with mock plan → assert name, exercise preview, badges
- `plan-exercise-row.tsx` — render with mock exercise → assert order, name, remove button
- `exercise-picker-item.tsx` — render with mock exercise → assert selected/disabled states
- `plan-form-sheet.tsx` — render with form values → assert input, submit, error display

## Routing

Add two routes:
- `/plans` — plans list (plans-container)
- `/plans/$planId` — plan detail (plan-detail-container)

Add "Plans" link to the nav drawer between Home and Exercises.

## Data Flow

### Plans List
1. `usePlansData` calls `useListWorkoutPlans` → returns `WorkoutPlanRead[]`
2. Each plan has `exercises: PlanExerciseRead[]` with `exercise_name` and `muscle_group_name`
3. Plan card derives muscle group badges from `exercises[].muscle_group_name` (unique set)
4. Plan card derives exercise preview from `exercises[].exercise_name` (comma join)

### Plan Detail
1. `usePlanDetailData(planId)` calls `useGetWorkoutPlan(planId)` → returns single `WorkoutPlanRead`
2. Add exercise: `useAddPlanExercise` → invalidate plan query
3. Remove exercise: `useRemovePlanExercise` → invalidate plan query
4. Reorder: `useReorderPlanExercises` → optimistic update sort_order locally, invalidate on settle

### Exercise Picker
1. Fetches all exercises via `useListExercises` (no muscle_group_id filter)
2. Groups client-side by muscle group name
3. Filters out exercises already in the plan (by `exercise_id` match)
4. On submit, sequentially calls `addPlanExercise` for each selected exercise

## Reusable Components (from existing UI library)

| Component | Usage |
|-----------|-------|
| `card-row` CSS | Plan cards, exercise rows |
| `RowActionMenu` | Plan card edit/delete |
| `Fab` | Create plan button on list page |
| `ListEmpty` | Empty plans list, empty exercises in plan |
| `FormSheet` | Create/edit plan, exercise picker |
| `FormField` | Plan name input |
| `ConfirmDialog` | Delete plan confirmation |
| `Badge` | Muscle group tags on plan cards |
| `avatar-initial` CSS | Exercise picker item avatars |
| `Button` | Submit buttons, action buttons |

## New Components

| Component | Purpose |
|-----------|---------|
| `PlanCard` | Plan list card with exercise preview + muscle group badges |
| `PlanExerciseRow` | Ordered exercise row with drag handle + remove |
| `ExercisePickerSheet` | Grouped multi-select exercise picker with search |

## Error Handling

| Scenario | Handling |
|----------|---------|
| Create plan duplicate name (409) | Show error on name field: "A plan with this name already exists" |
| Update plan duplicate name (409) | Same as create |
| Plan not found (404) | Navigate to plans list, show error toast |
| Network errors | Generic error toast |

## Toast Messages

- Plan created: "Plan 'X' created"
- Plan updated: "Plan 'X' updated"
- Plan deleted: "Plan 'X' deleted"
- Exercise added: "Exercise added to plan" (or "N exercises added")
- Exercise removed: "Exercise removed from plan"
- Reorder: silent (no toast, visual feedback is sufficient)
