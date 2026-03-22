import { isAxiosError } from "axios";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { useLogin, useGetMe } from "@/api/auth/auth";
import type { UseAuthReturn } from "./types";

export function useAuth(): UseAuthReturn {
  const { token, setToken, clear } = useAuthStore();
  const navigate = useNavigate();

  // Fetch user when token exists — TanStack Query handles caching/refetching
  const { data: meResponse, isLoading: isInitializing } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  const loginMutation = useLogin();

  async function login(username: string, password: string): Promise<void> {
    const response = await loginMutation.mutateAsync({ data: { username, password } });
    setToken(response.data.access_token);
    await navigate({ to: "/" });
  }

  function logout(): void {
    clear();
  }

  const user = meResponse?.data ?? null;

  const err: unknown = loginMutation.error;
  let loginError: string | null = null;
  if (err) {
    loginError =
      isAxiosError(err) && err.response?.status === 401
        ? "Invalid username or password"
        : "Something went wrong. Please try again.";
  }

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isInitializing: !!token && isInitializing,
    isLoggingIn: loginMutation.isPending,
    loginError,
    login,
    logout,
  };
}
