import { createRootRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useAuthStore } from "@/stores/auth-store";
import { useAuth } from "@/hooks/use-auth";

function RootComponent(): React.JSX.Element {
  const { isInitializing } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Show loading spinner while validating token (useGetMe in flight)
  // Skip for /login — no token validation needed there
  if (isInitializing && pathname !== "/login") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  );
}

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const { token } = useAuthStore.getState();
    if (!token && location.pathname !== "/login") {
      throw redirect({ to: "/login" });
    }
  },
  component: RootComponent,
});
