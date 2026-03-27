import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ExerciseRead } from "@/api/model";

describe("useExerciseForm", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const mockExercise: ExerciseRead = {
    id: 1, name: "Bench Press", type: "weight", muscle_group_id: 1, is_active: true, created_at: "2026-01-01T00:00:00Z",
  };

  it("starts in closed mode with default values", async () => {
    const { useExerciseForm } = await import("@/components/exercise-library/exercises/hooks/use-exercise-form");
    const { result } = renderHook(() => useExerciseForm());
    expect(result.current.mode).toBe("closed");
    expect(result.current.formValues).toEqual({ name: "", type: "weight", muscleGroupId: null });
    expect(result.current.editingExercise).toBeNull();
  });

  it("openCreate sets mode to create with pre-filled muscleGroupId", async () => {
    const { useExerciseForm } = await import("@/components/exercise-library/exercises/hooks/use-exercise-form");
    const { result } = renderHook(() => useExerciseForm());
    act(() => result.current.openCreate(2));
    expect(result.current.mode).toBe("create");
    expect(result.current.formValues).toEqual({ name: "", type: "weight", muscleGroupId: 2 });
    expect(result.current.editingExercise).toBeNull();
  });

  it("openEdit sets mode to edit with name, type, muscleGroupId from exercise", async () => {
    const { useExerciseForm } = await import("@/components/exercise-library/exercises/hooks/use-exercise-form");
    const { result } = renderHook(() => useExerciseForm());
    act(() => result.current.openEdit(mockExercise));
    expect(result.current.mode).toBe("edit");
    expect(result.current.formValues).toEqual({ name: "Bench Press", type: "weight", muscleGroupId: 1 });
    expect(result.current.editingExercise).toEqual(mockExercise);
  });

  it("setField updates a single field", async () => {
    const { useExerciseForm } = await import("@/components/exercise-library/exercises/hooks/use-exercise-form");
    const { result } = renderHook(() => useExerciseForm());
    act(() => result.current.openCreate(1));
    act(() => result.current.setField("name", "Squat"));
    expect(result.current.formValues.name).toBe("Squat");
    expect(result.current.formValues.type).toBe("weight");
  });

  it("setField with muscleGroupId stores value as number", async () => {
    const { useExerciseForm } = await import("@/components/exercise-library/exercises/hooks/use-exercise-form");
    const { result } = renderHook(() => useExerciseForm());
    act(() => result.current.openCreate(1));
    act(() => result.current.setField("muscleGroupId", "3"));
    expect(result.current.formValues.muscleGroupId).toBe(3);
  });

  it("close resets to closed mode and clears all fields", async () => {
    const { useExerciseForm } = await import("@/components/exercise-library/exercises/hooks/use-exercise-form");
    const { result } = renderHook(() => useExerciseForm());
    act(() => result.current.openEdit(mockExercise));
    act(() => result.current.close());
    expect(result.current.mode).toBe("closed");
    expect(result.current.formValues).toEqual({ name: "", type: "weight", muscleGroupId: null });
    expect(result.current.editingExercise).toBeNull();
  });
});
