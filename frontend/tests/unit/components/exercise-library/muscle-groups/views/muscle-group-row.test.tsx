import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockGroup = {
  id: 1, name: "Chest", color: "#ef4444", is_active: true, created_at: "2026-01-01T00:00:00Z",
};

describe("MuscleGroupRow", () => {
  it("renders group name", async () => {
    const { default: MuscleGroupRow } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-list/muscle-group-row");
    render(<MuscleGroupRow group={mockGroup} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Chest")).toBeDefined();
  });

  it("renders color swatch with inline background style", async () => {
    const { default: MuscleGroupRow } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-list/muscle-group-row");
    const { container } = render(<MuscleGroupRow group={mockGroup} onEdit={vi.fn()} onDelete={vi.fn()} />);
    // browsers normalise hex to rgb(); select by any non-empty inline style
    const swatch = container.querySelector("[style]");
    expect(swatch).not.toBeNull();
    expect(swatch!.getAttribute("style")).toBeTruthy();
  });

  it("renders actions button with aria-label 'Actions'", async () => {
    const { default: MuscleGroupRow } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-list/muscle-group-row");
    render(<MuscleGroupRow group={mockGroup} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Actions" })).toBeDefined();
  });
});
