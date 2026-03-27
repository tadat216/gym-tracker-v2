import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ExerciseFormSheetProps } from "@/components/exercise-library/exercises/types";

describe("ExerciseFormSheet", () => {
  const mockGroups = [
    { id: 1, name: "Chest", color: "#ef4444", is_active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: 2, name: "Back", color: "#3b82f6", is_active: true, created_at: "2026-01-02T00:00:00Z" },
  ];

  const baseProps: ExerciseFormSheetProps = {
    mode: "create", open: true,
    values: { name: "", type: "weight", muscleGroupId: 1 },
    muscleGroups: mockGroups,
    isSubmitting: false, error: null,
    onChange: vi.fn(), onSubmit: vi.fn(), onClose: vi.fn(), onDeleteClick: vi.fn(),
  };

  it("shows 'New Exercise' title in create mode", async () => {
    const { default: ExerciseFormSheet } = await import("@/components/exercise-library/exercises/views/exercise-form-sheet");
    render(<ExerciseFormSheet {...baseProps} mode="create" />);
    expect(screen.getByText("New Exercise")).toBeDefined();
  });

  it("shows 'Edit Exercise' title in edit mode", async () => {
    const { default: ExerciseFormSheet } = await import("@/components/exercise-library/exercises/views/exercise-form-sheet");
    render(<ExerciseFormSheet {...baseProps} mode="edit" />);
    expect(screen.getByText("Edit Exercise")).toBeDefined();
  });

  it("shows 'Create Exercise' submit button in create mode", async () => {
    const { default: ExerciseFormSheet } = await import("@/components/exercise-library/exercises/views/exercise-form-sheet");
    render(<ExerciseFormSheet {...baseProps} mode="create" />);
    expect(screen.getByRole("button", { name: /create exercise/i })).toBeDefined();
  });

  it("shows 'Save Changes' submit button in edit mode", async () => {
    const { default: ExerciseFormSheet } = await import("@/components/exercise-library/exercises/views/exercise-form-sheet");
    render(<ExerciseFormSheet {...baseProps} mode="edit" />);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDefined();
  });

  it("shows delete button only in edit mode", async () => {
    const { default: ExerciseFormSheet } = await import("@/components/exercise-library/exercises/views/exercise-form-sheet");
    const { rerender } = render(<ExerciseFormSheet {...baseProps} mode="create" />);
    expect(screen.queryByRole("button", { name: /delete exercise/i })).toBeNull();
    rerender(<ExerciseFormSheet {...baseProps} mode="edit" />);
    expect(screen.getByRole("button", { name: /delete exercise/i })).toBeDefined();
  });

  it("renders type segmented toggle with Weight/Bodyweight/Duration options", async () => {
    const { default: ExerciseFormSheet } = await import("@/components/exercise-library/exercises/views/exercise-form-sheet");
    render(<ExerciseFormSheet {...baseProps} />);
    expect(screen.getByRole("button", { name: "Weight" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Bodyweight" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Duration" })).toBeDefined();
  });

  it("renders muscle group select with group names", async () => {
    const { default: ExerciseFormSheet } = await import("@/components/exercise-library/exercises/views/exercise-form-sheet");
    render(<ExerciseFormSheet {...baseProps} />);
    expect(screen.getByText("Chest")).toBeDefined();
    expect(screen.getByText("Back")).toBeDefined();
  });

  it("calls onChange when typing in name field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { default: ExerciseFormSheet } = await import("@/components/exercise-library/exercises/views/exercise-form-sheet");
    render(<ExerciseFormSheet {...baseProps} onChange={onChange} />);
    await user.type(screen.getByLabelText("Name"), "a");
    expect(onChange).toHaveBeenCalledWith("name", "a");
  });

  it("calls onSubmit when submit button is clicked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { default: ExerciseFormSheet } = await import("@/components/exercise-library/exercises/views/exercise-form-sheet");
    render(<ExerciseFormSheet {...baseProps} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: /create exercise/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("shows error when error prop is set", async () => {
    const { default: ExerciseFormSheet } = await import("@/components/exercise-library/exercises/views/exercise-form-sheet");
    render(<ExerciseFormSheet {...baseProps} error="Name already exists" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Name already exists");
  });

  it("disables submit when isSubmitting", async () => {
    const { default: ExerciseFormSheet } = await import("@/components/exercise-library/exercises/views/exercise-form-sheet");
    render(<ExerciseFormSheet {...baseProps} isSubmitting={true} />);
    expect(screen.getByRole("button", { name: /creating|saving/i })).toBeDisabled();
  });
});
