import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "@/components/login/views";
import type { LoginFormProps } from "@/components/login/types";

describe("LoginForm", () => {
  const defaultProps: LoginFormProps = {
    username: "",
    password: "",
    showPassword: false,
    isLoading: false,
    error: null,
    onUsernameChange: vi.fn(),
    onPasswordChange: vi.fn(),
    onTogglePassword: vi.fn(),
    onSubmit: vi.fn(),
  };

  it("renders username and password fields with labels", () => {
    render(<LoginForm {...defaultProps} />);

    expect(screen.getByLabelText("Username")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
  });

  it("renders password as hidden when showPassword is false", () => {
    render(<LoginForm {...defaultProps} showPassword={false} />);
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("password");
  });

  it("renders password as visible when showPassword is true", () => {
    render(<LoginForm {...defaultProps} showPassword={true} />);
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("text");
  });

  it("displays error message when error prop is set", () => {
    render(<LoginForm {...defaultProps} error="Invalid username or password" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid username or password");
  });

  it("does not display error when error prop is null", () => {
    render(<LoginForm {...defaultProps} error={null} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows loading text and disables button when isLoading is true", () => {
    render(<LoginForm {...defaultProps} isLoading={true} />);

    const button = screen.getByRole("button", { name: /signing in/i });
    expect(button).toBeDisabled();
  });
});
