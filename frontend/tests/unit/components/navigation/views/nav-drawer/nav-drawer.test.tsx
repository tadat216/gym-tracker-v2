import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import NavDrawer from "@/components/navigation/views/nav-drawer/nav-drawer";

vi.mock("@/components/mode-toggle", () => ({
  ModeToggle: () => <div data-testid="mode-toggle" />,
}));

describe("NavDrawer", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    username: "johndoe",
    isAdmin: true,
    currentPath: "/",
    onNavigate: vi.fn(),
  };

  it("renders username and nav links when open", () => {
    render(<NavDrawer {...defaultProps} />);
    expect(screen.getByText("johndoe")).toBeDefined();
    expect(screen.getByText("Home")).toBeDefined();
  });

  it("renders logout button", () => {
    render(<NavDrawer {...defaultProps} />);
    expect(screen.getByRole("button", { name: /log out/i })).toBeDefined();
  });

  it("calls onNavigate with 'logout' when logout is clicked", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<NavDrawer {...defaultProps} onNavigate={onNavigate} />);

    await user.click(screen.getByRole("button", { name: /log out/i }));
    expect(onNavigate).toHaveBeenCalledWith("logout");
  });

  it("shows admin badge and Users link for admin users", () => {
    render(<NavDrawer {...defaultProps} isAdmin={true} />);
    expect(screen.getByText("Admin")).toBeDefined();
    expect(screen.getByText("Users")).toBeDefined();
  });

  it("hides admin badge and Users link for non-admin users", () => {
    render(<NavDrawer {...defaultProps} isAdmin={false} />);
    expect(screen.queryByText("Admin")).toBeNull();
    expect(screen.queryByText("Users")).toBeNull();
  });
});
