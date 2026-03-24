import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { UserRead } from "@/api/model";

const mockMutateCreate = vi.fn();
const mockMutateUpdate = vi.fn();
const mockMutateDelete = vi.fn();

const mockUsers: UserRead[] = [
  { id: 1, username: "admin", email: "admin@test.com", is_admin: true, created_at: "2026-01-01T00:00:00Z" },
  { id: 2, username: "john", email: "john@test.com", is_admin: false, created_at: "2026-01-02T00:00:00Z" },
];

vi.mock("@/api/users/users", () => ({
  useListUsers: () => ({
    data: { data: mockUsers, status: 200, headers: new Headers() },
    isLoading: false,
  }),
  useCreateUser: () => ({ mutateAsync: mockMutateCreate, isPending: false }),
  useUpdateUser: () => ({ mutateAsync: mockMutateUpdate, isPending: false }),
  useDeleteUser: () => ({ mutateAsync: mockMutateDelete, isPending: false }),
  getListUsersQueryKey: () => ["/api/v1/users"],
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useUsersData", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns users from the list query", async () => {
    const { useUsersData } = await import("@/components/users/hooks/use-users-data");
    const { result } = renderHook(() => useUsersData(), { wrapper: createWrapper() });
    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.isLoading).toBe(false);
  });

  it("exposes createUser that calls the mutation", async () => {
    mockMutateCreate.mockResolvedValueOnce({ data: mockUsers[0], status: 201 });
    const { useUsersData } = await import("@/components/users/hooks/use-users-data");
    const { result } = renderHook(() => useUsersData(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.createUser({ username: "new", email: "new@test.com", password: "pass" });
    });
    expect(mockMutateCreate).toHaveBeenCalledWith({ data: { username: "new", email: "new@test.com", password: "pass" } });
  });

  it("exposes updateUser that calls the mutation with userId and data", async () => {
    mockMutateUpdate.mockResolvedValueOnce({ data: mockUsers[0], status: 200 });
    const { useUsersData } = await import("@/components/users/hooks/use-users-data");
    const { result } = renderHook(() => useUsersData(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.updateUser(1, { username: "updated" });
    });
    expect(mockMutateUpdate).toHaveBeenCalledWith({ userId: 1, data: { username: "updated" } });
  });

  it("exposes deleteUser that calls the mutation with userId", async () => {
    mockMutateDelete.mockResolvedValueOnce({ data: { message: "ok" }, status: 200 });
    const { useUsersData } = await import("@/components/users/hooks/use-users-data");
    const { result } = renderHook(() => useUsersData(), { wrapper: createWrapper() });
    await act(async () => { await result.current.deleteUser(2); });
    expect(mockMutateDelete).toHaveBeenCalledWith({ userId: 2 });
  });
});
