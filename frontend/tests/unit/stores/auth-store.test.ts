import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/stores/auth-store";

describe("auth-store", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it("starts with null token and null user", () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it("setToken stores the token", () => {
    useAuthStore.getState().setToken("abc123");
    expect(useAuthStore.getState().token).toBe("abc123");
  });

  it("clear resets token and user to null", () => {
    useAuthStore.getState().setToken("abc123");
    useAuthStore.getState().setUser({
      id: 1,
      username: "admin",
      email: "admin@test.com",
      is_admin: true,
      created_at: "2026-01-01T00:00:00Z",
    });

    useAuthStore.getState().clear();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});