# Exercise Library Frontend Design

## Overview

A unified "Exercise Library" page where users manage both muscle groups and exercises from a single screen. Muscle groups appear as colored filter chips at the top; exercises are listed below the selected group. This replaces two separate CRUD pages with one cohesive experience.

**Route:** `/exercises` (authenticated, all users)
**Nav link:** "Exercise Library" in the navigation drawer

## Page Structure

### Layout

```
┌─────────────────────────────┐
│ ☰    Exercise Library       │  ← AppHeader (sticky, h-14)
├─────────────────────────────┤
│ [Chest] [Back] [Legs] ... ⚙ │  ← Muscle group chips + gear icon
│ 5 exercises                  │  ← Count label
├─────────────────────────────┤
│ ┃ Bench Press        weight │  ← Exercise row (card-row + color bar)
│ ┃ Incline DB Press   weight │
│ ┃ Push-ups       bodyweight │
│ ┃ Cable Flyes        weight │
│ ┃ Chest Dips     bodyweight │
│                              │
│                         [+] │  ← FAB (create exercise)
└─────────────────────────────┘
```

### Muscle Group Chips

- Horizontally scrollable row of chips
- **Selected chip:** background = muscle group's color, white text, `font-weight: 600`
- **Unselected chips:** `bg-secondary text-secondary-foreground`, `border border-border`
- Chip border-radius: `rounded-full` (9999px)
- **Gear icon** (⚙): right-aligned, `ghost` button style — opens muscle group management bottom sheet
- Tapping a chip filters the exercise list to that muscle group
- First chip is auto-selected on page load

### Exercise List

- Uses the existing `card-row` utility pattern
- Each row has:
  - **Left color bar:** 3px `border-left` using the selected muscle group's color
  - **Exercise name:** `text-[15px] font-bold text-foreground`
  - **Type badge:** plain pill — `bg-secondary text-secondary-foreground rounded-full` — shows "weight", "bodyweight", or "duration"
  - **Action menu:** `⋯` button → `DropdownMenu` with Edit and Delete options
- Sorted alphabetically by name (matches backend)

### Empty States

**No exercises in selected group:**
- Uses existing `ListEmpty` component with a `Dumbbell` Lucide icon
- Title: "No exercises yet"
- Description: "Tap + to add your first exercise"

