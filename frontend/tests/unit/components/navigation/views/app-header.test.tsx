import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import AppHeader from "@/components/navigation/views/app-header";

describe("AppHeader", () => {
  const defaultProps = {
    title: "Home",
    onMenuClick: vi.fn(),
  };

  it("renders the page title", () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.getByText("Home")).toBeDefined();
  });

  it("renders the menu button", () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.getByRole("button", { name: /open menu/i })).toBeDefined();
  });

  it("calls onMenuClick when menu button is clicked", async () => {
    const onMenuClick = vi.fn();
    const user = userEvent.setup();
    render(<AppHeader {...defaultProps} onMenuClick={onMenuClick} />);

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    expect(onMenuClick).toHaveBeenCalledOnce();
  });
});
