import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { WorkoutPlanRead } from "@/api/model";

const mockMutateAdd = vi.fn();
const mockMutateRemove = vi.fn();
const mockMutateReorder = vi.fn();

const mockPlan: WorkoutPlanRead = {
  id: 1,
  name: "Push Day",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns plan from the get query", async () => {
    const { usePlanDetailData } = await import(
      "@/components/workout-plans/hooks/use-plan-detail-data"
    );
    const { result } = renderHook(() => usePlanDetailData(1), {
      wrapper: createWrapper(),
    });
    expect(result.current.plan).toEqual(mockPlan);
    expect(result.current.isLoading).toBe(false);
  });

  it("addExercise calls mutateAsync with planId and data", async () => {
    mockMutateAdd.mockResolvedValueOnce({ data: {}, status: 201 });
    const { usePlanDetailData } = await import(
      "@/components/workout-plans/hooks/use-plan-detail-data"
    );
    const { result } = renderHook(() => usePlanDetailData(1), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      await result.current.addExercise(100, 0);
    });
    expect(mockMutateAdd).toHaveBeenCalledWith({
      planId: 1,
      data: { exercise_id: 100, sort_order: 0 },
    });
  });

  it("removeExercise calls mutateAsync with planId and planExerciseId", async () => {
    mockMutateRemove.mockResolvedValueOnce({ data: { message: "ok" }, status: 200 });
    const { usePlanDetailData } = await import(
      "@/components/workout-plans/hooks/use-plan-detail-data"
    );
    const { result } = renderHook(() => usePlanDetailData(1), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      await result.current.removeExercise(10);
    });
    expect(mockMutateRemove).toHaveBeenCalledWith({ planId: 1, planExerciseId: 10 });
  });

  it("reorderExercises calls mutateAsync with new order", async () => {
    mockMutateReorder.mockResolvedValueOnce({ data: { message: "ok" }, status: 200 });
    const { usePlanDetailData } = await import(
      "@/components/workout-plans/hooks/use-plan-detail-data"
    );
    const { result } = renderHook(() => usePlanDetailData(1), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      await result.current.reorderExercises([11, 10]);
    });
    expect(mockMutateReorder).toHaveBeenCalledWith({
      planId: 1,
      data: { plan_exercise_ids: [11, 10] },
    });
  });
});
