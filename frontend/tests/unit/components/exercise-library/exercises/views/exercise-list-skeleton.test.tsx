import { describe, it, expect } from "vitest";
import { render, container as _container } from "@testing-library/react";

describe("ExerciseListSkeleton", () => {
  it("renders 3 skeleton rows", async () => {
    const { default: ExerciseListSkeleton } = await import("@/components/exercise-library/exercises/views/exercise-list/exercise-list-skeleton");
    const { container } = render(<ExerciseListSkeleton />);
    const pulseElements = container.querySelectorAll(".animate-pulse");
    // 2 animate-pulse divs per row × 3 rows = 6
    expect(pulseElements.length).toBe(6);
  });
});
