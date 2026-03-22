import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRead } from "@/api/model";

interface AuthState {
  token: string | null;
  user: UserRead | null;
  setToken: (token: string | null) => void;
  setUser: (user: UserRead | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: "auth-store" },
  ),
);
