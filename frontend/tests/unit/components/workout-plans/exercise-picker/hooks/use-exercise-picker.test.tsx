import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { ExerciseRead } from "@/api/model";

const mockExercises: ExerciseRead[] = [
  {
    id: 100,
    name: "Bench Press",
    type: "weight",
    muscle_group_id: 1,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 101,
    name: "OHP",
    type: "weight",
    muscle_group_id: 2,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 102,
    name: "Cable Flies",
    type: "weight",
    muscle_group_id: 1,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
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
        {
          id: 1,
          name: "Chest",
          color: "#ef4444",
          is_active: true,
          created_at: "2026-01-01T00:00:00Z",
        },
        {
          id: 2,
          name: "Shoulders",
          color: "#3b82f6",
          is_active: true,
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
      status: 200,
      headers: new Headers(),
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("groups exercises by muscle group name", async () => {
    const { useExercisePicker } = await import(
      "@/components/workout-plans/exercise-picker/hooks/use-exercise-picker"
    );
    const { result } = renderHook(() => useExercisePicker(new Set()), {
      wrapper: createWrapper(),
    });
    expect(result.current.groups.length).toBe(2);
    expect(result.current.groups[0].muscleGroupName).toBe("Chest");
    expect(result.current.groups[0].exercises.length).toBe(2);
    expect(result.current.groups[1].muscleGroupName).toBe("Shoulders");
  });

  it("filters exercises by search query", async () => {
    const { useExercisePicker } = await import(
      "@/components/workout-plans/exercise-picker/hooks/use-exercise-picker"
    );
    const { result } = renderHook(() => useExercisePicker(new Set()), {
      wrapper: createWrapper(),
    });
    act(() => result.current.setSearchQuery("bench"));
    expect(result.current.groups.length).toBe(1);
    expect(result.current.groups[0].exercises.length).toBe(1);
    expect(result.current.groups[0].exercises[0].name).toBe("Bench Press");
  });

  it("toggles exercise selection", async () => {
    const { useExercisePicker } = await import(
      "@/components/workout-plans/exercise-picker/hooks/use-exercise-picker"
    );
    const { result } = renderHook(() => useExercisePicker(new Set()), {
      wrapper: createWrapper(),
    });
    act(() => result.current.toggleSelection(100));
    expect(result.current.selectedIds.has(100)).toBe(true);
    act(() => result.current.toggleSelection(100));
    expect(result.current.selectedIds.has(100)).toBe(false);
  });

  it("reset clears selection and search", async () => {
    const { useExercisePicker } = await import(
      "@/components/workout-plans/exercise-picker/hooks/use-exercise-picker"
    );
    const { result } = renderHook(() => useExercisePicker(new Set()), {
      wrapper: createWrapper(),
    });
    act(() => {
      result.current.toggleSelection(100);
      result.current.setSearchQuery("bench");
    });
    act(() => result.current.reset());
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.searchQuery).toBe("");
  });
});
