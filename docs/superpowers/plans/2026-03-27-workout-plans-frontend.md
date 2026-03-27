# Workout Plans Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add workout plans UI with list page, detail page, exercise picker, and full CRUD — following existing hooks/views/container patterns with TDD.

**Architecture:** Two routes (`/plans` list, `/plans/$planId` detail) each with a container wiring hooks to pure views. Exercise picker is a child component with its own data lifecycle. No drag-and-drop library — v1 uses move-up/move-down buttons for reorder.

**Tech Stack:** React 19, TanStack Router + Query, Orval-generated API hooks, Vitest + Testing Library

## Visual Design Reference

**Mockup:** `docs/mockups/workout-plans-ui.html` — open in browser for pixel-accurate reference of all 6 screens. The mockup uses the app's exact Midnight Steel theme, Manrope font, and spacing system.

| Mockup Screen | Maps to Component | Key Details |
|---------------|-------------------|-------------|
| 1. Plans List | `PlansPage` + `PlanCard` | Cards with name, exercise preview, muscle group badges, action menu, FAB |
| 2. Empty State | `PlansPage` (empty) | `ListEmpty` with ClipboardList icon + FAB |
| 3. Create/Edit Plan | `PlanFormSheet` | Bottom sheet with name input, submit, delete (edit only) |
| 4. Plan Detail | `PlanDetailPage` + `PlanExerciseRow` | Header (back + name + menu), ordered rows with move/remove, dashed add button |
| 5. Add Exercise | `ExercisePickerSheet` + `ExercisePickerItem` | Grouped list with search, multi-select checkboxes, bulk add |
| 6. Delete Confirm | `ConfirmDialog` (reused) | Standard destructive confirmation |

### Implementation-specific details not shown in mockup

**PlanCard:**
- Plan name is a `<button>` (not clickable div) for accessibility — navigates to detail
- `RowActionMenu` click area uses `stopPropagation` (menu doesn't navigate)
- Empty plan shows "No exercises" text, no badges

**PlanExerciseRow:**
- Move-up/move-down `Button ghost icon-xs` with `aria-label` "Move up" / "Move down"
- Disabled when `isFirst` / `isLast`
- Remove button: `aria-label` "Remove", muted → red on hover

**PlanDetailPage:**
- Header renders inside the view (not the root layout) — back arrow `Button ghost icon-sm`, plan name (truncated), `DropdownMenu` with "Edit name" and "Delete plan" (destructive)
- `PAGE_TITLES["/plans/$planId"]` is empty string since view renders its own header

**ExercisePickerItem:**
- `<button>` element with `disabled` attribute (not div with onClick guard)
- Disabled items show "Already added" subtitle, `opacity-40`

**PlanFormSheet:**
- Submit labels: "Create Plan" / "Creating..." in create mode, "Save Changes" / "Saving..." in edit mode
- Error text from 409 shown below name field

---

### Task 1: Types and barrel exports

**Files:**
- Create: `frontend/src/components/workout-plans/types.ts`
- Create: `frontend/src/components/workout-plans/index.ts`
- Create: `frontend/src/components/workout-plans/hooks/index.ts`
- Create: `frontend/src/components/workout-plans/views/index.ts`
- Create: `frontend/src/components/workout-plans/exercise-picker/types.ts`
- Create: `frontend/src/components/workout-plans/exercise-picker/index.ts`

- [x] **Step 1: Create types file**

```ts
// frontend/src/components/workout-plans/types.ts
import type { WorkoutPlanRead, PlanExerciseRead } from "@/api/model";

export type PlanFormMode = "closed" | "create" | "edit";

export interface PlanFormValues {
  name: string;
}

export interface PlanCardProps {
  plan: WorkoutPlanRead;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export interface PlanExerciseRowProps {
  exercise: PlanExerciseRead;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export interface PlanFormSheetProps {
  mode: PlanFormMode;
  open: boolean;
  values: PlanFormValues;
  isSubmitting: boolean;
  error: string | null;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  onDeleteClick: () => void;
}

export interface PlansPageProps {
  plans: WorkoutPlanRead[];
  isLoading: boolean;
  onPlanClick: (plan: WorkoutPlanRead) => void;
  onPlanEdit: (plan: WorkoutPlanRead) => void;
  onPlanDelete: (plan: WorkoutPlanRead) => void;
  onCreateClick: () => void;
}

export interface PlanDetailPageProps {
  plan: WorkoutPlanRead | null;
  isLoading: boolean;
  onEditPlan: () => void;
  onDeletePlan: () => void;
  onAddExercise: () => void;
  onRemoveExercise: (planExerciseId: number) => void;
  onMoveExercise: (fromIndex: number, toIndex: number) => void;
  onBack: () => void;
}

export interface PlanDetailContainerProps {
  planId: number;
}
```

- [x] **Step 2: Create exercise-picker types**

```ts
// frontend/src/components/workout-plans/exercise-picker/types.ts
import type { ExerciseRead } from "@/api/model";

export interface ExerciseGroup {
  muscleGroupName: string;
  exercises: ExerciseRead[];
}

export interface ExercisePickerSheetProps {
  open: boolean;
  groups: ExerciseGroup[];
  selectedIds: Set<number>;
  disabledIds: Set<number>;
  searchQuery: string;
  isLoading: boolean;
  isSubmitting: boolean;
  onSearchChange: (query: string) => void;
  onToggle: (exerciseId: number) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export interface ExercisePickerItemProps {
  exercise: ExerciseRead;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}
```

- [x] **Step 3: Create barrel exports**

```ts
// frontend/src/components/workout-plans/index.ts
export { default as PlansContainer } from "./plans-container";
export { default as PlanDetailContainer } from "./plan-detail-container";
```

```ts
// frontend/src/components/workout-plans/hooks/index.ts
export { usePlansData } from "./use-plans-data";
export { usePlanDetailData } from "./use-plan-detail-data";
export { usePlanForm } from "./use-plan-form";
```

```ts
// frontend/src/components/workout-plans/views/index.ts
export { default as PlansPage } from "./plans-page";
export { default as PlanCard } from "./plan-card";
export { default as PlanCardSkeleton } from "./plan-card-skeleton";
export { default as PlanDetailPage } from "./plan-detail-page";
export { default as PlanExerciseRow } from "./plan-exercise-row";
export { default as PlanFormSheet } from "./plan-form-sheet";
```

```ts
// frontend/src/components/workout-plans/exercise-picker/index.ts
export { useExercisePicker } from "./hooks/use-exercise-picker";
export { default as ExercisePickerSheet } from "./views/exercise-picker-sheet";
```

- [x] **Step 4: Commit**

```bash
git add frontend/src/components/workout-plans/
git commit -m "feat(plans): add types and barrel exports for workout plans feature"
```

---

### Task 2: usePlanForm hook

**Files:**
- Create: `frontend/src/components/workout-plans/hooks/use-plan-form.ts`
- Create: `frontend/tests/unit/components/workout-plans/hooks/use-plan-form.test.tsx`

- [x] **Step 1: Write failing tests**

```tsx
// frontend/tests/unit/components/workout-plans/hooks/use-plan-form.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { WorkoutPlanRead } from "@/api/model";

describe("usePlanForm", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const mockPlan: WorkoutPlanRead = {
    id: 1, name: "Push Day", is_active: true,
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
    exercises: [],
  };

  it("initializes in closed mode with empty values", async () => {
    const { usePlanForm } = await import("@/components/workout-plans/hooks/use-plan-form");
    const { result } = renderHook(() => usePlanForm());
    expect(result.current.mode).toBe("closed");
    expect(result.current.formValues.name).toBe("");
  });

  it("openCreate sets mode and clears values", async () => {
    const { usePlanForm } = await import("@/components/workout-plans/hooks/use-plan-form");
    const { result } = renderHook(() => usePlanForm());
    act(() => result.current.openCreate());
    expect(result.current.mode).toBe("create");
    expect(result.current.formValues.name).toBe("");
  });

  it("openEdit sets mode and populates values from plan", async () => {
    const { usePlanForm } = await import("@/components/workout-plans/hooks/use-plan-form");
    const { result } = renderHook(() => usePlanForm());
    act(() => result.current.openEdit(mockPlan));
    expect(result.current.mode).toBe("edit");
    expect(result.current.formValues.name).toBe("Push Day");
    expect(result.current.editingPlan).toEqual(mockPlan);
  });

  it("close resets mode and values", async () => {
    const { usePlanForm } = await import("@/components/workout-plans/hooks/use-plan-form");
    const { result } = renderHook(() => usePlanForm());
    act(() => result.current.openCreate());
    act(() => result.current.setField("name", "Leg Day"));
    act(() => result.current.close());
    expect(result.current.mode).toBe("closed");
    expect(result.current.formValues.name).toBe("");
  });

  it("setField updates form values", async () => {
    const { usePlanForm } = await import("@/components/workout-plans/hooks/use-plan-form");
    const { result } = renderHook(() => usePlanForm());
    act(() => result.current.openCreate());
    act(() => result.current.setField("name", "Leg Day"));
    expect(result.current.formValues.name).toBe("Leg Day");
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/hooks/use-plan-form.test.tsx`
Expected: FAIL — module not found.

- [x] **Step 3: Implement the hook**

```ts
// frontend/src/components/workout-plans/hooks/use-plan-form.ts
import { useState, useCallback } from "react";
import type { WorkoutPlanRead } from "@/api/model";
import type { PlanFormMode, PlanFormValues } from "../types";

const EMPTY_FORM: PlanFormValues = { name: "" };

export function usePlanForm() {
  const [mode, setMode] = useState<PlanFormMode>("closed");
  const [formValues, setFormValues] = useState<PlanFormValues>(EMPTY_FORM);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlanRead | null>(null);

  const openCreate = useCallback(() => {
    setMode("create");
    setFormValues(EMPTY_FORM);
    setEditingPlan(null);
  }, []);

  const openEdit = useCallback((plan: WorkoutPlanRead) => {
    setMode("edit");
    setFormValues({ name: plan.name });
    setEditingPlan(plan);
  }, []);

  const close = useCallback(() => {
    setMode("closed");
    setFormValues(EMPTY_FORM);
    setEditingPlan(null);
  }, []);

  const setField = useCallback((field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  return { mode, formValues, editingPlan, openCreate, openEdit, close, setField };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/hooks/use-plan-form.test.tsx`
Expected: 5 PASS.

- [x] **Step 5: Commit**

```bash
git add frontend/src/components/workout-plans/hooks/use-plan-form.ts frontend/tests/unit/components/workout-plans/hooks/use-plan-form.test.tsx
git commit -m "feat(plans): add usePlanForm hook with tests"
```

---

### Task 3: usePlansData hook

**Files:**
- Create: `frontend/src/components/workout-plans/hooks/use-plans-data.ts`
- Create: `frontend/tests/unit/components/workout-plans/hooks/use-plans-data.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// frontend/tests/unit/components/workout-plans/hooks/use-plans-data.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { WorkoutPlanRead } from "@/api/model";

const mockMutateCreate = vi.fn();
const mockMutateUpdate = vi.fn();
const mockMutateDelete = vi.fn();

const mockPlans: WorkoutPlanRead[] = [
  {
    id: 1, name: "Push Day", is_active: true,
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
    exercises: [
      { id: 10, exercise_id: 100, sort_order: 0, exercise_name: "Bench Press", muscle_group_name: "Chest" },
    ],
  },
  {
    id: 2, name: "Pull Day", is_active: true,
    created_at: "2026-01-02T00:00:00Z", updated_at: "2026-01-02T00:00:00Z",
    exercises: [],
  },
];

vi.mock("@/api/workout-plans/workout-plans", () => ({
  useListWorkoutPlans: () => ({
    data: { data: mockPlans, status: 200, headers: new Headers() },
    isLoading: false,
  }),
  useCreateWorkoutPlan: () => ({ mutateAsync: mockMutateCreate, isPending: false }),
  useUpdateWorkoutPlan: () => ({ mutateAsync: mockMutateUpdate, isPending: false }),
  useDeleteWorkoutPlan: () => ({ mutateAsync: mockMutateDelete, isPending: false }),
  getListWorkoutPlansQueryKey: () => ["/api/v1/workout-plans"],
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("usePlansData", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns plans from the list query", async () => {
    const { usePlansData } = await import("@/components/workout-plans/hooks/use-plans-data");
    const { result } = renderHook(() => usePlansData(), { wrapper: createWrapper() });
    expect(result.current.plans).toEqual(mockPlans);
    expect(result.current.isLoading).toBe(false);
  });

  it("createPlan calls mutateAsync with { data }", async () => {
    mockMutateCreate.mockResolvedValueOnce({ data: mockPlans[0], status: 201 });
    const { usePlansData } = await import("@/components/workout-plans/hooks/use-plans-data");
    const { result } = renderHook(() => usePlansData(), { wrapper: createWrapper() });
    await act(async () => { await result.current.createPlan({ name: "Leg Day" }); });
    expect(mockMutateCreate).toHaveBeenCalledWith({ data: { name: "Leg Day" } });
  });

  it("updatePlan calls mutateAsync with { planId, data }", async () => {
    mockMutateUpdate.mockResolvedValueOnce({ data: mockPlans[0], status: 200 });
    const { usePlansData } = await import("@/components/workout-plans/hooks/use-plans-data");
    const { result } = renderHook(() => usePlansData(), { wrapper: createWrapper() });
    await act(async () => { await result.current.updatePlan(1, { name: "Push Day V2" }); });
    expect(mockMutateUpdate).toHaveBeenCalledWith({ planId: 1, data: { name: "Push Day V2" } });
  });

  it("deletePlan calls mutateAsync with { planId }", async () => {
    mockMutateDelete.mockResolvedValueOnce({ data: { message: "ok" }, status: 200 });
    const { usePlansData } = await import("@/components/workout-plans/hooks/use-plans-data");
    const { result } = renderHook(() => usePlansData(), { wrapper: createWrapper() });
    await act(async () => { await result.current.deletePlan(2); });
    expect(mockMutateDelete).toHaveBeenCalledWith({ planId: 2 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/hooks/use-plans-data.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

```ts
// frontend/src/components/workout-plans/hooks/use-plans-data.ts
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useListWorkoutPlans,
  useCreateWorkoutPlan,
  useUpdateWorkoutPlan,
  useDeleteWorkoutPlan,
  getListWorkoutPlansQueryKey,
} from "@/api/workout-plans/workout-plans";
import type { WorkoutPlanCreate, WorkoutPlanUpdate } from "@/api/model";

