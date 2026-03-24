import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { UsersContainer } from "@/components/users";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: () => {
    const { token, user } = useAuthStore.getState();
    if (!token) {
      throw redirect({ to: "/login" });
    }
    if (!user?.is_admin) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminUsersPage,
});

function AdminUsersPage() {
  return <UsersContainer />;
}