**No muscle groups at all (fresh user):**
- Uses `ListEmpty` with a `Layers` Lucide icon
- Title: "No muscle groups yet"
- Description: "Tap ⚙ to create your first muscle group"
- FAB is hidden (can't create exercise without a muscle group)

### FAB (Floating Action Button)

- Uses existing `Fab` component — `Plus` icon, `bg-primary`, `rounded-[14px]`, `shadow-lg`
- **Always creates an exercise** (muscle group creation is via gear sheet)
- Pre-selects the currently active muscle group chip in the form

## Bottom Sheets

All forms use the existing `FormSheet` component: `rounded-t-[20px]`, `border-t border-primary/10`, `bg-gradient-to-b from-card to-card/80`, title `text-[22px] font-extrabold`.

### 1. Create/Edit Exercise Sheet

Triggered by: FAB (+) for create, ⋯ → Edit for edit.

**Fields:**
- **Name** — `FormField` component, `text` input, placeholder "e.g. Bench Press", max 100 chars
- **Type** — Segmented toggle with 3 options: Weight | Bodyweight | Duration
  - Active segment: `bg-primary text-primary-foreground font-bold rounded-[9px]`
  - Inactive segments: `text-muted-foreground`
  - Container: `bg-white/3 border border-input rounded-[10px]`
- **Muscle Group** — Select dropdown showing color dot + group name
  - Pre-filled with currently selected chip (on create)
  - Shows all active muscle groups from `useListMuscleGroups`
  - Implemented as a native `<select>` styled to match the app's input pattern, or a custom dropdown using `DropdownMenu` if native select can't show color dots

**Submit button:** "Create Exercise" or "Save Changes" — `Button` default variant.

**Edit mode additions:**
- Delete button at bottom: `Button` destructive variant → opens `ConfirmDialog`

### 2. Manage Muscle Groups Sheet

Triggered by: gear icon (⚙) next to chips.

**Content:**
- Title: "Muscle Groups"
- List of all muscle groups using `card-row` pattern:
  - Color swatch (14px square, `rounded-[4px]`)
  - Group name: `text-[15px] font-bold`
  - ⋯ action menu → Edit / Delete
- "+ Add Muscle Group" button at bottom: dashed border, `text-primary`

### 3. Create/Edit Muscle Group Sheet

Triggered by: "+ Add" in manage sheet, or ⋯ → Edit on a group row.

**Fields:**
- **Name** — `FormField` component, placeholder "e.g. Chest", max 100 chars
- **Color** — Full color picker:
  - Saturation/brightness area: rectangular gradient, draggable cursor
  - Hue slider: horizontal rainbow bar, draggable thumb
  - Live preview: shows chip with selected color + hex code display
  - Container styling: `rounded-[10px] border border-border`

**Submit button:** "Create Muscle Group" or "Save Changes".

**Edit mode additions:**
- Delete button → `ConfirmDialog` with warning about associated exercises

## Interactions

| Action | Trigger | UI Response |
|--------|---------|-------------|
| Filter exercises | Tap muscle group chip | Chip highlights, list filters, count updates |
| Create exercise | Tap FAB (+) | Exercise form sheet opens, muscle group pre-selected |
| Edit exercise | ⋯ → Edit on row | Exercise form sheet opens with current values |
| Delete exercise | ⋯ → Delete on row | ConfirmDialog → soft delete → toast → list refreshes |
| Manage groups | Tap ⚙ icon | Muscle group list sheet opens |
| Create group | "+ Add" in manage sheet | Muscle group form sheet opens |
| Edit group | ⋯ → Edit on group row | Muscle group form sheet opens with current values |
| Delete group | ⋯ → Delete on group row | ConfirmDialog → soft delete → toast → chips refresh |

## Error Handling

- **Duplicate name (409):** Show inline error on the name field: "A [muscle group/exercise] with this name already exists"
- **Invalid muscle group reference (400):** Show inline error on the muscle group field
- **Network errors:** Toast notification via Sonner
- **Loading states:** `isSubmitting` disables form, button shows loading text
- **Optimistic updates:** Not used — wait for server confirmation, invalidate query cache

## Data Flow

### API Hooks (generated by Orval)

After running `scripts/generate-api.sh`, Orval will generate:
- `useListMuscleGroups`, `useCreateMuscleGroup`, `useUpdateMuscleGroup`, `useDeleteMuscleGroup`
- `useListExercises` (with `muscle_group_id` query param), `useCreateExercise`, `useUpdateExercise`, `useDeleteExercise`

### State Management

- **Server state:** TanStack Query via Orval-generated hooks
- **Local UI state:** React `useState` in custom hooks
  - `selectedMuscleGroupId: number | null` — which chip is active
  - `exerciseFormMode: "closed" | "create" | "edit"` — exercise sheet state
  - `muscleGroupSheetOpen: boolean` — manage groups sheet
  - `muscleGroupFormMode: "closed" | "create" | "edit"` — group form sheet
- **No Zustand store needed** — all state is page-local

### Query Cache Invalidation

- After exercise create/update/delete → invalidate `listExercises`
- After muscle group create/update/delete → invalidate both `listMuscleGroups` and `listExercises` (exercises reference muscle groups)

## Component Structure

Following the existing hooks/views/container pattern exactly as `components/users/`.

**Key rules from the codebase:**
- One data hook per entity (like `use-users-data.ts` — not bundled)
- Every view component gets a props interface in `types.ts`
- Views use `const + displayName + default export` pattern
- Barrel files re-export as named: `export { default as X } from "./x"`
- Skeleton and list are separate files (like `user-list.tsx` + `user-list-skeleton.tsx`)
- Container wires hooks → single top-level page view

```
components/exercise-library/
├── hooks/
│   ├── index.ts                          # barrel: re-exports all hooks
│   ├── use-muscle-groups-data.ts         # Orval CRUD hooks for muscle groups only
│   ├── use-exercises-data.ts             # Orval CRUD hooks for exercises only
│   ├── use-exercise-form.ts              # Exercise form state (mode, values, open/close)
│   └── use-muscle-group-form.ts          # Muscle group form state (mode, values, open/close)
├── views/
│   ├── index.ts                          # barrel: re-exports all views
│   ├── exercise-library-page.tsx         # Top-level layout: chips + list + FAB + all sheets
│   ├── muscle-group-chips.tsx            # Chip row with gear icon
│   ├── exercise-list/
│   │   ├── index.ts                      # barrel: ExerciseList, ExerciseRow, ExerciseListSkeleton
│   │   ├── exercise-list.tsx             # Maps exercises → ExerciseRow
│   │   ├── exercise-row.tsx              # Single card-row with color bar + type badge + ⋯ menu
│   │   └── exercise-list-skeleton.tsx    # Loading skeleton (3 placeholder rows)
│   ├── exercise-form-sheet.tsx           # Create/edit exercise bottom sheet
│   ├── muscle-group-sheet.tsx            # Manage muscle groups list bottom sheet
│   ├── muscle-group-row.tsx              # Single muscle group row in manage sheet
│   └── muscle-group-form-sheet.tsx       # Create/edit muscle group bottom sheet (name + color picker)
├── types.ts                              # ALL prop interfaces + form types
├── container.tsx                         # Wires hooks → ExerciseLibraryPage
└── index.ts                              # barrel: export { default as ExerciseLibraryContainer }
```

### types.ts — Prop Interfaces

Every view receives typed props. No view calls hooks directly.

```ts
// Form types
type ExerciseFormMode = "closed" | "create" | "edit";
type MuscleGroupFormMode = "closed" | "create" | "edit";

interface ExerciseFormValues { name: string; type: ExerciseType; muscleGroupId: number | null; }
interface MuscleGroupFormValues { name: string; color: string; }

// View props (mirrors the Users pattern)
interface ExerciseLibraryPageProps { ... }    // all props from container
interface MuscleGroupChipsProps { ... }       // groups, selectedId, onSelect, onManageClick
interface ExerciseListProps { ... }           // exercises, muscleGroupColor, onExerciseClick
interface ExerciseRowProps { ... }            // exercise, color, onEdit, onDelete
interface ExerciseFormSheetProps { ... }      // mode, open, values, muscleGroups, isSubmitting, error, ...
interface MuscleGroupSheetProps { ... }       // open, groups, onAdd, onEdit, onDelete, onClose
interface MuscleGroupRowProps { ... }         // group, onEdit, onDelete
interface MuscleGroupFormSheetProps { ... }   // mode, open, values, isSubmitting, error, ...
```

### Data Hooks — One Per Entity

**`use-muscle-groups-data.ts`** — follows `use-users-data.ts` pattern:
- Wraps `useListMuscleGroups`, `useCreateMuscleGroup`, `useUpdateMuscleGroup`, `useDeleteMuscleGroup`
- Each mutation: `mutateAsync` → `invalidateQueries` → `toast.success`
- Returns: `{ muscleGroups, isLoading, createMuscleGroup, updateMuscleGroup, deleteMuscleGroup, isCreating, isUpdating, isDeleting }`

**`use-exercises-data.ts`** — same pattern:
- Wraps `useListExercises` (passes `muscle_group_id` param), `useCreateExercise`, `useUpdateExercise`, `useDeleteExercise`
- Invalidates both exercise and muscle group queries on mutation (muscle group deletion cascades)
- Returns: `{ exercises, isLoading, createExercise, updateExercise, deleteExercise, isCreating, isUpdating, isDeleting }`

### Form Hooks — One Per Entity

**`use-exercise-form.ts`** — follows `use-user-form.ts` pattern:
- State: `mode`, `formValues: ExerciseFormValues`, `editingExercise`
- Methods: `openCreate(muscleGroupId)`, `openEdit(exercise)`, `close()`, `setField()`

**`use-muscle-group-form.ts`** — same pattern:
- State: `mode`, `formValues: MuscleGroupFormValues`, `editingMuscleGroup`
- Methods: `openCreate()`, `openEdit(group)`, `close()`, `setField()`

### Container — Wires Everything

`container.tsx` follows `users/container.tsx` exactly:
- Calls all four hooks
- Manages `deleteConfirmOpen`, `submitError` state
- Handles async submit/delete with try/catch and 409 detection
- Passes all props down to `ExerciseLibraryPage`

### New UI Components

- **SegmentedToggle** (`src/ui/segmented-toggle.tsx`) — reusable toggle for N options, generic `<T extends string>`
- **ColorPicker** (`src/ui/color-picker.tsx`) — full HSB color picker with hue slider and live preview

## Routing

Add to TanStack Router file-based routing:

```
routes/
  exercises.tsx    # Exercise Library page (authenticated)
```

Route guard: same as home page — requires auth token, redirects to `/login` if not authenticated.

Add "Exercise Library" to `NavDrawerLinks` with a `Dumbbell` Lucide icon, visible to all authenticated users.

## New shadcn/UI Dependencies

None — the design uses only existing shadcn components (Sheet, Button, Badge, DropdownMenu, AlertDialog, Input, Label). The SegmentedToggle and ColorPicker are custom components.

## Visual Reference

Mockups are available in `.superpowers/brainstorm/` (created during design session).
