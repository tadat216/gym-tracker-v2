import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PlanExerciseRead } from "@/api/model";

const mockExercise: PlanExerciseRead = {
  id: 10,
  exercise_id: 100,
  sort_order: 0,
  exercise_name: "Bench Press",
  muscle_group_name: "Chest",
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
    const { default: PlanExerciseRow } = await import(
      "@/components/workout-plans/views/plan-exercise-row"
    );
    render(<PlanExerciseRow {...baseProps} />);
    expect(screen.getByText("Bench Press")).toBeDefined();
  });

  it("renders muscle group name", async () => {
    const { default: PlanExerciseRow } = await import(
      "@/components/workout-plans/views/plan-exercise-row"
    );
    render(<PlanExerciseRow {...baseProps} />);
    expect(screen.getByText("Chest")).toBeDefined();
  });

  it("renders 1-based order number", async () => {
    const { default: PlanExerciseRow } = await import(
      "@/components/workout-plans/views/plan-exercise-row"
    );
    render(<PlanExerciseRow {...baseProps} index={2} />);
    expect(screen.getByText("3")).toBeDefined();
  });

  it("disables move-up button when isFirst", async () => {
    const { default: PlanExerciseRow } = await import(
      "@/components/workout-plans/views/plan-exercise-row"
    );
    render(<PlanExerciseRow {...baseProps} isFirst={true} />);
    expect(screen.getByRole("button", { name: "Move up" })).toHaveProperty("disabled", true);
  });

  it("disables move-down button when isLast", async () => {
    const { default: PlanExerciseRow } = await import(
      "@/components/workout-plans/views/plan-exercise-row"
    );
    render(<PlanExerciseRow {...baseProps} isLast={true} />);
    expect(screen.getByRole("button", { name: "Move down" })).toHaveProperty("disabled", true);
  });

  it("calls onRemove when remove button is clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { default: PlanExerciseRow } = await import(
      "@/components/workout-plans/views/plan-exercise-row"
    );
    render(<PlanExerciseRow {...baseProps} onRemove={onRemove} />);
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalled();
  });

  it("calls onMoveDown when move-down is clicked", async () => {
    const user = userEvent.setup();
    const onMoveDown = vi.fn();
    const { default: PlanExerciseRow } = await import(
      "@/components/workout-plans/views/plan-exercise-row"
    );
    render(<PlanExerciseRow {...baseProps} isFirst={false} isLast={false} onMoveDown={onMoveDown} />);
    await user.click(screen.getByRole("button", { name: "Move down" }));
    expect(onMoveDown).toHaveBeenCalled();
  });
});
