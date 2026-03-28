import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const baseProps = {
  mode: "create" as const,
  open: true,
  values: { name: "" },
  isSubmitting: false,
  error: null,
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  onClose: vi.fn(),
  onDeleteClick: vi.fn(),
};

describe("PlanFormSheet", () => {
  it("renders 'New Plan' title in create mode", async () => {
    const { default: PlanFormSheet } = await import(
      "@/components/workout-plans/views/plan-form-sheet"
    );
    render(<PlanFormSheet {...baseProps} />);
    expect(screen.getByText("New Plan")).toBeDefined();
  });

  it("renders 'Edit Plan' title in edit mode", async () => {
    const { default: PlanFormSheet } = await import(
      "@/components/workout-plans/views/plan-form-sheet"
    );
    render(<PlanFormSheet {...baseProps} mode="edit" />);
    expect(screen.getByText("Edit Plan")).toBeDefined();
  });

  it("renders name input with current value", async () => {
    const { default: PlanFormSheet } = await import(
      "@/components/workout-plans/views/plan-form-sheet"
    );
    render(<PlanFormSheet {...baseProps} values={{ name: "Push Day" }} />);
    expect(screen.getByDisplayValue("Push Day")).toBeDefined();
  });

  it("calls onChange when name input changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { default: PlanFormSheet } = await import(
      "@/components/workout-plans/views/plan-form-sheet"
    );
    render(<PlanFormSheet {...baseProps} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("e.g. Push Day, Upper Body..."), "A");
    expect(onChange).toHaveBeenCalledWith("name", "A");
  });

  it("renders submit button with 'Create Plan' in create mode", async () => {
    const { default: PlanFormSheet } = await import(
      "@/components/workout-plans/views/plan-form-sheet"
    );
    render(<PlanFormSheet {...baseProps} />);
    expect(screen.getByRole("button", { name: "Create Plan" })).toBeDefined();
  });

  it("renders submit button with 'Save Changes' in edit mode", async () => {
    const { default: PlanFormSheet } = await import(
      "@/components/workout-plans/views/plan-form-sheet"
    );
    render(<PlanFormSheet {...baseProps} mode="edit" />);
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDefined();
  });

  it("shows delete button only in edit mode", async () => {
    const { default: PlanFormSheet } = await import(
      "@/components/workout-plans/views/plan-form-sheet"
    );
    const { rerender } = render(<PlanFormSheet {...baseProps} mode="create" />);
    expect(screen.queryByRole("button", { name: "Delete Plan" })).toBeNull();
    rerender(<PlanFormSheet {...baseProps} mode="edit" />);
    expect(screen.getByRole("button", { name: "Delete Plan" })).toBeDefined();
  });

  it("displays error message when error prop is set", async () => {
    const { default: PlanFormSheet } = await import(
      "@/components/workout-plans/views/plan-form-sheet"
    );
    render(
      <PlanFormSheet {...baseProps} error="A plan with this name already exists" />,
    );
    expect(screen.getByText("A plan with this name already exists")).toBeDefined();
  });
});
