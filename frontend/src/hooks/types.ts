import type { UserRead } from "@/api/model";

export interface UseAuthReturn {
  user: UserRead | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  loginError: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
