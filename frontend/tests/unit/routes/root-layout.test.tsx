// frontend/tests/unit/routes/root-layout.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock NavigationContainer
vi.mock("@/components/navigation", () => ({
  NavigationContainer: ({ title }: { title: string }) => (
    <div data-testid="navigation-container" data-title={title} />
  ),
}));

// Mock useAuth
let mockIsInitializing = false;
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    isInitializing: mockIsInitializing,
  }),
}));

// Mock TanStack Router
let mockPathname = "/";
vi.mock("@tanstack/react-router", () => ({
  createRootRoute: (opts: { component: React.FC }) => opts,
  Outlet: () => <div data-testid="outlet" />,
  redirect: vi.fn(),
  useRouterState: ({ select }: { select: (s: unknown) => string }) =>
    select({ location: { pathname: mockPathname } }),
}));

// Mock TanStack Router devtools
vi.mock("@tanstack/react-router-devtools", () => ({
  TanStackRouterDevtools: () => null,
}));

// Mock auth store
vi.mock("@/stores/auth-store", () => ({
  useAuthStore: { getState: () => ({ token: "test-token" }) },
}));

// Import after mocks
import { Route } from "@/routes/__root";

const RootComponent = Route.component;

describe("Root layout", () => {
  beforeEach(() => {
    mockIsInitializing = false;
    mockPathname = "/";
  });

  it("renders NavigationContainer on authenticated pages", () => {
    mockPathname = "/";
    render(<RootComponent />);
    expect(screen.getByTestId("navigation-container")).toBeDefined();
  });

  it("passes correct page title for home route", () => {
    mockPathname = "/";
    render(<RootComponent />);
    expect(screen.getByTestId("navigation-container").dataset.title).toBe(
      "Home",
    );
  });

  it("passes correct page title for admin users route", () => {
    mockPathname = "/admin/users";
    render(<RootComponent />);
    expect(screen.getByTestId("navigation-container").dataset.title).toBe(
      "Users",
    );
  });

  it("does not render NavigationContainer on login page", () => {
    mockPathname = "/login";
    render(<RootComponent />);
    expect(screen.queryByTestId("navigation-container")).toBeNull();
    expect(screen.getByTestId("outlet")).toBeDefined();
  });

  it("shows loading state while initializing on authenticated pages", () => {
    mockIsInitializing = true;
    mockPathname = "/";
    render(<RootComponent />);
    expect(screen.getByText("Loading...")).toBeDefined();
    expect(screen.queryByTestId("navigation-container")).toBeNull();
  });

  it("does not show loading state on login page even when initializing", () => {
    mockIsInitializing = true;
    mockPathname = "/login";
    render(<RootComponent />);
    expect(screen.queryByText("Loading...")).toBeNull();
    expect(screen.getByTestId("outlet")).toBeDefined();
  });
});
