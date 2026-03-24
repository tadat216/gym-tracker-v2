import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UsersPageProps } from "@/components/users/types";
import type { UserRead } from "@/api/model";

vi.mock("@/components/users/views/user-list", () => ({
  UserList: ({ users }: any) => <div data-testid="user-list">{users.length} users</div>,
  UserListSkeleton: () => <div data-testid="user-list-skeleton" />,
}));

vi.mock("@/ui/list-empty", () => ({
  ListEmpty: () => <div data-testid="user-list-empty" />,
}));

vi.mock("@/components/users/views/user-form-sheet", () => ({
  default: () => <div data-testid="user-form-sheet" />,
}));

vi.mock("@/ui/confirm-dialog", () => ({
  ConfirmDialog: () => <div data-testid="confirm-dialog" />,
}));

vi.mock("@/ui/fab", () => ({
  Fab: ({ onClick, label }: any) => <button onClick={onClick}>{label}</button>,
}));

describe("UsersPage", () => {
  const mockUsers: UserRead[] = [
    { id: 1, username: "admin", email: "admin@test.com", is_admin: true, created_at: "2026-01-01T00:00:00Z" },
  ];

  const baseProps: UsersPageProps = {
    users: mockUsers, isLoading: false, formMode: "closed",
    formValues: { username: "", email: "", password: "" },
    editingUser: null, isSubmitting: false, isSelfSelected: false,
    submitError: null, isDeleting: false, deleteConfirmOpen: false,
    onCreateClick: vi.fn(), onUserClick: vi.fn(), onFormChange: vi.fn(),
    onFormSubmit: vi.fn(), onFormClose: vi.fn(), onDeleteClick: vi.fn(),
    onDeleteConfirm: vi.fn(), onDeleteCancel: vi.fn(),
  };

  it("shows skeleton when loading", async () => {
    const { default: UsersPage } = await import("@/components/users/views/users-page");
    render(<UsersPage {...baseProps} isLoading={true} users={[]} />);
    expect(screen.getByTestId("user-list-skeleton")).toBeDefined();
    expect(screen.queryByTestId("user-list")).toBeNull();
  });

  it("shows empty state when no users", async () => {
    const { default: UsersPage } = await import("@/components/users/views/users-page");
    render(<UsersPage {...baseProps} users={[]} />);
    expect(screen.getByTestId("user-list-empty")).toBeDefined();
  });

  it("shows user list when users exist", async () => {
    const { default: UsersPage } = await import("@/components/users/views/users-page");
    render(<UsersPage {...baseProps} />);
    expect(screen.getByTestId("user-list")).toBeDefined();
    expect(screen.getByText("1 users")).toBeDefined();
  });

  it("shows member count in subtitle", async () => {
    const { default: UsersPage } = await import("@/components/users/views/users-page");
    render(<UsersPage {...baseProps} />);
    expect(screen.getByText("1 member")).toBeDefined();
  });

  it("calls onCreateClick when FAB is clicked", async () => {
    const user = userEvent.setup();
    const { default: UsersPage } = await import("@/components/users/views/users-page");
    render(<UsersPage {...baseProps} />);
    await user.click(screen.getByText("Create user"));
    expect(baseProps.onCreateClick).toHaveBeenCalledOnce();
  });
});
