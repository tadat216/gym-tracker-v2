import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Fab } from "@/ui/fab";

describe("Fab", () => {
  it("renders with aria-label", () => {
    render(<Fab onClick={vi.fn()} label="Create item" />);
    expect(screen.getByRole("button", { name: "Create item" })).toBeDefined();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Fab onClick={onClick} label="Create item" />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
