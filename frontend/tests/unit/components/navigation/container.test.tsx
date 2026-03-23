import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import NavigationContainer from "@/components/navigation/container";

// Mock useAuth
const mockLogout = vi.fn();
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { username: "admin", is_admin: true },
    logout: mockLogout,
  }),
}));

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  useRouterState: () => "/",
}));

// Mock child views to isolate container logic
vi.mock("@/components/navigation/views", () => ({
  AppHeader: ({ title, onMenuClick }: { title: string; onMenuClick: () => void }) => (
    <div data-testid="app-header" data-title={title}>
      <button onClick={onMenuClick}>menu</button>
    </div>
  ),
  NavDrawer: ({
    isOpen,
    onClose,
    username,
    isAdmin,
    currentPath,
    onNavigate,
  }: {
    isOpen: boolean;
    onClose: () => void;
    username: string;
    isAdmin: boolean;
    currentPath: string;
    onNavigate: (path: string) => void;
  }) => (
    <div
      data-testid="nav-drawer"
      data-open={isOpen}
      data-username={username}
      data-admin={isAdmin}
      data-path={currentPath}
    >
      <button onClick={onClose}>close</button>
      <button onClick={() => onNavigate("/")}>nav-home</button>
      <button onClick={() => onNavigate("logout")}>nav-logout</button>
    </div>
  ),
}));

describe("NavigationContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes title to AppHeader", () => {
    render(<NavigationContainer title="Home" />);
    expect(screen.getByTestId("app-header").dataset.title).toBe("Home");
  });

  it("passes user data to NavDrawer", () => {
    render(<NavigationContainer title="Home" />);
    const drawer = screen.getByTestId("nav-drawer");
    expect(drawer.dataset.username).toBe("admin");
    expect(drawer.dataset.admin).toBe("true");
  });

  it("opens drawer when menu is clicked", async () => {
    const user = userEvent.setup();
    render(<NavigationContainer title="Home" />);

    expect(screen.getByTestId("nav-drawer").dataset.open).toBe("false");
    await user.click(screen.getByText("menu"));
    expect(screen.getByTestId("nav-drawer").dataset.open).toBe("true");
  });

  it("navigates and closes drawer on nav link click", async () => {
    const user = userEvent.setup();
    render(<NavigationContainer title="Home" />);

    await user.click(screen.getByText("menu")); // open first
    await user.click(screen.getByText("nav-home"));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
  });

  it("calls logout and navigates to /login on logout click", async () => {
    const user = userEvent.setup();
    render(<NavigationContainer title="Home" />);

    await user.click(screen.getByText("nav-logout"));
    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" });
  });
});
