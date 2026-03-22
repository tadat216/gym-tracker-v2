import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { UseAuthReturn } from "@/hooks/types";

// Mock useAuth hook
const mockLogin = vi.fn();
const mockUseAuth = vi.fn((): UseAuthReturn => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitializing: false,
  isLoggingIn: false,
  loginError: null,
  login: mockLogin,
  logout: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: (...args: any[]) => mockUseAuth(...args),
}));

describe("Login Container", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form and calls login on submit", async () => {
    const user = userEvent.setup();

    const { LoginContainer } = await import("@/components/login");
    render(<LoginContainer />);

    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(mockLogin).toHaveBeenCalledWith("admin", "secret");
  });

  it("shows error message when login fails", async () => {
    mockUseAuth.mockReturnValueOnce({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitializing: false,
      isLoggingIn: false,
      loginError: "Invalid username or password",
      login: mockLogin,
      logout: vi.fn(),
    } satisfies UseAuthReturn);

    const { LoginContainer } = await import("@/components/login");
    render(<LoginContainer />);

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid username or password");
  });
});
