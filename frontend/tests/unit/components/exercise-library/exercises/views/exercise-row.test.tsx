import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ExerciseRead } from "@/api/model";

describe("ExerciseRow", () => {
  const mockExercise: ExerciseRead = {
    id: 1, name: "Bench Press", type: "weight",
    muscle_group_id: 1, is_active: true, created_at: "2026-01-01T00:00:00Z",
  };
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  it("renders exercise name", async () => {
    const { default: ExerciseRow } = await import("@/components/exercise-library/exercises/views/exercise-list/exercise-row");
    render(<ExerciseRow exercise={mockExercise} color="#ef4444" onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText("Bench Press")).toBeDefined();
  });

  it("renders exercise type in a badge", async () => {
    const { default: ExerciseRow } = await import("@/components/exercise-library/exercises/views/exercise-list/exercise-row");
    render(<ExerciseRow exercise={mockExercise} color="#ef4444" onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText("weight")).toBeDefined();
  });

  it("has color bar via borderLeft style with color prop", async () => {
    const { default: ExerciseRow } = await import("@/components/exercise-library/exercises/views/exercise-list/exercise-row");
    const { container } = render(<ExerciseRow exercise={mockExercise} color="#ef4444" onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    const row = container.firstChild as HTMLElement;
    expect(row.style.borderLeft).toContain("3px solid");
  });

  it("renders actions button with aria-label 'Actions'", async () => {
    const { default: ExerciseRow } = await import("@/components/exercise-library/exercises/views/exercise-list/exercise-row");
    render(<ExerciseRow exercise={mockExercise} color="#ef4444" onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByRole("button", { name: "Actions" })).toBeDefined();
  });
});