export function usePlansData() {
  const queryClient = useQueryClient();
  const listQuery = useListWorkoutPlans();
  const createMutation = useCreateWorkoutPlan();
  const updateMutation = useUpdateWorkoutPlan();
  const deleteMutation = useDeleteWorkoutPlan();

  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListWorkoutPlansQueryKey() });
  }, [queryClient]);

  const createPlan = useCallback(
    async (data: WorkoutPlanCreate) => {
      const result = await createMutation.mutateAsync({ data });
      invalidateList();
      toast.success(`Plan '${data.name}' created`);
      return result;
    },
    [createMutation, invalidateList],
  );

  const updatePlan = useCallback(
    async (planId: number, data: WorkoutPlanUpdate) => {
      const result = await updateMutation.mutateAsync({ planId, data });
      invalidateList();
      toast.success(`Plan updated`);
      return result;
    },
    [updateMutation, invalidateList],
  );

  const deletePlan = useCallback(
    async (planId: number) => {
      const result = await deleteMutation.mutateAsync({ planId });
      invalidateList();
      toast.success(`Plan deleted`);
      return result;
    },
    [deleteMutation, invalidateList],
  );

  return {
    plans: listQuery.data?.data ?? [],
    isLoading: listQuery.isLoading,
    createPlan,
    updatePlan,
    deletePlan,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/hooks/use-plans-data.test.tsx`
Expected: 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/workout-plans/hooks/use-plans-data.ts frontend/tests/unit/components/workout-plans/hooks/use-plans-data.test.tsx
git commit -m "feat(plans): add usePlansData hook with tests"
```

---

### Task 4: PlanCard view

**Files:**
- Create: `frontend/src/components/workout-plans/views/plan-card.tsx`
- Create: `frontend/tests/unit/components/workout-plans/views/plan-card.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// frontend/tests/unit/components/workout-plans/views/plan-card.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { WorkoutPlanRead } from "@/api/model";

const mockPlan: WorkoutPlanRead = {
  id: 1, name: "Push Day", is_active: true,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  exercises: [
    { id: 10, exercise_id: 100, sort_order: 0, exercise_name: "Bench Press", muscle_group_name: "Chest" },
    { id: 11, exercise_id: 101, sort_order: 1, exercise_name: "OHP", muscle_group_name: "Shoulders" },
    { id: 12, exercise_id: 102, sort_order: 2, exercise_name: "Cable Flies", muscle_group_name: "Chest" },
  ],
};

const emptyPlan: WorkoutPlanRead = {
  id: 2, name: "Empty Plan", is_active: true,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  exercises: [],
};

describe("PlanCard", () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onClick = vi.fn();

  it("renders plan name", async () => {
    const { default: PlanCard } = await import("@/components/workout-plans/views/plan-card");
    render(<PlanCard plan={mockPlan} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />);
    expect(screen.getByText("Push Day")).toBeDefined();
  });

  it("renders exercise count", async () => {
    const { default: PlanCard } = await import("@/components/workout-plans/views/plan-card");
    render(<PlanCard plan={mockPlan} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />);
    expect(screen.getByText("3 exercises")).toBeDefined();
  });

  it("renders exercise names as comma-separated preview", async () => {
    const { default: PlanCard } = await import("@/components/workout-plans/views/plan-card");
    render(<PlanCard plan={mockPlan} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />);
    expect(screen.getByText("Bench Press, OHP, Cable Flies")).toBeDefined();
  });

  it("renders unique muscle group badges", async () => {
    const { default: PlanCard } = await import("@/components/workout-plans/views/plan-card");
    render(<PlanCard plan={mockPlan} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />);
    expect(screen.getByText("Chest")).toBeDefined();
    expect(screen.getByText("Shoulders")).toBeDefined();
  });

  it("shows 'No exercises' when plan has no exercises", async () => {
    const { default: PlanCard } = await import("@/components/workout-plans/views/plan-card");
    render(<PlanCard plan={emptyPlan} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />);
    expect(screen.getByText("No exercises")).toBeDefined();
    expect(screen.getByText("0 exercises")).toBeDefined();
  });

  it("calls onClick when plan name button is clicked", async () => {
    const user = userEvent.setup();
    const { default: PlanCard } = await import("@/components/workout-plans/views/plan-card");
    render(<PlanCard plan={mockPlan} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Push Day" }));
    expect(onClick).toHaveBeenCalled();
  });

  it("renders actions button", async () => {
    const { default: PlanCard } = await import("@/components/workout-plans/views/plan-card");
    render(<PlanCard plan={mockPlan} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />);
    expect(screen.getByRole("button", { name: "Actions" })).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/views/plan-card.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement PlanCard**

```tsx
// frontend/src/components/workout-plans/views/plan-card.tsx
import { Badge } from "@/ui/badge";
import { RowActionMenu } from "@/ui/row-action-menu";
import type { PlanCardProps } from "../types";

const PlanCard = ({ plan, onEdit, onDelete, onClick }: PlanCardProps) => {
  const exercises = plan.exercises ?? [];
  const count = exercises.length;
  const preview = exercises.map((e) => e.exercise_name).join(", ");
  const muscleGroups = [...new Set(exercises.map((e) => e.muscle_group_name))];

  return (
    <div
      className="flex w-full flex-col items-start gap-2.5 rounded-[14px] border border-border/50 bg-linear-to-br from-card/80 to-card/40 p-3.5 transition-colors hover:border-primary/20"
      style={{ borderLeft: "3px solid var(--color-primary)" }}
    >
      <div className="flex w-full items-center justify-between">
        <button
          type="button"
          onClick={onClick}
          className="min-w-0 flex-1 text-left text-[15px] font-bold text-foreground hover:text-primary"
        >
          {plan.name}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {count} exercise{count !== 1 ? "s" : ""}
          </span>
          <RowActionMenu onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
      <p className="w-full truncate text-[13px] text-muted-foreground">
        {preview || "No exercises"}
      </p>
      {muscleGroups.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {muscleGroups.map((name) => (
            <Badge key={name} variant="secondary">{name}</Badge>
          ))}
        </div>
      )}
    </div>
  );
};

