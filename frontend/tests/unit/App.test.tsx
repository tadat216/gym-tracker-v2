import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "@/routeTree.gen";
import { useAuthStore } from "@/stores/auth-store";

// Mock useAuth to avoid real API calls
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isInitializing: false,
    isLoggingIn: false,
    loginError: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

function renderWithRouter(initialUrl = "/") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("App routing", () => {
  it("redirects to login when not authenticated", async () => {
    useAuthStore.setState({ token: null, user: null });
    renderWithRouter("/");
    expect(await screen.findByLabelText("Username")).toBeDefined();
  });
});
