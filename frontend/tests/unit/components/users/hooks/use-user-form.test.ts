import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { UserRead } from "@/api/model";

describe("useUserForm", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const mockUser: UserRead = {
    id: 1, username: "john_doe", email: "john@example.com",
    is_admin: false, created_at: "2026-01-01T00:00:00Z",
  };

  it("starts in closed mode with empty form values", async () => {
    const { useUserForm } = await import("@/components/users/hooks/use-user-form");
    const { result } = renderHook(() => useUserForm());
    expect(result.current.mode).toBe("closed");
    expect(result.current.formValues).toEqual({ username: "", email: "", password: "" });
    expect(result.current.editingUser).toBeNull();
  });

  it("openCreate sets mode to create and resets fields", async () => {
    const { useUserForm } = await import("@/components/users/hooks/use-user-form");
    const { result } = renderHook(() => useUserForm());
    act(() => result.current.openCreate());
    expect(result.current.mode).toBe("create");
    expect(result.current.formValues).toEqual({ username: "", email: "", password: "" });
  });

  it("openEdit sets mode to edit and pre-fills from user", async () => {
    const { useUserForm } = await import("@/components/users/hooks/use-user-form");
    const { result } = renderHook(() => useUserForm());
    act(() => result.current.openEdit(mockUser));
    expect(result.current.mode).toBe("edit");
    expect(result.current.formValues).toEqual({ username: "john_doe", email: "john@example.com", password: "" });
    expect(result.current.editingUser).toEqual(mockUser);
  });

  it("setField updates a single form field using functional state", async () => {
    const { useUserForm } = await import("@/components/users/hooks/use-user-form");
    const { result } = renderHook(() => useUserForm());
    act(() => result.current.openCreate());
    act(() => result.current.setField("username", "new_user"));
    expect(result.current.formValues.username).toBe("new_user");
    expect(result.current.formValues.email).toBe("");
  });

  it("close resets mode to closed and clears all fields", async () => {
    const { useUserForm } = await import("@/components/users/hooks/use-user-form");
    const { result } = renderHook(() => useUserForm());
    act(() => result.current.openEdit(mockUser));
    act(() => result.current.close());
    expect(result.current.mode).toBe("closed");
    expect(result.current.formValues).toEqual({ username: "", email: "", password: "" });
    expect(result.current.editingUser).toBeNull();
  });
});
