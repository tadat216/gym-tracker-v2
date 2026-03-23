import {
  createRootRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useAuthStore } from "@/stores/auth-store";
import { useAuth } from "@/hooks/use-auth";
import { NavigationContainer } from "@/components/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/admin/users": "Users",
};

function RootComponent(): React.JSX.Element {
  const { isInitializing } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoginPage = pathname === "/login";

  // Show loading spinner while validating token (useGetMe in flight)
  // Skip for /login — no token validation needed there
  if (isInitializing && !isLoginPage) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Login page renders standalone — no header or drawer
  if (isLoginPage) {
    return (
      <>
        <Outlet />
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </>
    );
  }

  // Authenticated pages get header + drawer
  const title = PAGE_TITLES[pathname] ?? "Gym Tracker";

  return (
    <>
      <div className="flex min-h-dvh flex-col">
        <NavigationContainer title={title} />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
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
