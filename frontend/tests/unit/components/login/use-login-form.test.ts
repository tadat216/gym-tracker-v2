import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

describe("useLoginForm", () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onSubmit with username and password on handleSubmit", async () => {
    const { useLoginForm } = await import("@/components/login/hooks/use-login-form");
    const { result } = renderHook(() => useLoginForm(mockOnSubmit));

    act(() => {
      result.current.setUsername("admin");
      result.current.setPassword("secret123");
    });

    act(() => {
      // Simulate form submit event
      const fakeEvent = { preventDefault: vi.fn() } as any;
      result.current.handleSubmit(fakeEvent);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith("admin", "secret123");
  });

  it("togglePassword flips showPassword", async () => {
    const { useLoginForm } = await import("@/components/login/hooks/use-login-form");
    const { result } = renderHook(() => useLoginForm(mockOnSubmit));

    expect(result.current.showPassword).toBe(false);

    act(() => {
      result.current.togglePassword();
    });

    expect(result.current.showPassword).toBe(true);

    act(() => {
      result.current.togglePassword();
    });

    expect(result.current.showPassword).toBe(false);
  });

  it("handleSubmit calls preventDefault", async () => {
    const { useLoginForm } = await import("@/components/login/hooks/use-login-form");
    const { result } = renderHook(() => useLoginForm(mockOnSubmit));

    const fakeEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(fakeEvent);
    });

    expect(fakeEvent.preventDefault).toHaveBeenCalled();
  });
});
