import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { MuscleGroupRead } from "@/api/model";

const mockMutateCreate = vi.fn();
const mockMutateUpdate = vi.fn();
const mockMutateDelete = vi.fn();

const mockGroups: MuscleGroupRead[] = [
  { id: 1, name: "Chest", color: "#ef4444", is_active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: 2, name: "Back", color: "#3b82f6", is_active: true, created_at: "2026-01-02T00:00:00Z" },
];

vi.mock("@/api/muscle-groups/muscle-groups", () => ({
  useListMuscleGroups: () => ({ data: { data: mockGroups, status: 200, headers: new Headers() }, isLoading: false }),
  useCreateMuscleGroup: () => ({ mutateAsync: mockMutateCreate, isPending: false }),
  useUpdateMuscleGroup: () => ({ mutateAsync: mockMutateUpdate, isPending: false }),
  useDeleteMuscleGroup: () => ({ mutateAsync: mockMutateDelete, isPending: false }),
  getListMuscleGroupsQueryKey: () => ["/api/v1/muscle-groups"],
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useMuscleGroupsData", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns muscleGroups from the list query", async () => {
    const { useMuscleGroupsData } = await import("@/components/exercise-library/muscle-groups/hooks/use-muscle-groups-data");
    const { result } = renderHook(() => useMuscleGroupsData(), { wrapper: createWrapper() });
    expect(result.current.muscleGroups).toEqual(mockGroups);
    expect(result.current.isLoading).toBe(false);
  });

  it("createMuscleGroup calls mutateAsync with { data }", async () => {
    mockMutateCreate.mockResolvedValueOnce({ data: mockGroups[0], status: 201 });
    const { useMuscleGroupsData } = await import("@/components/exercise-library/muscle-groups/hooks/use-muscle-groups-data");
    const { result } = renderHook(() => useMuscleGroupsData(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.createMuscleGroup({ name: "Shoulders", color: "#22c55e" });
    });
    expect(mockMutateCreate).toHaveBeenCalledWith({ data: { name: "Shoulders", color: "#22c55e" } });
  });

  it("updateMuscleGroup calls mutateAsync with { muscleGroupId, data }", async () => {
    mockMutateUpdate.mockResolvedValueOnce({ data: mockGroups[0], status: 200 });
    const { useMuscleGroupsData } = await import("@/components/exercise-library/muscle-groups/hooks/use-muscle-groups-data");
    const { result } = renderHook(() => useMuscleGroupsData(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.updateMuscleGroup(1, { name: "Chest Updated" });
    });
    expect(mockMutateUpdate).toHaveBeenCalledWith({ muscleGroupId: 1, data: { name: "Chest Updated" } });
  });

  it("deleteMuscleGroup calls mutateAsync with { muscleGroupId }", async () => {
    mockMutateDelete.mockResolvedValueOnce({ data: { message: "ok" }, status: 200 });
    const { useMuscleGroupsData } = await import("@/components/exercise-library/muscle-groups/hooks/use-muscle-groups-data");
    const { result } = renderHook(() => useMuscleGroupsData(), { wrapper: createWrapper() });
    await act(async () => { await result.current.deleteMuscleGroup(2); });
    expect(mockMutateDelete).toHaveBeenCalledWith({ muscleGroupId: 2 });
  });
});
