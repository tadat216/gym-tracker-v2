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
