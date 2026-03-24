import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserFormSheetProps } from "@/components/users/types";

describe("UserFormSheet", () => {
  const baseProps: UserFormSheetProps = {
    mode: "create", open: true,
    values: { username: "", email: "", password: "" },
    isSelfSelected: false, isSubmitting: false, error: null,
    onChange: vi.fn(), onSubmit: vi.fn(), onClose: vi.fn(), onDeleteClick: vi.fn(),
  };

  it("shows 'New User' title in create mode", async () => {
    const { default: UserFormSheet } = await import("@/components/users/views/user-form-sheet");
    render(<UserFormSheet {...baseProps} mode="create" />);
    expect(screen.getByText("New User")).toBeDefined();
  });

  it("shows 'Edit User' title in edit mode", async () => {
    const { default: UserFormSheet } = await import("@/components/users/views/user-form-sheet");
    render(<UserFormSheet {...baseProps} mode="edit" />);
    expect(screen.getByText("Edit User")).toBeDefined();
  });

  it("shows 'Create User' button in create mode", async () => {
    const { default: UserFormSheet } = await import("@/components/users/views/user-form-sheet");
    render(<UserFormSheet {...baseProps} mode="create" />);
    expect(screen.getByRole("button", { name: /create user/i })).toBeDefined();
  });

  it("shows 'Save Changes' button in edit mode", async () => {
    const { default: UserFormSheet } = await import("@/components/users/views/user-form-sheet");
    render(<UserFormSheet {...baseProps} mode="edit" />);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDefined();
  });

  it("shows delete button only in edit mode", async () => {
    const { default: UserFormSheet } = await import("@/components/users/views/user-form-sheet");
    const { rerender } = render(<UserFormSheet {...baseProps} mode="create" />);
    expect(screen.queryByRole("button", { name: /delete user/i })).toBeNull();
    rerender(<UserFormSheet {...baseProps} mode="edit" />);
    expect(screen.getByRole("button", { name: /delete user/i })).toBeDefined();
  });

  it("hides delete button when isSelfSelected is true", async () => {
    const { default: UserFormSheet } = await import("@/components/users/views/user-form-sheet");
    render(<UserFormSheet {...baseProps} mode="edit" isSelfSelected={true} />);
    expect(screen.queryByRole("button", { name: /delete user/i })).toBeNull();
  });

  it("calls onChange when typing in username field", async () => {
    const user = userEvent.setup();
    const { default: UserFormSheet } = await import("@/components/users/views/user-form-sheet");
    render(<UserFormSheet {...baseProps} />);
    await user.type(screen.getByLabelText("Username"), "a");
    expect(baseProps.onChange).toHaveBeenCalledWith("username", "a");
  });

  it("calls onSubmit when submit button is clicked", async () => {
    const user = userEvent.setup();
    const { default: UserFormSheet } = await import("@/components/users/views/user-form-sheet");
    render(<UserFormSheet {...baseProps} />);
    await user.click(screen.getByRole("button", { name: /create user/i }));
    expect(baseProps.onSubmit).toHaveBeenCalledOnce();
  });

  it("shows error message when error prop is set", async () => {
    const { default: UserFormSheet } = await import("@/components/users/views/user-form-sheet");
    render(<UserFormSheet {...baseProps} error="Username already taken" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Username already taken");
  });

  it("disables submit button when isSubmitting", async () => {
    const { default: UserFormSheet } = await import("@/components/users/views/user-form-sheet");
    render(<UserFormSheet {...baseProps} isSubmitting={true} />);
    expect(screen.getByRole("button", { name: /saving|creating/i })).toBeDisabled();
  });

  it("shows password placeholder 'Required' in create mode", async () => {
    const { default: UserFormSheet } = await import("@/components/users/views/user-form-sheet");
    render(<UserFormSheet {...baseProps} mode="create" />);
    expect(screen.getByLabelText("Password").getAttribute("placeholder")).toBe("Required");
  });

  it("shows password placeholder for keeping current in edit mode", async () => {
    const { default: UserFormSheet } = await import("@/components/users/views/user-form-sheet");
    render(<UserFormSheet {...baseProps} mode="edit" />);
    expect(screen.getByLabelText("Password").getAttribute("placeholder")).toBe("Leave empty to keep current");
  });
});
