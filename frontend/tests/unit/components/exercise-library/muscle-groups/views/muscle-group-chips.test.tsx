import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockGroups = [
  { id: 1, name: "Chest", color: "#ef4444", is_active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: 2, name: "Back", color: "#3b82f6", is_active: true, created_at: "2026-01-02T00:00:00Z" },
];

describe("MuscleGroupChips", () => {
  it("renders all muscle group names as buttons", async () => {
    const { default: MuscleGroupChips } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-chips");
    render(
      <MuscleGroupChips
        muscleGroups={mockGroups}
        selectedId={null}
        onSelect={vi.fn()}
        onManageClick={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Chest" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Back" })).toBeDefined();
  });

  it("selected chip has inline background color style", async () => {
    const { default: MuscleGroupChips } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-chips");
    render(
      <MuscleGroupChips
        muscleGroups={mockGroups}
        selectedId={1}
        onSelect={vi.fn()}
        onManageClick={vi.fn()}
      />
    );
    const chestButton = screen.getByRole("button", { name: "Chest" });
    // browsers normalise hex to rgb(); just assert the style attribute is present (non-empty)
    expect(chestButton.getAttribute("style")).toBeTruthy();
    // and the unselected chip has no inline style
    const backButton = screen.getByRole("button", { name: "Back" });
    expect(backButton.getAttribute("style")).toBeNull();
  });

  it("unselected chip has bg-secondary class", async () => {
    const { default: MuscleGroupChips } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-chips");
    render(
      <MuscleGroupChips
        muscleGroups={mockGroups}
        selectedId={1}
        onSelect={vi.fn()}
        onManageClick={vi.fn()}
      />
    );
    const backButton = screen.getByRole("button", { name: "Back" });
    expect(backButton.className).toContain("bg-secondary");
  });

  it("calls onSelect with group id when chip clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { default: MuscleGroupChips } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-chips");
    render(
      <MuscleGroupChips
        muscleGroups={mockGroups}
        selectedId={null}
        onSelect={onSelect}
        onManageClick={vi.fn()}
      />
    );
    await user.click(screen.getByRole("button", { name: "Chest" }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("renders manage button with 'Manage muscle groups' aria-label", async () => {
    const { default: MuscleGroupChips } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-chips");
    render(
      <MuscleGroupChips
        muscleGroups={mockGroups}
        selectedId={null}
        onSelect={vi.fn()}
        onManageClick={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Manage muscle groups" })).toBeDefined();
  });

  it("calls onManageClick when manage button clicked", async () => {
    const user = userEvent.setup();
    const onManageClick = vi.fn();
    const { default: MuscleGroupChips } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-chips");
    render(
      <MuscleGroupChips
        muscleGroups={mockGroups}
        selectedId={null}
        onSelect={vi.fn()}
        onManageClick={onManageClick}
      />
    );
    await user.click(screen.getByRole("button", { name: "Manage muscle groups" }));
    expect(onManageClick).toHaveBeenCalledOnce();
  });
});
