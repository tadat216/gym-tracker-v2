import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserRead } from "@/api/model";

const mockUsers: UserRead[] = [
  { id: 1, username: "admin", email: "admin@test.com", is_admin: true, created_at: "2026-01-01T00:00:00Z" },
  { id: 2, username: "john", email: "john@test.com", is_admin: false, created_at: "2026-01-02T00:00:00Z" },
];

const mockCreateUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockDeleteUser = vi.fn();

vi.mock("@/components/users/hooks", async () => {
  const actual = await vi.importActual<any>("@/components/users/hooks/use-user-form");
  return {
    useUsersData: () => ({
      users: mockUsers, isLoading: false,
      createUser: mockCreateUser, updateUser: mockUpdateUser, deleteUser: mockDeleteUser,
      isCreating: false, isUpdating: false, isDeleting: false,
    }),
    useUserForm: actual.useUserForm,
  };
});

const mockCurrentUser: UserRead = {
  id: 1, username: "admin", email: "admin@test.com",
  is_admin: true, created_at: "2026-01-01T00:00:00Z",
};

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: mockCurrentUser }),
}));

let capturedProps: any = null;
vi.mock("@/components/users/views", () => ({
  UsersPage: (props: any) => {
    capturedProps = props;
    return (
      <div data-testid="users-page">
        <button onClick={props.onCreateClick}>create</button>
        <button onClick={() => props.onUserClick(mockUsers[1])}>edit-john</button>
        <button onClick={() => props.onUserClick(mockUsers[0])}>edit-admin</button>
      </div>
    );
  },
}));

describe("UsersContainer", () => {
  beforeEach(() => { vi.clearAllMocks(); capturedProps = null; });

  it("renders UsersPage with users data", async () => {
    const { default: UsersContainer } = await import("@/components/users/container");
    render(<UsersContainer />);
    expect(screen.getByTestId("users-page")).toBeDefined();
    expect(capturedProps.users).toEqual(mockUsers);
    expect(capturedProps.isLoading).toBe(false);
  });

  it("opens create form when onCreateClick is called", async () => {
    const user = userEvent.setup();
    const { default: UsersContainer } = await import("@/components/users/container");
    render(<UsersContainer />);
    await user.click(screen.getByText("create"));
    expect(capturedProps.formMode).toBe("create");
  });

  it("opens edit form when onUserClick is called", async () => {
    const user = userEvent.setup();
    const { default: UsersContainer } = await import("@/components/users/container");
    render(<UsersContainer />);
    await user.click(screen.getByText("edit-john"));
    expect(capturedProps.formMode).toBe("edit");
    expect(capturedProps.editingUser).toEqual(mockUsers[1]);
  });

  it("sets isSelfSelected when editing the current user", async () => {
    const user = userEvent.setup();
    const { default: UsersContainer } = await import("@/components/users/container");
    render(<UsersContainer />);
    await user.click(screen.getByText("edit-admin"));
    expect(capturedProps.isSelfSelected).toBe(true);
  });
});
