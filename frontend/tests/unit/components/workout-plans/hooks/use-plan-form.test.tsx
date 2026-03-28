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
