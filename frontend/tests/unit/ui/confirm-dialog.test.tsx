import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "@/ui/confirm-dialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    title: "Delete Item?",
    description: "This cannot be undone.",
    confirmLabel: "Delete",
    isLoading: false,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it("renders title and description", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Delete Item?")).toBeDefined();
    expect(screen.getByText("This cannot be undone.")).toBeDefined();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });

  it("disables confirm button when isLoading", () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} />);
    expect(screen.getByRole("button", { name: /delet/i })).toBeDisabled();
  });

  it("shows loading label when isLoading", () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} loadingLabel="Deleting..." />);
    expect(screen.getByRole("button", { name: /deleting/i })).toBeDefined();
  });
});
