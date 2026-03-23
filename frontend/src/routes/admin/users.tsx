import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";

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
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-lg font-medium text-muted-foreground">
        Users management coming soon
      </p>
    </div>
  );
}
