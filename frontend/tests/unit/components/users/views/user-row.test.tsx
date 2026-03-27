import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UserRead } from "@/api/model";

describe("UserRow", () => {
  const mockUser: UserRead = {
    id: 1, username: "john_doe", email: "john@example.com",
    is_admin: false, created_at: "2026-01-01T00:00:00Z",
  };
  const adminUser: UserRead = { ...mockUser, id: 2, username: "admin", is_admin: true };
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  it("renders username and email", async () => {
    const { default: UserRow } = await import("@/components/users/views/user-list/user-row");
    render(<UserRow user={mockUser} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText("john_doe")).toBeDefined();
    expect(screen.getByText("john@example.com")).toBeDefined();
  });

  it("renders avatar with first letter of username", async () => {
    const { default: UserRow } = await import("@/components/users/views/user-list/user-row");
    render(<UserRow user={mockUser} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText("J")).toBeDefined();
  });

  it("shows admin badge when user is admin", async () => {
    const { default: UserRow } = await import("@/components/users/views/user-list/user-row");
    render(<UserRow user={adminUser} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText("Admin")).toBeDefined();
  });

  it("hides admin badge when user is not admin", async () => {
    const { default: UserRow } = await import("@/components/users/views/user-list/user-row");
    render(<UserRow user={mockUser} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.queryByText("Admin")).toBeNull();
  });

  it("renders actions menu button", async () => {
    const { default: UserRow } = await import("@/components/users/views/user-list/user-row");
    render(<UserRow user={mockUser} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByRole("button", { name: "Actions" })).toBeDefined();
  });
});
