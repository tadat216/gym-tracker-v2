import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UserRead } from "@/api/model";

describe("UserList", () => {
  const mockUsers: UserRead[] = [
    { id: 1, username: "admin", email: "admin@test.com", is_admin: true, created_at: "2026-01-01T00:00:00Z" },
    { id: 2, username: "john", email: "john@test.com", is_admin: false, created_at: "2026-01-02T00:00:00Z" },
  ];

  it("renders one row per user", async () => {
    const { default: UserList } = await import("@/components/users/views/user-list/user-list");
    render(<UserList users={mockUsers} onUserClick={vi.fn()} />);
    expect(screen.getByText("admin")).toBeDefined();
    expect(screen.getByText("john")).toBeDefined();
  });
});
