import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { WorkoutPlanRead } from "@/api/model";

const mockPlan: WorkoutPlanRead = {
  id: 1,
  name: "Push Day",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  exercises: [
    {
      id: 10,
      exercise_id: 100,
      sort_order: 0,
      exercise_name: "Bench Press",
      muscle_group_name: "Chest",
    },
    {
      id: 11,
      exercise_id: 101,
      sort_order: 1,
      exercise_name: "OHP",
      muscle_group_name: "Shoulders",
    },
  ],
};

const baseProps = {
  plan: mockPlan,
  isLoading: false,
  onEditPlan: vi.fn(),
  onDeletePlan: vi.fn(),
  onAddExercise: vi.fn(),
  onRemoveExercise: vi.fn(),
  onMoveExercise: vi.fn(),
  onBack: vi.fn(),
};

describe("PlanDetailPage", () => {
  it("renders plan name in header", async () => {
    const { default: PlanDetailPage } = await import(
      "@/components/workout-plans/views/plan-detail-page"
    );
    render(<PlanDetailPage {...baseProps} />);
    expect(screen.getByText("Push Day")).toBeDefined();
  });

  it("renders back button that calls onBack", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const { default: PlanDetailPage } = await import(
      "@/components/workout-plans/views/plan-detail-page"
    );
    render(<PlanDetailPage {...baseProps} onBack={onBack} />);
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("renders plan actions menu button", async () => {
    const { default: PlanDetailPage } = await import(
      "@/components/workout-plans/views/plan-detail-page"
    );
    render(<PlanDetailPage {...baseProps} />);
    expect(screen.getByRole("button", { name: "Plan actions" })).toBeDefined();
  });

  it("renders exercise count", async () => {
    const { default: PlanDetailPage } = await import(
      "@/components/workout-plans/views/plan-detail-page"
    );
    render(<PlanDetailPage {...baseProps} />);
    expect(screen.getByText("2 exercises")).toBeDefined();
  });

  it("renders each exercise row", async () => {
    const { default: PlanDetailPage } = await import(
      "@/components/workout-plans/views/plan-detail-page"
    );
    render(<PlanDetailPage {...baseProps} />);
    expect(screen.getByText("Bench Press")).toBeDefined();
    expect(screen.getByText("OHP")).toBeDefined();
  });

  it("renders 'Add Exercise' button", async () => {
    const { default: PlanDetailPage } = await import(
      "@/components/workout-plans/views/plan-detail-page"
    );
    render(<PlanDetailPage {...baseProps} />);
    expect(screen.getByRole("button", { name: /add exercise/i })).toBeDefined();
  });

  it("calls onAddExercise when add button clicked", async () => {
    const user = userEvent.setup();
    const onAddExercise = vi.fn();
    const { default: PlanDetailPage } = await import(
      "@/components/workout-plans/views/plan-detail-page"
    );
    render(<PlanDetailPage {...baseProps} onAddExercise={onAddExercise} />);
    await user.click(screen.getByRole("button", { name: /add exercise/i }));
    expect(onAddExercise).toHaveBeenCalled();
  });

  it("renders empty state when plan has no exercises", async () => {
    const { default: PlanDetailPage } = await import(
      "@/components/workout-plans/views/plan-detail-page"
    );
    const emptyPlan = { ...mockPlan, exercises: [] };
    render(<PlanDetailPage {...baseProps} plan={emptyPlan} />);
    expect(screen.getByText("No exercises yet")).toBeDefined();
  });
});
