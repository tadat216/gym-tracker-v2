import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RowActionMenu } from "@/ui/row-action-menu";

describe("RowActionMenu", () => {
  it("renders a trigger button with Actions aria-label", () => {
    render(<RowActionMenu onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Actions" })).toBeDefined();
  });

  it("shows Edit and Delete menu items when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<RowActionMenu onEdit={vi.fn()} onDelete={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(await screen.findByText("Edit")).toBeDefined();
    expect(await screen.findByText("Delete")).toBeDefined();
  });

  it("calls onEdit when Edit is clicked", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(<RowActionMenu onEdit={onEdit} onDelete={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(await screen.findByText("Edit"));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("calls onDelete when Delete is clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<RowActionMenu onEdit={vi.fn()} onDelete={onDelete} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(await screen.findByText("Delete"));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
