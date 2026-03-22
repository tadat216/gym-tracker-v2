import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";

// Mock the axios custom mutator — Orval hooks call through this
vi.mock("@/lib/axios", () => ({
  api: vi.fn(),
}));

import { api } from "@/lib/axios";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ token: null });
  });

  it("login stores token", async () => {
    // Mock login response, then getMe response (fires after token is set)
    vi.mocked(api)
      .mockResolvedValueOnce({
        data: { access_token: "jwt-token-123", token_type: "bearer" },
        status: 200,
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        data: { id: 1, username: "admin", email: "admin@test.com" },
        status: 200,
        headers: new Headers(),
      });

    const { useAuth } = await import("@/hooks/use-auth");
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.login("admin", "password123");
    });

    expect(useAuthStore.getState().token).toBe("jwt-token-123");

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it("logout clears token", async () => {
    useAuthStore.setState({ token: "existing-token" });

    const { useAuth } = await import("@/hooks/use-auth");
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    act(() => {
      result.current.logout();
    });

    expect(useAuthStore.getState().token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("isAuthenticated is false when token exists but user not yet loaded", async () => {
    useAuthStore.setState({ token: "some-token" });

    // getMe is still loading (never resolves in this test)
    vi.mocked(api).mockReturnValueOnce(new Promise(() => {}));

    const { useAuth } = await import("@/hooks/use-auth");
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.token).toBe("some-token");
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isInitializing).toBe(true);
  });
});
