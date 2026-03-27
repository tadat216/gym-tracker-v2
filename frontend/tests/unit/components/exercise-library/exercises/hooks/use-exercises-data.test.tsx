import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { ExerciseRead } from "@/api/model";

const mockMutateCreate = vi.fn();
const mockMutateUpdate = vi.fn();
const mockMutateDelete = vi.fn();

const mockExercises: ExerciseRead[] = [
  { id: 1, name: "Bench Press", type: "weight", muscle_group_id: 1, is_active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: 2, name: "Squat", type: "weight", muscle_group_id: 2, is_active: true, created_at: "2026-01-02T00:00:00Z" },
];

vi.mock("@/api/exercises/exercises", () => ({
  useListExercises: () => ({ data: { data: mockExercises, status: 200, headers: new Headers() }, isLoading: false }),
  useCreateExercise: () => ({ mutateAsync: mockMutateCreate, isPending: false }),
  useUpdateExercise: () => ({ mutateAsync: mockMutateUpdate, isPending: false }),
  useDeleteExercise: () => ({ mutateAsync: mockMutateDelete, isPending: false }),
  getListExercisesQueryKey: () => ["/api/v1/exercises"],
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useExercisesData", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns exercises from the list query", async () => {
    const { useExercisesData } = await import("@/components/exercise-library/exercises/hooks/use-exercises-data");
    const { result } = renderHook(() => useExercisesData(1), { wrapper: createWrapper() });
    expect(result.current.exercises).toEqual(mockExercises);
    expect(result.current.isLoading).toBe(false);
  });

  it("createExercise calls mutateAsync with { data }", async () => {
    mockMutateCreate.mockResolvedValueOnce({ data: mockExercises[0], status: 201 });
    const { useExercisesData } = await import("@/components/exercise-library/exercises/hooks/use-exercises-data");
    const { result } = renderHook(() => useExercisesData(1), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.createExercise({ name: "Deadlift", type: "weight", muscle_group_id: 1 });
    });
    expect(mockMutateCreate).toHaveBeenCalledWith({ data: { name: "Deadlift", type: "weight", muscle_group_id: 1 } });
  });

  it("updateExercise calls mutateAsync with { exerciseId, data }", async () => {
    mockMutateUpdate.mockResolvedValueOnce({ data: mockExercises[0], status: 200 });
    const { useExercisesData } = await import("@/components/exercise-library/exercises/hooks/use-exercises-data");
    const { result } = renderHook(() => useExercisesData(1), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.updateExercise(1, { name: "Bench Press Updated" });
    });
    expect(mockMutateUpdate).toHaveBeenCalledWith({ exerciseId: 1, data: { name: "Bench Press Updated" } });
  });

  it("deleteExercise calls mutateAsync with { exerciseId }", async () => {
    mockMutateDelete.mockResolvedValueOnce({ data: { message: "ok" }, status: 200 });
    const { useExercisesData } = await import("@/components/exercise-library/exercises/hooks/use-exercises-data");
    const { result } = renderHook(() => useExercisesData(1), { wrapper: createWrapper() });
    await act(async () => { await result.current.deleteExercise(2); });
    expect(mockMutateDelete).toHaveBeenCalledWith({ exerciseId: 2 });
  });
});
