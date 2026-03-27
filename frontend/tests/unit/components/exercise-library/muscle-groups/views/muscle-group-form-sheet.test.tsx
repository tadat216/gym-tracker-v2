import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MuscleGroupFormSheetProps } from "@/components/exercise-library/muscle-groups/types";

describe("MuscleGroupFormSheet", () => {
  const baseProps: MuscleGroupFormSheetProps = {
    mode: "create", open: true,
    values: { name: "", color: "#3b82f6" },
    isSubmitting: false, error: null,
    onChange: vi.fn(), onSubmit: vi.fn(), onClose: vi.fn(), onDeleteClick: vi.fn(),
  };

  it("shows 'New Muscle Group' title in create mode", async () => {
    const { default: MuscleGroupFormSheet } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-form-sheet");
    render(<MuscleGroupFormSheet {...baseProps} mode="create" />);
    expect(screen.getByText("New Muscle Group")).toBeDefined();
  });

  it("shows 'Edit Muscle Group' title in edit mode", async () => {
    const { default: MuscleGroupFormSheet } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-form-sheet");
    render(<MuscleGroupFormSheet {...baseProps} mode="edit" />);
    expect(screen.getByText("Edit Muscle Group")).toBeDefined();
  });

  it("shows 'Create Muscle Group' submit button in create mode", async () => {
    const { default: MuscleGroupFormSheet } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-form-sheet");
    render(<MuscleGroupFormSheet {...baseProps} mode="create" />);
    expect(screen.getByRole("button", { name: /create muscle group/i })).toBeDefined();
  });

  it("shows 'Save Changes' submit button in edit mode", async () => {
    const { default: MuscleGroupFormSheet } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-form-sheet");
    render(<MuscleGroupFormSheet {...baseProps} mode="edit" />);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDefined();
  });

  it("shows delete button only in edit mode", async () => {
    const { default: MuscleGroupFormSheet } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-form-sheet");
    const { rerender } = render(<MuscleGroupFormSheet {...baseProps} mode="create" />);
    expect(screen.queryByRole("button", { name: /delete muscle group/i })).toBeNull();
    rerender(<MuscleGroupFormSheet {...baseProps} mode="edit" />);
    expect(screen.getByRole("button", { name: /delete muscle group/i })).toBeDefined();
  });

  it("calls onChange when typing in name field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { default: MuscleGroupFormSheet } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-form-sheet");
    render(<MuscleGroupFormSheet {...baseProps} onChange={onChange} />);
    await user.type(screen.getByLabelText("Name"), "a");
    expect(onChange).toHaveBeenCalledWith("name", "a");
  });

  it("calls onSubmit when submit button clicked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { default: MuscleGroupFormSheet } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-form-sheet");
    render(<MuscleGroupFormSheet {...baseProps} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: /create muscle group/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("shows error when error prop is set", async () => {
    const { default: MuscleGroupFormSheet } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-form-sheet");
    render(<MuscleGroupFormSheet {...baseProps} error="Name already taken" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Name already taken");
  });

  it("disables submit when isSubmitting", async () => {
    const { default: MuscleGroupFormSheet } = await import("@/components/exercise-library/muscle-groups/views/muscle-group-form-sheet");
    render(<MuscleGroupFormSheet {...baseProps} isSubmitting={true} />);
    expect(screen.getByRole("button", { name: /creating|saving/i })).toBeDisabled();
  });
});
