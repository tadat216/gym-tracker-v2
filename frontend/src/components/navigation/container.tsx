import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useDrawer } from "./hooks";
import { AppHeader, NavDrawer } from "./views";
import type { NavigationContainerProps } from "./types";

const NavigationContainer = ({ title }: NavigationContainerProps) => {
  const { user, logout } = useAuth();
  const { isOpen, open, close } = useDrawer();
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  const handleNavigate = (path: string) => {
    if (path === "logout") {
      logout();
      navigate({ to: "/login" });
    } else {
      navigate({ to: path });
    }
    close();
  };

  return (
    <>
      <AppHeader title={title} onMenuClick={open} />
      <NavDrawer
        isOpen={isOpen}
        onClose={close}
        username={user?.username ?? ""}
        isAdmin={user?.is_admin ?? false}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />
    </>
  );
};

NavigationContainer.displayName = "NavigationContainer";
export default NavigationContainer;
