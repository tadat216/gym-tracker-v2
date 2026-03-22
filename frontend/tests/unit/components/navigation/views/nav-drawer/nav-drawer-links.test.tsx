import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import NavDrawerLinks from "@/components/navigation/views/nav-drawer/nav-drawer-links";

describe("NavDrawerLinks", () => {
  const defaultProps = {
    isAdmin: false,
    currentPath: "/",
    onNavigate: vi.fn(),
  };

  it("always shows Home link", () => {
    render(<NavDrawerLinks {...defaultProps} />);
    expect(screen.getByText("Home")).toBeDefined();
  });

  it("shows Users link when isAdmin is true", () => {
    render(<NavDrawerLinks {...defaultProps} isAdmin={true} />);
    expect(screen.getByText("Users")).toBeDefined();
  });

  it("hides Users link when isAdmin is false", () => {
    render(<NavDrawerLinks {...defaultProps} isAdmin={false} />);
    expect(screen.queryByText("Users")).toBeNull();
  });

  it("marks Home as active when currentPath is /", () => {
    render(<NavDrawerLinks {...defaultProps} currentPath="/" />);
    const homeButton = screen.getByRole("button", { name: /home/i });
    expect(homeButton.className).toContain("bg-accent");
  });

  it("marks Users as active when currentPath is /admin/users", () => {
    render(<NavDrawerLinks {...defaultProps} isAdmin={true} currentPath="/admin/users" />);
    const usersButton = screen.getByRole("button", { name: /users/i });
    expect(usersButton.className).toContain("bg-accent");
  });

  it("calls onNavigate when a link is clicked", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<NavDrawerLinks {...defaultProps} onNavigate={onNavigate} />);

    await user.click(screen.getByRole("button", { name: /home/i }));
    expect(onNavigate).toHaveBeenCalledWith("/");
  });
});
