import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { WorkoutPlanRead } from "@/api/model";

const mockPlan: WorkoutPlanRead = {
  id: 1, name: "Push Day", is_active: true,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  exercises: [
    { id: 10, exercise_id: 100, sort_order: 0, exercise_name: "Bench Press", muscle_group_name: "Chest" },
    { id: 11, exercise_id: 101, sort_order: 1, exercise_name: "OHP", muscle_group_name: "Shoulders" },
    { id: 12, exercise_id: 102, sort_order: 2, exercise_name: "Cable Flies", muscle_group_name: "Chest" },
  ],
};

const emptyPlan: WorkoutPlanRead = {
  id: 2, name: "Empty Plan", is_active: true,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  exercises: [],
};

describe("PlanCard", () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onClick = vi.fn();

  it("renders plan name", async () => {
    const { default: PlanCard } = await import("@/components/workout-plans/views/plan-card");
    render(<PlanCard plan={mockPlan} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />);
    expect(screen.getByText("Push Day")).toBeDefined();
  });

  it("renders exercise count", async () => {
    const { default: PlanCard } = await import("@/components/workout-plans/views/plan-card");
    render(<PlanCard plan={mockPlan} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />);
    expect(screen.getByText("3 exercises")).toBeDefined();
  });

  it("renders exercise names as comma-separated preview", async () => {
    const { default: PlanCard } = await import("@/components/workout-plans/views/plan-card");
    render(<PlanCard plan={mockPlan} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />);
    expect(screen.getByText("Bench Press, OHP, Cable Flies")).toBeDefined();
  });

  it("renders unique muscle group badges", async () => {
    const { default: PlanCard } = await import("@/components/workout-plans/views/plan-card");
    render(<PlanCard plan={mockPlan} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />);
    expect(screen.getByText("Chest")).toBeDefined();
    expect(screen.getByText("Shoulders")).toBeDefined();
  });

  it("shows 'No exercises' when plan has no exercises", async () => {
    const { default: PlanCard } = await import("@/components/workout-plans/views/plan-card");
    render(<PlanCard plan={emptyPlan} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />);
    expect(screen.getByText("No exercises")).toBeDefined();
    expect(screen.getByText("0 exercises")).toBeDefined();
  });

  it("calls onClick when plan name button is clicked", async () => {
    const user = userEvent.setup();
    const { default: PlanCard } = await import("@/components/workout-plans/views/plan-card");
    render(<PlanCard plan={mockPlan} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Push Day" }));
    expect(onClick).toHaveBeenCalled();
  });

  it("renders actions button", async () => {
    const { default: PlanCard } = await import("@/components/workout-plans/views/plan-card");
    render(<PlanCard plan={mockPlan} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />);
    expect(screen.getByRole("button", { name: "Actions" })).toBeDefined();
  });
});