PlanCard.displayName = "PlanCard";
export default PlanCard;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/views/plan-card.test.tsx`
Expected: 7 PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/workout-plans/views/plan-card.tsx frontend/tests/unit/components/workout-plans/views/plan-card.test.tsx
git commit -m "feat(plans): add PlanCard view with tests"
```

---

### Task 5: PlanCardSkeleton and PlanFormSheet views

**Files:**
- Create: `frontend/src/components/workout-plans/views/plan-card-skeleton.tsx`
- Create: `frontend/src/components/workout-plans/views/plan-form-sheet.tsx`
- Create: `frontend/tests/unit/components/workout-plans/views/plan-form-sheet.test.tsx`

- [ ] **Step 1: Create PlanCardSkeleton (no test needed — pure visual)**

```tsx
// frontend/src/components/workout-plans/views/plan-card-skeleton.tsx
const PlanCardSkeleton = () => {
  return (
    <div className="flex w-full animate-pulse flex-col items-start gap-2.5 rounded-[14px] border border-border/50 bg-linear-to-br from-card/80 to-card/40 p-3.5">
      <div className="flex w-full items-center justify-between">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="h-3 w-16 rounded bg-muted" />
      </div>
      <div className="h-3 w-48 rounded bg-muted" />
      <div className="flex gap-1.5">
        <div className="h-5 w-14 rounded-full bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
    </div>
  );
};

PlanCardSkeleton.displayName = "PlanCardSkeleton";
export default PlanCardSkeleton;
```

- [ ] **Step 2: Write failing tests for PlanFormSheet**

```tsx
// frontend/tests/unit/components/workout-plans/views/plan-form-sheet.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const baseProps = {
  mode: "create" as const,
  open: true,
  values: { name: "" },
  isSubmitting: false,
  error: null,
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  onClose: vi.fn(),
  onDeleteClick: vi.fn(),
};

describe("PlanFormSheet", () => {
  it("renders 'New Plan' title in create mode", async () => {
    const { default: PlanFormSheet } = await import("@/components/workout-plans/views/plan-form-sheet");
    render(<PlanFormSheet {...baseProps} />);
    expect(screen.getByText("New Plan")).toBeDefined();
  });

  it("renders 'Edit Plan' title in edit mode", async () => {
    const { default: PlanFormSheet } = await import("@/components/workout-plans/views/plan-form-sheet");
    render(<PlanFormSheet {...baseProps} mode="edit" />);
    expect(screen.getByText("Edit Plan")).toBeDefined();
  });

  it("renders name input with current value", async () => {
    const { default: PlanFormSheet } = await import("@/components/workout-plans/views/plan-form-sheet");
    render(<PlanFormSheet {...baseProps} values={{ name: "Push Day" }} />);
    expect(screen.getByDisplayValue("Push Day")).toBeDefined();
  });

  it("calls onChange when name input changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { default: PlanFormSheet } = await import("@/components/workout-plans/views/plan-form-sheet");
    render(<PlanFormSheet {...baseProps} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("e.g. Push Day, Upper Body..."), "A");
    expect(onChange).toHaveBeenCalledWith("name", "A");
  });

  it("renders submit button with 'Create Plan' in create mode", async () => {
    const { default: PlanFormSheet } = await import("@/components/workout-plans/views/plan-form-sheet");
    render(<PlanFormSheet {...baseProps} />);
    expect(screen.getByRole("button", { name: "Create Plan" })).toBeDefined();
  });

  it("renders submit button with 'Save Changes' in edit mode", async () => {
    const { default: PlanFormSheet } = await import("@/components/workout-plans/views/plan-form-sheet");
    render(<PlanFormSheet {...baseProps} mode="edit" />);
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDefined();
  });

  it("shows delete button only in edit mode", async () => {
    const { default: PlanFormSheet } = await import("@/components/workout-plans/views/plan-form-sheet");
    const { rerender } = render(<PlanFormSheet {...baseProps} mode="create" />);
    expect(screen.queryByRole("button", { name: "Delete Plan" })).toBeNull();
    rerender(<PlanFormSheet {...baseProps} mode="edit" />);
    expect(screen.getByRole("button", { name: "Delete Plan" })).toBeDefined();
  });

  it("displays error message when error prop is set", async () => {
    const { default: PlanFormSheet } = await import("@/components/workout-plans/views/plan-form-sheet");
    render(<PlanFormSheet {...baseProps} error="A plan with this name already exists" />);
    expect(screen.getByText("A plan with this name already exists")).toBeDefined();
  });
});
```

- [ ] **Step 3: Implement PlanFormSheet**

```tsx
// frontend/src/components/workout-plans/views/plan-form-sheet.tsx
import { Button } from "@/ui/button";
import { FormSheet } from "@/ui/form-sheet";
import { FormField } from "@/ui/form-field";
import type { PlanFormSheetProps } from "../types";

const PlanFormSheet = ({
  mode, open, values, isSubmitting, error,
  onChange, onSubmit, onClose, onDeleteClick,
}: PlanFormSheetProps) => {
  const isCreate = mode === "create";
  const title = isCreate ? "New Plan" : "Edit Plan";
  const submitLabel = isCreate ? "Create Plan" : "Save Changes";
  const submittingLabel = isCreate ? "Creating..." : "Saving...";

  return (
    <FormSheet open={open} title={title} onClose={onClose}>
      <div className="space-y-4">
        <FormField
          id="plan-name" label="Plan Name" value={values.name}
          onChange={(v) => onChange("name", v)} placeholder="e.g. Push Day, Upper Body..."
          error={error ?? undefined}
        />
      </div>
      <div className="mt-6 space-y-2">
        <Button onClick={onSubmit} disabled={isSubmitting} className="h-12 w-full rounded-xl text-[15px] font-bold">
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
        {mode === "edit" && (
          <Button variant="ghost" onClick={onDeleteClick}
            className="w-full text-sm font-semibold text-destructive opacity-70 hover:text-destructive hover:opacity-100">
            Delete Plan
          </Button>
        )}
      </div>
    </FormSheet>
  );
};

PlanFormSheet.displayName = "PlanFormSheet";
export default PlanFormSheet;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/views/plan-form-sheet.test.tsx`
Expected: 8 PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/workout-plans/views/plan-card-skeleton.tsx frontend/src/components/workout-plans/views/plan-form-sheet.tsx frontend/tests/unit/components/workout-plans/views/plan-form-sheet.test.tsx
git commit -m "feat(plans): add PlanCardSkeleton and PlanFormSheet views with tests"
```

---

### Task 6: PlansPage view

**Files:**
- Create: `frontend/src/components/workout-plans/views/plans-page.tsx`
- Create: `frontend/tests/unit/components/workout-plans/views/plans-page.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// frontend/tests/unit/components/workout-plans/views/plans-page.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { WorkoutPlanRead } from "@/api/model";

