import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { WorkoutPlanRead } from "@/api/model";

const mockPlans: WorkoutPlanRead[] = [
  {
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
    ],
  },
  {
    id: 2,
    name: "Pull Day",
    is_active: true,
    created_at: "2026-01-02T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
    exercises: [],
  },
];

const baseProps = {
  plans: mockPlans,
  isLoading: false,
  onPlanClick: vi.fn(),
  onPlanEdit: vi.fn(),
  onPlanDelete: vi.fn(),
  onCreateClick: vi.fn(),
};

describe("PlansPage", () => {
  it("renders plan count", async () => {
    const { default: PlansPage } = await import(
      "@/components/workout-plans/views/plans-page"
    );
    render(<PlansPage {...baseProps} />);
    expect(screen.getByText("2 plans")).toBeDefined();
  });

  it("renders each plan card", async () => {
    const { default: PlansPage } = await import(
      "@/components/workout-plans/views/plans-page"
    );
    render(<PlansPage {...baseProps} />);
    expect(screen.getByText("Push Day")).toBeDefined();
    expect(screen.getByText("Pull Day")).toBeDefined();
  });

  it("renders empty state when no plans", async () => {
    const { default: PlansPage } = await import(
      "@/components/workout-plans/views/plans-page"
    );
    render(<PlansPage {...baseProps} plans={[]} />);
    expect(screen.getByText("No workout plans yet")).toBeDefined();
  });

  it("renders skeletons when loading", async () => {
    const { default: PlansPage } = await import(
      "@/components/workout-plans/views/plans-page"
    );
    const { container } = render(<PlansPage {...baseProps} isLoading={true} plans={[]} />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(3);
  });
});
