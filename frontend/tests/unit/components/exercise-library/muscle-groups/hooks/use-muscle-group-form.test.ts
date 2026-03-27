import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { MuscleGroupRead } from "@/api/model";

describe("useMuscleGroupForm", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const mockGroup: MuscleGroupRead = {
    id: 1, name: "Chest", color: "#ef4444", is_active: true, created_at: "2026-01-01T00:00:00Z",
  };

  it("starts in closed mode with default values", async () => {
    const { useMuscleGroupForm } = await import("@/components/exercise-library/muscle-groups/hooks/use-muscle-group-form");
    const { result } = renderHook(() => useMuscleGroupForm());
    expect(result.current.mode).toBe("closed");
    expect(result.current.formValues).toEqual({ name: "", color: "#3b82f6" });
    expect(result.current.editingMuscleGroup).toBeNull();
  });

  it("openCreate sets mode to create and resets fields", async () => {
    const { useMuscleGroupForm } = await import("@/components/exercise-library/muscle-groups/hooks/use-muscle-group-form");
    const { result } = renderHook(() => useMuscleGroupForm());
    act(() => result.current.openCreate());
    expect(result.current.mode).toBe("create");
    expect(result.current.formValues).toEqual({ name: "", color: "#3b82f6" });
    expect(result.current.editingMuscleGroup).toBeNull();
  });

  it("openEdit sets mode to edit and pre-fills name and color from group", async () => {
    const { useMuscleGroupForm } = await import("@/components/exercise-library/muscle-groups/hooks/use-muscle-group-form");
    const { result } = renderHook(() => useMuscleGroupForm());
    act(() => result.current.openEdit(mockGroup));
    expect(result.current.mode).toBe("edit");
    expect(result.current.formValues).toEqual({ name: "Chest", color: "#ef4444" });
    expect(result.current.editingMuscleGroup).toEqual(mockGroup);
  });

  it("setField updates a single field", async () => {
    const { useMuscleGroupForm } = await import("@/components/exercise-library/muscle-groups/hooks/use-muscle-group-form");
    const { result } = renderHook(() => useMuscleGroupForm());
    act(() => result.current.openCreate());
    act(() => result.current.setField("name", "Biceps"));
    expect(result.current.formValues.name).toBe("Biceps");
    expect(result.current.formValues.color).toBe("#3b82f6");
  });

  it("close resets to closed mode and clears all fields", async () => {
    const { useMuscleGroupForm } = await import("@/components/exercise-library/muscle-groups/hooks/use-muscle-group-form");
    const { result } = renderHook(() => useMuscleGroupForm());
    act(() => result.current.openEdit(mockGroup));
    act(() => result.current.close());
    expect(result.current.mode).toBe("closed");
    expect(result.current.formValues).toEqual({ name: "", color: "#3b82f6" });
    expect(result.current.editingMuscleGroup).toBeNull();
  });
});