const mockPlans: WorkoutPlanRead[] = [
  {
    id: 1, name: "Push Day", is_active: true,
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
    exercises: [
      { id: 10, exercise_id: 100, sort_order: 0, exercise_name: "Bench Press", muscle_group_name: "Chest" },
    ],
  },
  {
    id: 2, name: "Pull Day", is_active: true,
    created_at: "2026-01-02T00:00:00Z", updated_at: "2026-01-02T00:00:00Z",
    exercises: [],
  },
];

const baseProps = {
  plans: mockPlans,
  isLoading: false,
  onPlanClick: vi.fn(),
  onPlanEdit: vi.fn(),
  onPlanDelete: vi.fn(),
  onCreateClick: vi.fn(),
};

describe("PlansPage", () => {
  it("renders plan count", async () => {
    const { default: PlansPage } = await import("@/components/workout-plans/views/plans-page");
    render(<PlansPage {...baseProps} />);
    expect(screen.getByText("2 plans")).toBeDefined();
  });

  it("renders each plan card", async () => {
    const { default: PlansPage } = await import("@/components/workout-plans/views/plans-page");
    render(<PlansPage {...baseProps} />);
    expect(screen.getByText("Push Day")).toBeDefined();
    expect(screen.getByText("Pull Day")).toBeDefined();
  });

  it("renders empty state when no plans", async () => {
    const { default: PlansPage } = await import("@/components/workout-plans/views/plans-page");
    render(<PlansPage {...baseProps} plans={[]} />);
    expect(screen.getByText("No workout plans yet")).toBeDefined();
  });

  it("renders skeletons when loading", async () => {
    const { default: PlansPage } = await import("@/components/workout-plans/views/plans-page");
    const { container } = render(<PlansPage {...baseProps} isLoading={true} plans={[]} />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/views/plans-page.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement PlansPage**

```tsx
// frontend/src/components/workout-plans/views/plans-page.tsx
import { ClipboardList } from "lucide-react";
import { Fab } from "@/ui/fab";
import { ListEmpty } from "@/ui/list-empty";
import PlanCard from "./plan-card";
import PlanCardSkeleton from "./plan-card-skeleton";
import type { PlansPageProps } from "../types";

const PlansPage = ({
  plans, isLoading, onPlanClick, onPlanEdit, onPlanDelete, onCreateClick,
}: PlansPageProps) => {
  if (isLoading) {
    return (
      <>
        <div className="px-6 pb-4 pt-3">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-2 px-4">
          <PlanCardSkeleton />
          <PlanCardSkeleton />
          <PlanCardSkeleton />
        </div>
      </>
    );
  }

  if (plans.length === 0) {
    return (
      <>
        <ListEmpty
          icon={ClipboardList}
          title="No workout plans yet"
          description="Create your first plan to organize exercises into structured workouts"
        />
        <Fab label="New plan" onClick={onCreateClick} />
      </>
    );
  }

  return (
    <>
      <div className="px-6 pb-4 pt-3">
        <p className="text-[13px] font-medium text-muted-foreground">
          {plans.length} plan{plans.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="space-y-2 px-4 pb-24">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onClick={() => onPlanClick(plan)}
            onEdit={() => onPlanEdit(plan)}
            onDelete={() => onPlanDelete(plan)}
          />
        ))}
      </div>
      <Fab label="New plan" onClick={onCreateClick} />
    </>
  );
};

PlansPage.displayName = "PlansPage";
export default PlansPage;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/views/plans-page.test.tsx`
Expected: 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/workout-plans/views/plans-page.tsx frontend/tests/unit/components/workout-plans/views/plans-page.test.tsx
git commit -m "feat(plans): add PlansPage view with tests"
```

---

### Task 7: PlansContainer, route, and nav link

**Files:**
- Create: `frontend/src/components/workout-plans/plans-container.tsx`
- Create: `frontend/src/routes/plans.tsx`
- Modify: `frontend/src/components/navigation/views/nav-drawer/nav-drawer-links.tsx`
- Modify: `frontend/src/routes/__root.tsx` (add "Plans" to `PAGE_TITLES`)

- [ ] **Step 1: Create PlansContainer**

```tsx
// frontend/src/components/workout-plans/plans-container.tsx
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePlansData } from "./hooks/use-plans-data";
import { usePlanForm } from "./hooks/use-plan-form";
import PlansPage from "./views/plans-page";
import PlanFormSheet from "./views/plan-form-sheet";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import type { WorkoutPlanRead } from "@/api/model";

const PlansContainer = () => {
  const navigate = useNavigate();
  const data = usePlansData();
  const form = usePlanForm();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<WorkoutPlanRead | null>(null);

  const handleCreateClick = () => { setSubmitError(null); form.openCreate(); };
  const handleEdit = (plan: WorkoutPlanRead) => { setSubmitError(null); form.openEdit(plan); };
  const handleDelete = (plan: WorkoutPlanRead) => { setDeletingPlan(plan); setDeleteConfirmOpen(true); };

  const handleFormSubmit = async () => {
    setSubmitError(null);
    try {
      if (form.mode === "create") {
        await data.createPlan({ name: form.formValues.name });
      } else if (form.mode === "edit" && form.editingPlan) {
        await data.updatePlan(form.editingPlan.id, { name: form.formValues.name });
      }
      form.close();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) setSubmitError("A plan with this name already exists");
      else setSubmitError("Something went wrong. Please try again.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPlan) return;
    try {
      await data.deletePlan(deletingPlan.id);
      setDeleteConfirmOpen(false);
      setDeletingPlan(null);
      form.close();
    } catch {
      setSubmitError("Failed to delete plan.");
    }
  };

  const handleFormDelete = () => {
    if (form.editingPlan) handleDelete(form.editingPlan);
  };

  return (
    <>
      <PlansPage
        plans={data.plans}
        isLoading={data.isLoading}
        onPlanClick={(plan) => navigate({ to: "/plans/$planId", params: { planId: String(plan.id) } })}
        onPlanEdit={handleEdit}
        onPlanDelete={handleDelete}
        onCreateClick={handleCreateClick}
      />
      <PlanFormSheet
        mode={form.mode}
        open={form.mode !== "closed"}
        values={form.formValues}
        isSubmitting={data.isCreating || data.isUpdating}
        error={submitError}
        onChange={form.setField}
        onSubmit={handleFormSubmit}
        onClose={form.close}
        onDeleteClick={handleFormDelete}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Plan?"
        description={`"${deletingPlan?.name}" will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        isLoading={data.isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </>
  );
};

PlansContainer.displayName = "PlansContainer";
export default PlansContainer;
```

- [ ] **Step 2: Create route file**

```tsx
// frontend/src/routes/plans.tsx
import { createFileRoute } from "@tanstack/react-router";
import { PlansContainer } from "@/components/workout-plans";

export const Route = createFileRoute("/plans")({
  component: PlansPage,
});

function PlansPage() {
  return <PlansContainer />;
}
```

- [ ] **Step 3: Add "Plans" to nav drawer links**

In `frontend/src/components/navigation/views/nav-drawer/nav-drawer-links.tsx`, add a `ClipboardList` import from lucide-react and a new NavLink between Home and Exercise Library:

```tsx
import { Home, ClipboardList, Dumbbell, Users } from "lucide-react";
import NavLink from "./nav-link";
import type { NavDrawerLinksProps } from "../../types";

const NavDrawerLinks = ({ isAdmin, currentPath, onNavigate }: NavDrawerLinksProps) => {
  return (
    <nav className="flex flex-col gap-1 px-2 py-4">
      <NavLink icon={Home} label="Home" href="/" isActive={currentPath === "/"} onClick={onNavigate} />
      <NavLink icon={ClipboardList} label="Plans" href="/plans" isActive={currentPath === "/plans"} onClick={onNavigate} />
      <NavLink icon={Dumbbell} label="Exercise Library" href="/exercises" isActive={currentPath === "/exercises"} onClick={onNavigate} />
      {isAdmin && (
        <NavLink icon={Users} label="Users" href="/admin/users" isActive={currentPath === "/admin/users"} onClick={onNavigate} />
      )}
    </nav>
  );
};

NavDrawerLinks.displayName = "NavDrawerLinks";
export default NavDrawerLinks;
```

- [ ] **Step 4: Add "Plans" to PAGE_TITLES in __root.tsx**

In `frontend/src/routes/__root.tsx`, find the `PAGE_TITLES` object and add the `/plans` entry:

```ts
"/plans": "Plans",
```

- [ ] **Step 5: Run the dev server and verify the plans list page renders**

Run: `cd frontend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/workout-plans/plans-container.tsx frontend/src/routes/plans.tsx frontend/src/components/navigation/views/nav-drawer/nav-drawer-links.tsx frontend/src/routes/__root.tsx
git commit -m "feat(plans): add PlansContainer, route, and nav link"
```

---

### Task 8: usePlanDetailData hook

**Files:**
- Create: `frontend/src/components/workout-plans/hooks/use-plan-detail-data.ts`
- Create: `frontend/tests/unit/components/workout-plans/hooks/use-plan-detail-data.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// frontend/tests/unit/components/workout-plans/hooks/use-plan-detail-data.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { WorkoutPlanRead } from "@/api/model";

const mockMutateAdd = vi.fn();
const mockMutateRemove = vi.fn();
const mockMutateReorder = vi.fn();

const mockPlan: WorkoutPlanRead = {
  id: 1, name: "Push Day", is_active: true,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  exercises: [
    { id: 10, exercise_id: 100, sort_order: 0, exercise_name: "Bench Press", muscle_group_name: "Chest" },
    { id: 11, exercise_id: 101, sort_order: 1, exercise_name: "OHP", muscle_group_name: "Shoulders" },
  ],
};

vi.mock("@/api/workout-plans/workout-plans", () => ({
  useGetWorkoutPlan: () => ({
    data: { data: mockPlan, status: 200, headers: new Headers() },
    isLoading: false,
  }),
  useAddPlanExercise: () => ({ mutateAsync: mockMutateAdd, isPending: false }),
  useRemovePlanExercise: () => ({ mutateAsync: mockMutateRemove, isPending: false }),
  useReorderPlanExercises: () => ({ mutateAsync: mockMutateReorder, isPending: false }),
  getGetWorkoutPlanQueryKey: (id: number) => [`/api/v1/workout-plans/${id}`],
  getListWorkoutPlansQueryKey: () => ["/api/v1/workout-plans"],
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("usePlanDetailData", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns plan from the get query", async () => {
    const { usePlanDetailData } = await import("@/components/workout-plans/hooks/use-plan-detail-data");
    const { result } = renderHook(() => usePlanDetailData(1), { wrapper: createWrapper() });
    expect(result.current.plan).toEqual(mockPlan);
    expect(result.current.isLoading).toBe(false);
  });

  it("addExercise calls mutateAsync with planId and data", async () => {
    mockMutateAdd.mockResolvedValueOnce({ data: {}, status: 201 });
    const { usePlanDetailData } = await import("@/components/workout-plans/hooks/use-plan-detail-data");
    const { result } = renderHook(() => usePlanDetailData(1), { wrapper: createWrapper() });
    await act(async () => { await result.current.addExercise(100, 0); });
    expect(mockMutateAdd).toHaveBeenCalledWith({ planId: 1, data: { exercise_id: 100, sort_order: 0 } });
  });

  it("removeExercise calls mutateAsync with planId and planExerciseId", async () => {
    mockMutateRemove.mockResolvedValueOnce({ data: { message: "ok" }, status: 200 });
    const { usePlanDetailData } = await import("@/components/workout-plans/hooks/use-plan-detail-data");
    const { result } = renderHook(() => usePlanDetailData(1), { wrapper: createWrapper() });
    await act(async () => { await result.current.removeExercise(10); });
    expect(mockMutateRemove).toHaveBeenCalledWith({ planId: 1, planExerciseId: 10 });
  });

  it("reorderExercises calls mutateAsync with new order", async () => {
    mockMutateReorder.mockResolvedValueOnce({ data: { message: "ok" }, status: 200 });
    const { usePlanDetailData } = await import("@/components/workout-plans/hooks/use-plan-detail-data");
    const { result } = renderHook(() => usePlanDetailData(1), { wrapper: createWrapper() });
    await act(async () => { await result.current.reorderExercises([11, 10]); });
    expect(mockMutateReorder).toHaveBeenCalledWith({ planId: 1, data: { plan_exercise_ids: [11, 10] } });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/hooks/use-plan-detail-data.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

```ts
// frontend/src/components/workout-plans/hooks/use-plan-detail-data.ts
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useGetWorkoutPlan,
  useAddPlanExercise,
  useRemovePlanExercise,
  useReorderPlanExercises,
  getGetWorkoutPlanQueryKey,
  getListWorkoutPlansQueryKey,
} from "@/api/workout-plans/workout-plans";

export function usePlanDetailData(planId: number) {
  const queryClient = useQueryClient();
  const planQuery = useGetWorkoutPlan(planId);
  const addMutation = useAddPlanExercise();
  const removeMutation = useRemovePlanExercise();
  const reorderMutation = useReorderPlanExercises();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetWorkoutPlanQueryKey(planId) });
    queryClient.invalidateQueries({ queryKey: getListWorkoutPlansQueryKey() });
  }, [queryClient, planId]);

  const addExercise = useCallback(
    async (exerciseId: number, sortOrder: number) => {
      const result = await addMutation.mutateAsync({
        planId,
        data: { exercise_id: exerciseId, sort_order: sortOrder },
      });
      invalidate();
      toast.success("Exercise added to plan");
      return result;
    },
    [addMutation, planId, invalidate],
  );

  const removeExercise = useCallback(
    async (planExerciseId: number) => {
      const result = await removeMutation.mutateAsync({ planId, planExerciseId });
      invalidate();
      toast.success("Exercise removed from plan");
      return result;
    },
    [removeMutation, planId, invalidate],
  );

  const reorderExercises = useCallback(
    async (planExerciseIds: number[]) => {
      const result = await reorderMutation.mutateAsync({
        planId,
        data: { plan_exercise_ids: planExerciseIds },
      });
      invalidate();
      return result;
    },
    [reorderMutation, planId, invalidate],
  );

  return {
    plan: planQuery.data?.data ?? null,
    isLoading: planQuery.isLoading,
    addExercise,
    removeExercise,
    reorderExercises,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/hooks/use-plan-detail-data.test.tsx`
Expected: 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/workout-plans/hooks/use-plan-detail-data.ts frontend/tests/unit/components/workout-plans/hooks/use-plan-detail-data.test.tsx
git commit -m "feat(plans): add usePlanDetailData hook with tests"
```

---

### Task 9: PlanExerciseRow view

**Files:**
- Create: `frontend/src/components/workout-plans/views/plan-exercise-row.tsx`
- Create: `frontend/tests/unit/components/workout-plans/views/plan-exercise-row.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// frontend/tests/unit/components/workout-plans/views/plan-exercise-row.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PlanExerciseRead } from "@/api/model";

const mockExercise: PlanExerciseRead = {
  id: 10, exercise_id: 100, sort_order: 0,
  exercise_name: "Bench Press", muscle_group_name: "Chest",
};

const baseProps = {
  exercise: mockExercise,
  index: 0,
  isFirst: true,
  isLast: false,
  onMoveUp: vi.fn(),
  onMoveDown: vi.fn(),
  onRemove: vi.fn(),
};

describe("PlanExerciseRow", () => {
  it("renders exercise name", async () => {
    const { default: PlanExerciseRow } = await import("@/components/workout-plans/views/plan-exercise-row");
    render(<PlanExerciseRow {...baseProps} />);
    expect(screen.getByText("Bench Press")).toBeDefined();
  });

  it("renders muscle group name", async () => {
    const { default: PlanExerciseRow } = await import("@/components/workout-plans/views/plan-exercise-row");
    render(<PlanExerciseRow {...baseProps} />);
    expect(screen.getByText("Chest")).toBeDefined();
  });

  it("renders 1-based order number", async () => {
    const { default: PlanExerciseRow } = await import("@/components/workout-plans/views/plan-exercise-row");
    render(<PlanExerciseRow {...baseProps} index={2} />);
    expect(screen.getByText("3")).toBeDefined();
  });

  it("disables move-up button when isFirst", async () => {
    const { default: PlanExerciseRow } = await import("@/components/workout-plans/views/plan-exercise-row");
    render(<PlanExerciseRow {...baseProps} isFirst={true} />);
    expect(screen.getByRole("button", { name: "Move up" })).toHaveProperty("disabled", true);
  });

  it("disables move-down button when isLast", async () => {
    const { default: PlanExerciseRow } = await import("@/components/workout-plans/views/plan-exercise-row");
    render(<PlanExerciseRow {...baseProps} isLast={true} />);
    expect(screen.getByRole("button", { name: "Move down" })).toHaveProperty("disabled", true);
  });

  it("calls onRemove when remove button is clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { default: PlanExerciseRow } = await import("@/components/workout-plans/views/plan-exercise-row");
    render(<PlanExerciseRow {...baseProps} onRemove={onRemove} />);
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalled();
  });

  it("calls onMoveDown when move-down is clicked", async () => {
    const user = userEvent.setup();
    const onMoveDown = vi.fn();
    const { default: PlanExerciseRow } = await import("@/components/workout-plans/views/plan-exercise-row");
    render(<PlanExerciseRow {...baseProps} isFirst={false} isLast={false} onMoveDown={onMoveDown} />);
    await user.click(screen.getByRole("button", { name: "Move down" }));
    expect(onMoveDown).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/views/plan-exercise-row.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement PlanExerciseRow**

```tsx
// frontend/src/components/workout-plans/views/plan-exercise-row.tsx
import { ChevronUp, ChevronDown, X } from "lucide-react";
import { Button } from "@/ui/button";
import type { PlanExerciseRowProps } from "../types";

const PlanExerciseRow = ({
  exercise, index, isFirst, isLast,
  onMoveUp, onMoveDown, onRemove,
}: PlanExerciseRowProps) => {
  return (
    <div className="card-row">
      <div className="flex flex-col gap-0.5">
        <Button variant="ghost" size="icon-xs" disabled={isFirst} onClick={onMoveUp} aria-label="Move up">
          <ChevronUp className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-xs" disabled={isLast} onClick={onMoveDown} aria-label="Move down">
          <ChevronDown className="size-3.5" />
        </Button>
      </div>
      <span className="w-5 text-center text-xs font-bold text-muted-foreground/40">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{exercise.exercise_name}</div>
        <div className="text-xs text-muted-foreground">{exercise.muscle_group_name}</div>
      </div>
      <Button variant="ghost" size="icon-xs" onClick={onRemove} aria-label="Remove"
        className="text-muted-foreground hover:text-destructive">
        <X className="size-3.5" />
      </Button>
    </div>
  );
};

PlanExerciseRow.displayName = "PlanExerciseRow";
export default PlanExerciseRow;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/views/plan-exercise-row.test.tsx`
Expected: 7 PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/workout-plans/views/plan-exercise-row.tsx frontend/tests/unit/components/workout-plans/views/plan-exercise-row.test.tsx
git commit -m "feat(plans): add PlanExerciseRow view with tests"
```

---

### Task 10: PlanDetailPage view

**Files:**
- Create: `frontend/src/components/workout-plans/views/plan-detail-page.tsx`
- Create: `frontend/tests/unit/components/workout-plans/views/plan-detail-page.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// frontend/tests/unit/components/workout-plans/views/plan-detail-page.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { WorkoutPlanRead } from "@/api/model";

const mockPlan: WorkoutPlanRead = {
  id: 1, name: "Push Day", is_active: true,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  exercises: [
    { id: 10, exercise_id: 100, sort_order: 0, exercise_name: "Bench Press", muscle_group_name: "Chest" },
    { id: 11, exercise_id: 101, sort_order: 1, exercise_name: "OHP", muscle_group_name: "Shoulders" },
  ],
};

const baseProps = {
  plan: mockPlan,
  isLoading: false,
  onEditPlan: vi.fn(),
  onDeletePlan: vi.fn(),
  onAddExercise: vi.fn(),
  onRemoveExercise: vi.fn(),
  onMoveExercise: vi.fn(),
  onBack: vi.fn(),
};

describe("PlanDetailPage", () => {
  it("renders plan name in header", async () => {
    const { default: PlanDetailPage } = await import("@/components/workout-plans/views/plan-detail-page");
    render(<PlanDetailPage {...baseProps} />);
    expect(screen.getByText("Push Day")).toBeDefined();
  });

  it("renders back button that calls onBack", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const { default: PlanDetailPage } = await import("@/components/workout-plans/views/plan-detail-page");
    render(<PlanDetailPage {...baseProps} onBack={onBack} />);
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("renders plan actions menu button", async () => {
    const { default: PlanDetailPage } = await import("@/components/workout-plans/views/plan-detail-page");
    render(<PlanDetailPage {...baseProps} />);
    expect(screen.getByRole("button", { name: "Plan actions" })).toBeDefined();
  });

  it("renders exercise count", async () => {
    const { default: PlanDetailPage } = await import("@/components/workout-plans/views/plan-detail-page");
    render(<PlanDetailPage {...baseProps} />);
    expect(screen.getByText("2 exercises")).toBeDefined();
  });

  it("renders each exercise row", async () => {
    const { default: PlanDetailPage } = await import("@/components/workout-plans/views/plan-detail-page");
    render(<PlanDetailPage {...baseProps} />);
    expect(screen.getByText("Bench Press")).toBeDefined();
    expect(screen.getByText("OHP")).toBeDefined();
  });

  it("renders 'Add Exercise' button", async () => {
    const { default: PlanDetailPage } = await import("@/components/workout-plans/views/plan-detail-page");
    render(<PlanDetailPage {...baseProps} />);
    expect(screen.getByRole("button", { name: /add exercise/i })).toBeDefined();
  });

  it("calls onAddExercise when add button clicked", async () => {
    const user = userEvent.setup();
    const onAddExercise = vi.fn();
    const { default: PlanDetailPage } = await import("@/components/workout-plans/views/plan-detail-page");
    render(<PlanDetailPage {...baseProps} onAddExercise={onAddExercise} />);
    await user.click(screen.getByRole("button", { name: /add exercise/i }));
    expect(onAddExercise).toHaveBeenCalled();
  });

  it("renders empty state when plan has no exercises", async () => {
    const { default: PlanDetailPage } = await import("@/components/workout-plans/views/plan-detail-page");
    const emptyPlan = { ...mockPlan, exercises: [] };
    render(<PlanDetailPage {...baseProps} plan={emptyPlan} />);
    expect(screen.getByText("No exercises yet")).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/views/plan-detail-page.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement PlanDetailPage**

```tsx
// frontend/src/components/workout-plans/views/plan-detail-page.tsx
import { ArrowLeft, Plus, Dumbbell, MoreHorizontal } from "lucide-react";
import { Button } from "@/ui/button";
import { ListEmpty } from "@/ui/list-empty";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/dropdown-menu";
import PlanExerciseRow from "./plan-exercise-row";
import type { PlanDetailPageProps } from "../types";

const PlanDetailPage = ({
  plan, isLoading, onEditPlan, onDeletePlan, onAddExercise, onRemoveExercise, onMoveExercise, onBack,
}: PlanDetailPageProps) => {
  if (isLoading || !plan) {
    return (
      <div className="space-y-2 px-4 pt-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card-row animate-pulse">
            <div className="h-4 w-full rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  const exercises = plan.exercises ?? [];

  return (
    <>
      {/* Header: back + plan name + menu */}
      <div className="flex items-center gap-2 px-4 pb-2 pt-3">
        <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back">
          <ArrowLeft className="size-5" />
        </Button>
        <h2 className="min-w-0 flex-1 truncate text-lg font-semibold">{plan.name}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Plan actions">
              <MoreHorizontal className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEditPlan}>Edit name</DropdownMenuItem>
            <DropdownMenuItem onClick={onDeletePlan} className="text-destructive">Delete plan</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {exercises.length === 0 ? (
        <>
          <ListEmpty
            icon={Dumbbell}
            title="No exercises yet"
            description="Add exercises to build your workout plan"
          />
          <div className="px-4">
            <button
              type="button"
              onClick={onAddExercise}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-border p-3.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:border-primary/20 hover:text-primary"
            >
              <Plus className="size-4" />
              Add Exercise
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="px-6 pb-4 pt-1">
            <p className="text-[13px] font-medium text-muted-foreground">
              {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="space-y-2 px-4 pb-6">
            {exercises.map((exercise, index) => (
              <PlanExerciseRow
                key={exercise.id}
                exercise={exercise}
                index={index}
                isFirst={index === 0}
                isLast={index === exercises.length - 1}
                onMoveUp={() => onMoveExercise(index, index - 1)}
                onMoveDown={() => onMoveExercise(index, index + 1)}
                onRemove={() => onRemoveExercise(exercise.id)}
              />
            ))}
          </div>
          <div className="px-4 pb-6">
            <button
              type="button"
              onClick={onAddExercise}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-border p-3.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:border-primary/20 hover:text-primary"
            >
              <Plus className="size-4" />
              Add Exercise
            </button>
          </div>
        </>
      )}
    </>
  );
};

PlanDetailPage.displayName = "PlanDetailPage";
export default PlanDetailPage;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/views/plan-detail-page.test.tsx`
Expected: 8 PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/workout-plans/views/plan-detail-page.tsx frontend/tests/unit/components/workout-plans/views/plan-detail-page.test.tsx
git commit -m "feat(plans): add PlanDetailPage view with tests"
```

---

### Task 11: Exercise picker (hook + views)

**Files:**
- Create: `frontend/src/components/workout-plans/exercise-picker/hooks/use-exercise-picker.ts`
- Create: `frontend/src/components/workout-plans/exercise-picker/views/exercise-picker-item.tsx`
- Create: `frontend/src/components/workout-plans/exercise-picker/views/exercise-picker-sheet.tsx`
- Create: `frontend/tests/unit/components/workout-plans/exercise-picker/hooks/use-exercise-picker.test.tsx`
- Create: `frontend/tests/unit/components/workout-plans/exercise-picker/views/exercise-picker-item.test.tsx`

- [ ] **Step 1: Write failing tests for useExercisePicker hook**

```tsx
// frontend/tests/unit/components/workout-plans/exercise-picker/hooks/use-exercise-picker.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { ExerciseRead } from "@/api/model";

const mockExercises: ExerciseRead[] = [
  { id: 100, name: "Bench Press", type: "weight", muscle_group_id: 1, is_active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: 101, name: "OHP", type: "weight", muscle_group_id: 2, is_active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: 102, name: "Cable Flies", type: "weight", muscle_group_id: 1, is_active: true, created_at: "2026-01-01T00:00:00Z" },
];

vi.mock("@/api/exercises/exercises", () => ({
  useListExercises: () => ({
    data: { data: mockExercises, status: 200, headers: new Headers() },
    isLoading: false,
  }),
}));

vi.mock("@/api/muscle-groups/muscle-groups", () => ({
  useListMuscleGroups: () => ({
    data: {
      data: [
        { id: 1, name: "Chest", color: "#ef4444", is_active: true, created_at: "2026-01-01T00:00:00Z" },
        { id: 2, name: "Shoulders", color: "#3b82f6", is_active: true, created_at: "2026-01-01T00:00:00Z" },
      ],
      status: 200, headers: new Headers(),
    },
    isLoading: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useExercisePicker", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("groups exercises by muscle group name", async () => {
    const { useExercisePicker } = await import("@/components/workout-plans/exercise-picker/hooks/use-exercise-picker");
    const { result } = renderHook(() => useExercisePicker(new Set()), { wrapper: createWrapper() });
    expect(result.current.groups.length).toBe(2);
    expect(result.current.groups[0].muscleGroupName).toBe("Chest");
    expect(result.current.groups[0].exercises.length).toBe(2);
    expect(result.current.groups[1].muscleGroupName).toBe("Shoulders");
  });

  it("filters exercises by search query", async () => {
    const { useExercisePicker } = await import("@/components/workout-plans/exercise-picker/hooks/use-exercise-picker");
    const { result } = renderHook(() => useExercisePicker(new Set()), { wrapper: createWrapper() });
    act(() => result.current.setSearchQuery("bench"));
    expect(result.current.groups.length).toBe(1);
    expect(result.current.groups[0].exercises.length).toBe(1);
    expect(result.current.groups[0].exercises[0].name).toBe("Bench Press");
  });

  it("toggles exercise selection", async () => {
    const { useExercisePicker } = await import("@/components/workout-plans/exercise-picker/hooks/use-exercise-picker");
    const { result } = renderHook(() => useExercisePicker(new Set()), { wrapper: createWrapper() });
    act(() => result.current.toggleSelection(100));
    expect(result.current.selectedIds.has(100)).toBe(true);
    act(() => result.current.toggleSelection(100));
    expect(result.current.selectedIds.has(100)).toBe(false);
  });

  it("reset clears selection and search", async () => {
    const { useExercisePicker } = await import("@/components/workout-plans/exercise-picker/hooks/use-exercise-picker");
    const { result } = renderHook(() => useExercisePicker(new Set()), { wrapper: createWrapper() });
    act(() => { result.current.toggleSelection(100); result.current.setSearchQuery("bench"); });
    act(() => result.current.reset());
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.searchQuery).toBe("");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/exercise-picker/hooks/use-exercise-picker.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement useExercisePicker hook**

```ts
// frontend/src/components/workout-plans/exercise-picker/hooks/use-exercise-picker.ts
import { useState, useMemo, useCallback } from "react";
import { useListExercises } from "@/api/exercises/exercises";
import { useListMuscleGroups } from "@/api/muscle-groups/muscle-groups";
import type { ExerciseGroup } from "../types";

export function useExercisePicker(alreadyInPlanExerciseIds: Set<number>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());

  const exercisesQuery = useListExercises();
  const muscleGroupsQuery = useListMuscleGroups();

  const allExercises = exercisesQuery.data?.data ?? [];
  const allMuscleGroups = muscleGroupsQuery.data?.data ?? [];

  const mgNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const mg of allMuscleGroups) map.set(mg.id, mg.name);
    return map;
  }, [allMuscleGroups]);

  const groups: ExerciseGroup[] = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = allExercises.filter(
      (ex) => !query || ex.name.toLowerCase().includes(query),
    );

    const byGroup = new Map<string, ExerciseGroup>();
    for (const ex of filtered) {
      const groupName = mgNameById.get(ex.muscle_group_id) ?? "Other";
      if (!byGroup.has(groupName)) {
        byGroup.set(groupName, { muscleGroupName: groupName, exercises: [] });
      }
      byGroup.get(groupName)!.exercises.push(ex);
    }
    return Array.from(byGroup.values());
  }, [allExercises, mgNameById, searchQuery]);

  const toggleSelection = useCallback((exerciseId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSelectedIds(new Set());
    setSearchQuery("");
  }, []);

  return {
    groups,
    selectedIds,
    disabledIds: alreadyInPlanExerciseIds,
    searchQuery,
    setSearchQuery,
    toggleSelection,
    reset,
    isLoading: exercisesQuery.isLoading || muscleGroupsQuery.isLoading,
  };
}
```

- [ ] **Step 4: Run hook tests to verify they pass**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/exercise-picker/hooks/use-exercise-picker.test.tsx`
Expected: 4 PASS.

- [ ] **Step 5: Write failing tests for ExercisePickerItem**

```tsx
// frontend/tests/unit/components/workout-plans/exercise-picker/views/exercise-picker-item.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ExerciseRead } from "@/api/model";

const mockExercise: ExerciseRead = {
  id: 100, name: "Bench Press", type: "weight",
  muscle_group_id: 1, is_active: true, created_at: "2026-01-01T00:00:00Z",
};

describe("ExercisePickerItem", () => {
  it("renders exercise name and type", async () => {
    const { default: ExercisePickerItem } = await import("@/components/workout-plans/exercise-picker/views/exercise-picker-item");
    render(<ExercisePickerItem exercise={mockExercise} isSelected={false} isDisabled={false} onToggle={vi.fn()} />);
    expect(screen.getByText("Bench Press")).toBeDefined();
    expect(screen.getByText("weight")).toBeDefined();
  });

  it("renders initials avatar", async () => {
    const { default: ExercisePickerItem } = await import("@/components/workout-plans/exercise-picker/views/exercise-picker-item");
    render(<ExercisePickerItem exercise={mockExercise} isSelected={false} isDisabled={false} onToggle={vi.fn()} />);
    expect(screen.getByText("BP")).toBeDefined();
  });

  it("calls onToggle when clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const { default: ExercisePickerItem } = await import("@/components/workout-plans/exercise-picker/views/exercise-picker-item");
    render(<ExercisePickerItem exercise={mockExercise} isSelected={false} isDisabled={false} onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: /bench press/i }));
    expect(onToggle).toHaveBeenCalled();
  });

  it("shows 'Already added' and is disabled when already in plan", async () => {
    const { default: ExercisePickerItem } = await import("@/components/workout-plans/exercise-picker/views/exercise-picker-item");
    render(<ExercisePickerItem exercise={mockExercise} isSelected={false} isDisabled={true} onToggle={vi.fn()} />);
    expect(screen.getByText("Already added")).toBeDefined();
    expect(screen.getByRole("button", { name: /bench press/i })).toHaveProperty("disabled", true);
  });
});
```

- [ ] **Step 6: Implement ExercisePickerItem**

```tsx
// frontend/src/components/workout-plans/exercise-picker/views/exercise-picker-item.tsx
import type { ExercisePickerItemProps } from "../types";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const ExercisePickerItem = ({ exercise, isSelected, isDisabled, onToggle }: ExercisePickerItemProps) => {
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onToggle}
      className={`flex w-full items-center gap-3 border-b border-border py-3 text-left ${isDisabled ? "opacity-40" : "cursor-pointer"}`}
    >
      <div className="flex size-9 items-center justify-center rounded-xl border border-primary/15 bg-linear-to-br from-accent to-accent/60 text-[13px] font-bold text-primary">
        {getInitials(exercise.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{exercise.name}</div>
        <div className="text-xs text-muted-foreground">{isDisabled ? "Already added" : exercise.type}</div>
      </div>
      {!isDisabled && (
        <div className={`size-5 flex-shrink-0 rounded-full border-2 ${
          isSelected
            ? "flex items-center justify-center border-primary bg-primary"
            : "border-border"
        }`}>
          {isSelected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="var(--color-background)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      )}
    </button>
  );
};

ExercisePickerItem.displayName = "ExercisePickerItem";
export default ExercisePickerItem;
```

- [ ] **Step 7: Run all exercise picker tests**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/exercise-picker/`
Expected: 8 PASS (4 hook + 4 view).

- [ ] **Step 8: Implement ExercisePickerSheet**

```tsx
// frontend/src/components/workout-plans/exercise-picker/views/exercise-picker-sheet.tsx
import { Button } from "@/ui/button";
import { FormSheet } from "@/ui/form-sheet";
import { Input } from "@/ui/input";
import ExercisePickerItem from "./exercise-picker-item";
import type { ExercisePickerSheetProps } from "../types";

const ExercisePickerSheet = ({
  open, groups, selectedIds, disabledIds, searchQuery, isSubmitting,
  onSearchChange, onToggle, onSubmit, onClose,
}: ExercisePickerSheetProps) => {
  const selectedCount = selectedIds.size;

  return (
    <FormSheet open={open} title="Add Exercise" onClose={onClose}>
      <div className="mb-4">
        <Input
          type="text" placeholder="Search exercises..."
          value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="max-h-[50vh] overflow-y-auto">
        {groups.map((group) => (
          <div key={group.muscleGroupName}>
            <div className="pb-2 pt-3 text-[11px] font-bold uppercase tracking-[1px] text-muted-foreground">
              {group.muscleGroupName}
            </div>
            {group.exercises.map((exercise) => (
              <ExercisePickerItem
                key={exercise.id}
                exercise={exercise}
                isSelected={selectedIds.has(exercise.id)}
                isDisabled={disabledIds.has(exercise.id)}
                onToggle={() => onToggle(exercise.id)}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Button onClick={onSubmit} disabled={selectedCount === 0 || isSubmitting}
          className="h-12 w-full rounded-xl text-[15px] font-bold">
          {isSubmitting ? "Adding..." : `Add ${selectedCount} Exercise${selectedCount !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </FormSheet>
  );
};

ExercisePickerSheet.displayName = "ExercisePickerSheet";
export default ExercisePickerSheet;
```

- [ ] **Step 9: Create barrel export for hooks**

```ts
// frontend/src/components/workout-plans/exercise-picker/hooks/index.ts
export { useExercisePicker } from "./use-exercise-picker";
```

- [ ] **Step 10: Commit**

```bash
git add frontend/src/components/workout-plans/exercise-picker/ frontend/tests/unit/components/workout-plans/exercise-picker/
git commit -m "feat(plans): add exercise picker with hook, item, and sheet views"
```

---

### Task 12: PlanDetailContainer, route, and integration

**Files:**
- Create: `frontend/src/components/workout-plans/plan-detail-container.tsx`
- Create: `frontend/src/routes/plans.$planId.tsx`
- Modify: `frontend/src/routes/__root.tsx` (add plan detail title)

- [ ] **Step 1: Create PlanDetailContainer**

```tsx
// frontend/src/components/workout-plans/plan-detail-container.tsx
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePlanDetailData } from "./hooks/use-plan-detail-data";
import { usePlanForm } from "./hooks/use-plan-form";
import { useExercisePicker } from "./exercise-picker";
import PlanDetailPage from "./views/plan-detail-page";
import PlanFormSheet from "./views/plan-form-sheet";
import { ExercisePickerSheet } from "./exercise-picker";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import {
  useUpdateWorkoutPlan,
  useDeleteWorkoutPlan,
  getListWorkoutPlansQueryKey,
} from "@/api/workout-plans/workout-plans";
import type { PlanExerciseRead } from "@/api/model";
import type { PlanDetailContainerProps } from "./types";

const PlanDetailContainer = ({ planId }: PlanDetailContainerProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const detail = usePlanDetailData(planId);
  const updateMutation = useUpdateWorkoutPlan();
  const deleteMutation = useDeleteWorkoutPlan();
  const form = usePlanForm();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isAddingExercises, setIsAddingExercises] = useState(false);

  const exercises = detail.plan?.exercises ?? [];
  const alreadyInPlanIds = new Set(exercises.map((e: PlanExerciseRead) => e.exercise_id));
  const picker = useExercisePicker(alreadyInPlanIds);

  const handleEditPlan = () => { setSubmitError(null); if (detail.plan) form.openEdit(detail.plan); };
  const handleDeletePlan = () => setDeleteConfirmOpen(true);

  const invalidatePlans = () => {
    queryClient.invalidateQueries({ queryKey: getListWorkoutPlansQueryKey() });
  };

  const handleFormSubmit = async () => {
    setSubmitError(null);
    try {
      if (form.mode === "edit" && form.editingPlan) {
        await updateMutation.mutateAsync({ planId: form.editingPlan.id, data: { name: form.formValues.name } });
        invalidatePlans();
        toast.success("Plan updated");
      }
      form.close();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) setSubmitError("A plan with this name already exists");
      else setSubmitError("Something went wrong. Please try again.");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync({ planId });
      invalidatePlans();
      toast.success("Plan deleted");
      navigate({ to: "/plans" });
    } catch {
      setSubmitError("Failed to delete plan.");
    }
  };

  const handleAddExercise = () => { picker.reset(); setPickerOpen(true); };

  const handlePickerSubmit = async () => {
    setIsAddingExercises(true);
    try {
      const currentCount = exercises.length;
      const ids = Array.from(picker.selectedIds);
      await Promise.all(
        ids.map((id, i) => detail.addExercise(id, currentCount + i)),
      );
      setPickerOpen(false);
      picker.reset();
    } finally {
      setIsAddingExercises(false);
    }
  };

  const handleRemoveExercise = async (planExerciseId: number) => {
    await detail.removeExercise(planExerciseId);
  };

  const handleMoveExercise = async (fromIndex: number, toIndex: number) => {
    const ids = exercises.map((e: PlanExerciseRead) => e.id);
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved);
    await detail.reorderExercises(ids);
  };

  return (
    <>
      <PlanDetailPage
        plan={detail.plan}
        isLoading={detail.isLoading}
        onEditPlan={handleEditPlan}
        onDeletePlan={handleDeletePlan}
        onAddExercise={handleAddExercise}
        onRemoveExercise={handleRemoveExercise}
        onMoveExercise={handleMoveExercise}
        onBack={() => navigate({ to: "/plans" })}
      />
      <PlanFormSheet
        mode={form.mode}
        open={form.mode !== "closed"}
        values={form.formValues}
        isSubmitting={updateMutation.isPending}
        error={submitError}
        onChange={form.setField}
        onSubmit={handleFormSubmit}
        onClose={form.close}
        onDeleteClick={handleDeletePlan}
      />
      <ExercisePickerSheet
        open={pickerOpen}
        groups={picker.groups}
        selectedIds={picker.selectedIds}
        disabledIds={picker.disabledIds}
        searchQuery={picker.searchQuery}
        isLoading={picker.isLoading}
        isSubmitting={isAddingExercises}
        onSearchChange={picker.setSearchQuery}
        onToggle={picker.toggleSelection}
        onSubmit={handlePickerSubmit}
        onClose={() => setPickerOpen(false)}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Plan?"
        description={`"${detail.plan?.name}" will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </>
  );
};

PlanDetailContainer.displayName = "PlanDetailContainer";
export default PlanDetailContainer;
```

- [ ] **Step 2: Create route file**

```tsx
// frontend/src/routes/plans.$planId.tsx
import { createFileRoute } from "@tanstack/react-router";
import { PlanDetailContainer } from "@/components/workout-plans";

export const Route = createFileRoute("/plans/$planId")({
  component: PlanDetailPage,
});

function PlanDetailPage() {
  const { planId } = Route.useParams();
  return <PlanDetailContainer planId={Number(planId)} />;
}
```

- [ ] **Step 3: Add plan detail title to __root.tsx**

In `frontend/src/routes/__root.tsx`, add to the `PAGE_TITLES` object. Use empty string since the plan detail view renders its own header with back button and plan name:

```ts
"/plans/$planId": "",
```

- [ ] **Step 4: Run type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 5: Run all workout plan tests**

Run: `cd frontend && npx vitest run tests/unit/components/workout-plans/`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/workout-plans/plan-detail-container.tsx frontend/src/routes/plans.\$planId.tsx frontend/src/routes/__root.tsx
git commit -m "feat(plans): add PlanDetailContainer, route, and integration"
```

---

### Task 13: Final verification and cleanup

**Files:**
- Verify all barrel exports are up to date

- [ ] **Step 1: Run full frontend lint**

Run: `cd frontend && npx eslint .`
Expected: No errors.

- [ ] **Step 2: Run full frontend type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Run all unit tests**

Run: `cd frontend && npx vitest run`
Expected: All tests PASS, no regressions.

- [ ] **Step 4: Fix any lint/type issues and commit if needed**

```bash
git add -A
git commit -m "fix(plans): resolve lint and type issues"
```
