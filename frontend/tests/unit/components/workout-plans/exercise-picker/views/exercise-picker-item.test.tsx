import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ExerciseRead } from "@/api/model";

const mockExercise: ExerciseRead = {
  id: 100,
  name: "Bench Press",
  type: "weight",
  muscle_group_id: 1,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

describe("ExercisePickerItem", () => {
  it("renders exercise name and type", async () => {
    const { default: ExercisePickerItem } = await import(
      "@/components/workout-plans/exercise-picker/views/exercise-picker-item"
    );
    render(
      <ExercisePickerItem
        exercise={mockExercise}
        isSelected={false}
        isDisabled={false}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("Bench Press")).toBeDefined();
    expect(screen.getByText("weight")).toBeDefined();
  });

  it("renders initials avatar", async () => {
    const { default: ExercisePickerItem } = await import(
      "@/components/workout-plans/exercise-picker/views/exercise-picker-item"
    );
    render(
      <ExercisePickerItem
        exercise={mockExercise}
        isSelected={false}
        isDisabled={false}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("BP")).toBeDefined();
  });

  it("calls onToggle when clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const { default: ExercisePickerItem } = await import(
      "@/components/workout-plans/exercise-picker/views/exercise-picker-item"
    );
    render(
      <ExercisePickerItem
        exercise={mockExercise}
        isSelected={false}
        isDisabled={false}
        onToggle={onToggle}
      />,
    );
    await user.click(screen.getByRole("button", { name: /bench press/i }));
    expect(onToggle).toHaveBeenCalled();
  });

  it("shows 'Already added' and is disabled when already in plan", async () => {
    const { default: ExercisePickerItem } = await import(
      "@/components/workout-plans/exercise-picker/views/exercise-picker-item"
    );
    render(
      <ExercisePickerItem
        exercise={mockExercise}
        isSelected={false}
        isDisabled={true}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("Already added")).toBeDefined();
    expect(screen.getByRole("button", { name: /bench press/i })).toHaveProperty("disabled", true);
  });
});
