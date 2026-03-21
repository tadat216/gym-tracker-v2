# Frontend Login — TDD Tutorial Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first login page with auth state management, following TDD (test-first) methodology.

**Architecture:** Zustand store holds pure client state (token + user). A `useAuth()` hook orchestrates login/logout/initialize using Orval-generated API functions. The login component follows the hooks/types/views/container pattern. Route protection in `__root.tsx` gates the entire app behind authentication.

**Tech Stack:** React 19, TypeScript, Zustand, TanStack Router, TanStack Query, Orval, shadcn/ui (base-nova), Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-03-21-frontend-login-design.md`

---

## File Structure

```
frontend/
├── src/
│   ├── lib/
│   │   └── axios.ts                          # MODIFY — fix fetch-style signature + interceptors
│   ├── stores/
│   │   └── auth-store.ts                     # CREATE — Zustand pure state
│   ├── hooks/
│   │   └── use-auth.ts                       # CREATE — orchestration hook
│   ├── components/
│   │   └── login/
│   │       ├── hooks/
│   │       │   └── index.ts                  # CREATE — re-exports useAuth
│   │       ├── types.ts                      # CREATE — LoginFormProps
│   │       ├── views/
│   │       │   ├── login-form.tsx            # CREATE — pure rendering
│   │       │   └── index.ts                  # CREATE — re-exports views
│   │       ├── container.tsx                 # CREATE — bridges hooks → views
│   │       └── index.ts                      # CREATE — public API
│   ├── routes/
│   │   ├── __root.tsx                        # MODIFY — auth gate
│   │   └── login.tsx                         # CREATE — thin route wrapper
│   └── App.tsx                               # DELETE — dead code
├── tests/
│   └── unit/
│       ├── stores/
│       │   └── auth-store.test.ts            # CREATE
│       ├── hooks/
│       │   └── use-auth.test.tsx             # CREATE
│       ├── components/
│       │   └── login/
│       │       ├── login-form.test.tsx        # CREATE
│       │       └── container.test.tsx         # CREATE
│       └── App.test.tsx                       # MODIFY — update for auth
```

---

## How TDD Works (Read This First!)

TDD follows a strict **Red → Green → Refactor** cycle:

1. **Red:** Write a test that describes the behavior you want. Run it. It MUST fail. This proves your test is actually testing something.
2. **Green:** Write the *minimum* code to make the test pass. No extra logic, no "while I'm here" improvements. Just enough to go green.
3. **Refactor:** Clean up if needed (remove duplication, rename things). Run tests again to make sure they still pass.

**Why this order matters:**
- If you write the code first, you don't know if your test would have caught a bug
- If the test passes before you write code, the test is useless
- Writing minimum code prevents over-engineering

Each task below follows this cycle explicitly. You'll see: write test → see it fail → write code → see it pass.

---

## Task 1: Install Dependencies

**Files:**
- Modify: `frontend/package.json`

- [x] **Step 1: Install zustand and @testing-library/user-event**

```bash
cd frontend && npm install zustand && npm install -D @testing-library/user-event
```

- [x] **Step 2: Set up test infrastructure**

Add the jest-dom setup file. Create `frontend/tests/setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

Update `frontend/vite.config.ts` — change `setupFiles: []` to:

```typescript
setupFiles: ["./tests/setup.ts"],
```

- [x] **Step 3: Verify installation**

```bash
cd frontend && npx vitest run
```

Expected: existing tests still pass.

- [x] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/tests/setup.ts frontend/vite.config.ts
git commit -m "chore(frontend): install zustand, user-event, and configure jest-dom setup"
```

> **Note:** `lucide-react` and shadcn `input`/`label` components are installed in a later task when we need them.

---

## Task 2: Auth Store (Zustand — Pure State)

This is the simplest piece — no API calls, no side effects. Just state + setters. Perfect for your first TDD cycle.

**Files:**
- Create: `frontend/tests/unit/stores/auth-store.test.ts`
- Create: `frontend/src/stores/auth-store.ts`

### TDD Cycle 1: Initial state

- [x] **Step 1: Write the failing test**

Create `frontend/tests/unit/stores/auth-store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../../../src/stores/auth-store";

describe("auth-store", () => {
  beforeEach(() => {
    // Reset store between tests so they don't leak state
    useAuthStore.setState({ token: null, user: null });
  });

  it("starts with null token and null user", () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });
});
```

- [x] **Step 2: Run test — see it fail (RED)**

```bash
cd frontend && npx vitest run tests/unit/stores/auth-store.test.ts
```

Expected: **FAIL** — `Cannot find module '../../../src/stores/auth-store'`

> **TDD lesson:** The test fails because the file doesn't exist yet. That's the "Red" step. We've described what we *want* — now we write code to make it happen.

- [ ] **Step 3: Write minimal implementation (GREEN)**

Create `frontend/src/stores/auth-store.ts`:

```typescript
import { create } from "zustand";
import type { UserRead } from "@/api/model";

interface AuthState {
  token: string | null;
  user: UserRead | null;
  setToken: (token: string | null) => void;
  setUser: (user: UserRead | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  clear: () => set({ token: null, user: null }),
}));
```

- [ ] **Step 4: Run test — see it pass (GREEN)**

```bash
cd frontend && npx vitest run tests/unit/stores/auth-store.test.ts
```

Expected: **PASS**

### TDD Cycle 2: setToken and setUser

- [ ] **Step 5: Add tests for setters**

Add to the `describe` block in `auth-store.test.ts`:

```typescript
  it("setToken stores the token", () => {
    useAuthStore.getState().setToken("abc123");
    expect(useAuthStore.getState().token).toBe("abc123");
  });

  it("setUser stores the user", () => {
    const mockUser = {
      id: 1,
      username: "admin",
      email: "admin@test.com",
      is_admin: true,
      created_at: "2026-01-01T00:00:00Z",
    };
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });
```

- [ ] **Step 6: Run tests — they should pass immediately**

```bash
cd frontend && npx vitest run tests/unit/stores/auth-store.test.ts
```

Expected: **PASS** (all 3 tests)

> **TDD lesson:** These pass immediately because we already wrote `setToken` and `setUser` in Step 3. That's fine — we wrote them because they were obvious. The tests still have value: they document the behavior and catch future regressions.

### TDD Cycle 3: clear()

- [ ] **Step 7: Add test for clear**

Add to the `describe` block:

```typescript
  it("clear resets token and user to null", () => {
    useAuthStore.getState().setToken("abc123");
    useAuthStore.getState().setUser({
      id: 1,
      username: "admin",
      email: "admin@test.com",
      is_admin: true,
      created_at: "2026-01-01T00:00:00Z",
    });

    useAuthStore.getState().clear();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
```

- [ ] **Step 8: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/stores/auth-store.test.ts
```

Expected: **PASS** (all 4 tests)

- [ ] **Step 9: Commit**

```bash
git add frontend/src/stores/auth-store.ts frontend/tests/unit/stores/auth-store.test.ts
git commit -m "feat(frontend): add auth Zustand store with TDD"
```

---

## Task 3: Fix API Mutator (axios.ts)

The current `api` function accepts `(config: AxiosRequestConfig)` but Orval generates calls like `api(url, { method, headers, body })`. This mismatch must be fixed. No TDD here — this is infrastructure glue. We verify correctness via existing tests and the smoke test in Task 10.

**Files:**
- Modify: `frontend/src/lib/axios.ts`

- [ ] **Step 1: Rewrite the api mutator**

Replace the contents of `frontend/src/lib/axios.ts`:

```typescript
import Axios from "axios";
import { useAuthStore } from "@/stores/auth-store";

const axios = Axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor: attach auth token
axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: clear auth on 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (Axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().clear();
      localStorage.removeItem("auth-token");
    }
    return Promise.reject(error);
  },
);

/**
 * Orval custom mutator — translates fetch-style (url, init) to axios.
 * Orval generates: api<T>(url, { method, headers, body, signal })
 */
export const api = <T>(url: string, init?: RequestInit): Promise<T> =>
  axios
    .request<T>({
      url,
      method: init?.method,
      headers: init?.headers as Record<string, string>,
      data: init?.body,
      signal: init?.signal,
    })
    .then((response) => response.data);
```

- [ ] **Step 2: Verify existing tests still pass**

```bash
cd frontend && npx vitest run
```

Expected: **PASS** — all existing tests still work.

- [ ] **Step 3: Run TypeScript check**

```bash
cd frontend && npx tsc -b
```

Expected: no errors. This confirms the new signature is compatible with Orval-generated code.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/axios.ts
git commit -m "feat(frontend): fix api mutator for Orval fetch-style + add interceptors"
```

---

## Task 4: useAuth Hook

This is the most complex piece — it orchestrates the store, Orval-generated functions, and localStorage. We'll build it test by test.

**Files:**
- Create: `frontend/tests/unit/hooks/use-auth.test.tsx`
- Create: `frontend/src/hooks/use-auth.ts`

### TDD Cycle 1: login flow

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/unit/hooks/use-auth.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAuthStore } from "../../../src/stores/auth-store";

// Mock the Orval-generated API functions
vi.mock("../../../src/api/auth/auth", () => ({
  login: vi.fn(),
  getMe: vi.fn(),
  useLogin: vi.fn(),
  getLoginMutationOptions: vi.fn(() => ({
    mutationFn: vi.fn(),
  })),
}));

import { login as apiLogin, getMe as apiGetMe } from "../../../src/api/auth/auth";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ token: null, user: null });
    localStorage.clear();
  });

  it("login stores token and fetches user", async () => {
    const mockUser = {
      id: 1,
      username: "admin",
      email: "admin@test.com",
      is_admin: true,
      created_at: "2026-01-01T00:00:00Z",
    };

    vi.mocked(apiLogin).mockResolvedValueOnce({
      data: { access_token: "jwt-token-123", token_type: "bearer" },
      status: 200,
      headers: new Headers(),
    } as any);

    vi.mocked(apiGetMe).mockResolvedValueOnce({
      data: mockUser,
      status: 200,
      headers: new Headers(),
    } as any);

    const { useAuth } = await import("../../../src/hooks/use-auth");
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.login("admin", "password123");
    });

    expect(useAuthStore.getState().token).toBe("jwt-token-123");
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(localStorage.getItem("auth-token")).toBe("jwt-token-123");
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

- [ ] **Step 2: Run test — see it fail (RED)**

```bash
cd frontend && npx vitest run tests/unit/hooks/use-auth.test.tsx
```

Expected: **FAIL** — `Cannot find module '../../../src/hooks/use-auth'`

- [ ] **Step 3: Write minimal implementation (GREEN)**

Create `frontend/src/hooks/use-auth.ts`:

```typescript
import { useCallback, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import {
  login as apiLogin,
  getMe as apiGetMe,
} from "@/api/auth/auth";

export function useAuth() {
  const { token, user, setToken, setUser, clear } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const loginResponse = await apiLogin({ username, password });
      const accessToken = loginResponse.data.access_token;

      localStorage.setItem("auth-token", accessToken);
      setToken(accessToken);

      const meResponse = await apiGetMe();
      setUser(meResponse.data);
    } finally {
      setIsLoading(false);
    }
  }, [setToken, setUser]);

  const logout = useCallback(() => {
    localStorage.removeItem("auth-token");
    clear();
  }, [clear]);

  const initialize = useCallback(async () => {
    const storedToken = localStorage.getItem("auth-token");
    if (!storedToken) return;

    setToken(storedToken);
    setIsLoading(true);
    try {
      const meResponse = await apiGetMe();
      setUser(meResponse.data);
    } catch {
      // Token is invalid/expired — clean up
      localStorage.removeItem("auth-token");
      clear();
    } finally {
      setIsLoading(false);
    }
  }, [setToken, setUser, clear]);

  return {
    user,
    token,
    isAuthenticated: token !== null,
    isLoading,
    login,
    logout,
    initialize,
  };
}
```

- [ ] **Step 4: Run test — see it pass (GREEN)**

```bash
cd frontend && npx vitest run tests/unit/hooks/use-auth.test.tsx
```

Expected: **PASS**

### TDD Cycle 2: logout

- [ ] **Step 5: Add test for logout**

Add to the `describe` block in `use-auth.test.tsx`:

```tsx
  it("logout clears store and localStorage", async () => {
    // Set up an authenticated state
    useAuthStore.setState({ token: "existing-token", user: { id: 1, username: "admin", email: "a@b.com", is_admin: true, created_at: "" } });
    localStorage.setItem("auth-token", "existing-token");

    const { useAuth } = await import("../../../src/hooks/use-auth");
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    act(() => {
      result.current.logout();
    });

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem("auth-token")).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
```

- [ ] **Step 6: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/hooks/use-auth.test.tsx
```

Expected: **PASS** (both tests)

### TDD Cycle 3: initialize with valid token

- [ ] **Step 7: Add test for initialize**

Add to the `describe` block:

```tsx
  it("initialize restores session from localStorage", async () => {
    const mockUser = {
      id: 1,
      username: "admin",
      email: "admin@test.com",
      is_admin: true,
      created_at: "2026-01-01T00:00:00Z",
    };

    localStorage.setItem("auth-token", "stored-token");

    vi.mocked(apiGetMe).mockResolvedValueOnce({
      data: mockUser,
      status: 200,
      headers: new Headers(),
    } as any);

    const { useAuth } = await import("../../../src/hooks/use-auth");
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.initialize();
    });

    expect(useAuthStore.getState().token).toBe("stored-token");
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });
```

- [ ] **Step 8: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/hooks/use-auth.test.tsx
```

Expected: **PASS** (all 3)

### TDD Cycle 4: initialize with expired/invalid token

- [ ] **Step 9: Add test for failed initialize**

Add to the `describe` block:

```tsx
  it("initialize clears state when token is invalid", async () => {
    localStorage.setItem("auth-token", "expired-token");

    vi.mocked(apiGetMe).mockRejectedValueOnce({
      response: { status: 401 },
    });

    const { useAuth } = await import("../../../src/hooks/use-auth");
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.initialize();
    });

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem("auth-token")).toBeNull();
  });
```

- [ ] **Step 10: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/hooks/use-auth.test.tsx
```

Expected: **PASS** (all 4)

### TDD Cycle 5: initialize with no stored token

- [ ] **Step 11: Add test for initialize with empty localStorage**

Add to the `describe` block:

```tsx
  it("initialize does nothing when no token in localStorage", async () => {
    const { useAuth } = await import("../../../src/hooks/use-auth");
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.initialize();
    });

    expect(apiGetMe).not.toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBeNull();
  });
```

- [ ] **Step 12: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/hooks/use-auth.test.tsx
```

Expected: **PASS** (all 5)

- [ ] **Step 13: Commit**

```bash
git add frontend/src/hooks/use-auth.ts frontend/tests/unit/hooks/use-auth.test.tsx
git commit -m "feat(frontend): add useAuth hook with TDD"
```

---

## Task 5: Add shadcn Input and Label Components

Before building the login form, we need the UI components.

**Files:**
- Create: `frontend/src/ui/input.tsx` (via shadcn CLI)
- Create: `frontend/src/ui/label.tsx` (via shadcn CLI)

- [ ] **Step 1: Add input component**

```bash
cd frontend && npx shadcn@latest add input
```

- [ ] **Step 2: Add label component**

```bash
cd frontend && npx shadcn@latest add label
```

- [ ] **Step 3: Verify components were created**

```bash
ls frontend/src/ui/input.tsx frontend/src/ui/label.tsx
```

Expected: both files exist.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/ui/input.tsx frontend/src/ui/label.tsx
git commit -m "feat(frontend): add shadcn input and label components"
```

---

## Task 6: LoginForm View (Pure Presentational Component)

This is the dumb component — no hooks, just props. Easy to test because we don't need to mock anything.

**Files:**
- Create: `frontend/tests/unit/components/login/login-form.test.tsx`
- Create: `frontend/src/components/login/types.ts`
- Create: `frontend/src/components/login/views/login-form.tsx`
- Create: `frontend/src/components/login/views/index.ts`

### TDD Cycle 1: renders form fields

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/unit/components/login/login-form.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "../../../../src/components/login/views";

describe("LoginForm", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isLoading: false,
    error: null,
  };

  it("renders username and password fields with labels", () => {
    render(<LoginForm {...defaultProps} />);

    expect(screen.getByLabelText(/username/i)).toBeDefined();
    expect(screen.getByLabelText(/password/i)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test — see it fail (RED)**

```bash
cd frontend && npx vitest run tests/unit/components/login/login-form.test.tsx
```

Expected: **FAIL** — module not found.

- [ ] **Step 3: Create types.ts**

Create `frontend/src/components/login/types.ts`:

```typescript
export interface LoginFormProps {
  onSubmit: (username: string, password: string) => void;
  isLoading: boolean;
  error: string | null;
}
```

- [ ] **Step 4: Write minimal LoginForm (GREEN)**

Create `frontend/src/components/login/views/login-form.tsx`:

```tsx
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import type { LoginFormProps } from "../types";

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = form.get("username") as string;
    const password = form.get("password") as string;
    onSubmit(username, password);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold">Login</h1>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="h-12 pr-12 text-base"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 size-11"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="h-12 w-full text-base"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
```

Create `frontend/src/components/login/views/index.ts`:

```typescript
export { LoginForm } from "./login-form";
```

- [ ] **Step 5: Run test — see it pass (GREEN)**

```bash
cd frontend && npx vitest run tests/unit/components/login/login-form.test.tsx
```

Expected: **PASS**

### TDD Cycle 2: password visibility toggle

- [ ] **Step 6: Add test for password toggle**

Add to `login-form.test.tsx`:

```tsx
import userEvent from "@testing-library/user-event";

// Add this test inside the describe block:
  it("toggles password visibility when eye button is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput.getAttribute("type")).toBe("password");

    const toggleButton = screen.getByRole("button", { name: /show password/i });
    await user.click(toggleButton);

    expect(passwordInput.getAttribute("type")).toBe("text");

    const hideButton = screen.getByRole("button", { name: /hide password/i });
    await user.click(hideButton);

    expect(passwordInput.getAttribute("type")).toBe("password");
  });
```

- [ ] **Step 7: Run test — should pass**

```bash
cd frontend && npx vitest run tests/unit/components/login/login-form.test.tsx
```

Expected: **PASS** (both tests)

### TDD Cycle 3: form submission

- [ ] **Step 8: Add test for submit**

Add to the `describe` block:

```tsx
  it("calls onSubmit with username and password", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<LoginForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/username/i), "admin");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(onSubmit).toHaveBeenCalledWith("admin", "secret123");
  });
```

- [ ] **Step 9: Run test — should pass**

```bash
cd frontend && npx vitest run tests/unit/components/login/login-form.test.tsx
```

Expected: **PASS** (all 3)

### TDD Cycle 4: error display

- [ ] **Step 10: Add test for error message**

Add to the `describe` block:

```tsx
  it("displays error message when error prop is set", () => {
    render(<LoginForm {...defaultProps} error="Invalid username or password" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid username or password");
  });

  it("does not display error when error prop is null", () => {
    render(<LoginForm {...defaultProps} error={null} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
```

> **Note:** `toHaveTextContent` and `toBeDisabled` come from `@testing-library/jest-dom`, which we set up in Task 1 (`tests/setup.ts`).

- [ ] **Step 11: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/components/login/login-form.test.tsx
```

Expected: **PASS** (all 5)

### TDD Cycle 5: loading state

- [ ] **Step 12: Add test for loading state**

Add to the `describe` block:

```tsx
  it("shows loading text and disables button when isLoading is true", () => {
    render(<LoginForm {...defaultProps} isLoading={true} />);

    const button = screen.getByRole("button", { name: /signing in/i });
    expect(button).toBeDisabled();
  });
```

- [ ] **Step 13: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/components/login/login-form.test.tsx
```

Expected: **PASS** (all 6)

- [ ] **Step 14: Commit**

```bash
git add frontend/src/components/login/ frontend/tests/unit/components/ frontend/tests/setup.ts frontend/vite.config.ts
git commit -m "feat(frontend): add LoginForm view component with TDD"
```

---

## Task 7: Login Container + Component Wiring

The container calls the `useAuth` hook and passes props to the view. The route file is a thin wrapper.

**Files:**
- Create: `frontend/tests/unit/components/login/container.test.tsx`
- Create: `frontend/src/components/login/container.tsx`
- Create: `frontend/src/components/login/hooks/index.ts`
- Create: `frontend/src/components/login/index.ts`
- Create: `frontend/src/routes/login.tsx`

### TDD Cycle 1: renders LoginForm and handles login

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/unit/components/login/container.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock useAuth hook
const mockLogin = vi.fn();
const mockUseAuth = vi.fn(() => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  login: mockLogin,
  logout: vi.fn(),
  initialize: vi.fn(),
}));

vi.mock("../../../../src/hooks/use-auth", () => ({
  useAuth: (...args: any[]) => mockUseAuth(...args),
}));

// Mock TanStack Router navigate
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

describe("Login Container", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form and calls login on submit", async () => {
    const user = userEvent.setup();

    const { LoginContainer } = await import("../../../../src/components/login/container");
    render(<LoginContainer />);

    await user.type(screen.getByLabelText(/username/i), "admin");
    await user.type(screen.getByLabelText(/password/i), "secret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(mockLogin).toHaveBeenCalledWith("admin", "secret");
  });
});
```

- [ ] **Step 2: Run test — see it fail (RED)**

```bash
cd frontend && npx vitest run tests/unit/components/login/container.test.tsx
```

Expected: **FAIL** — module not found.

- [ ] **Step 3: Write the container (GREEN)**

Create `frontend/src/components/login/container.tsx`:

```tsx
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "./views";

export function LoginContainer() {
  const { login, isLoading: authLoading, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Redirect if already authenticated (useEffect to respect rules of hooks)
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = useCallback(async (username: string, password: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
      navigate({ to: "/" });
    } catch {
      setError("Invalid username or password");
    } finally {
      setIsSubmitting(false);
    }
  }, [login, navigate]);

  if (isAuthenticated) return null;

  return (
    <LoginForm
      onSubmit={handleSubmit}
      isLoading={isSubmitting || authLoading}
      error={error}
    />
  );
}
```

Create `frontend/src/components/login/hooks/index.ts`:

```typescript
export { useAuth } from "@/hooks/use-auth";
```

Create `frontend/src/components/login/index.ts`:

```typescript
export { LoginContainer } from "./container";
export type { LoginFormProps } from "./types";
```

- [ ] **Step 4: Run test — see it pass (GREEN)**

```bash
cd frontend && npx vitest run tests/unit/components/login/container.test.tsx
```

Expected: **PASS**

### TDD Cycle 2: shows error on failed login

- [ ] **Step 5: Add test for error state**

Add to `container.test.tsx`:

```tsx
  it("shows error message when login fails", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(new Error("401"));

    const { LoginContainer } = await import("../../../../src/components/login/container");
    render(<LoginContainer />);

    await user.type(screen.getByLabelText(/username/i), "admin");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid username or password");
  });
```

- [ ] **Step 6: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/components/login/container.test.tsx
```

Expected: **PASS** (both tests)

### TDD Cycle 3: redirects if already authenticated

- [ ] **Step 7: Add test for redirect**

Add to `container.test.tsx`:

```tsx
  it("redirects to / when already authenticated", async () => {
    mockUseAuth.mockReturnValueOnce({
      user: { id: 1, username: "admin", email: "a@b.com", is_admin: true, created_at: "" },
      token: "some-token",
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
      logout: vi.fn(),
      initialize: vi.fn(),
    });

    const { LoginContainer } = await import("../../../../src/components/login/container");
    render(<LoginContainer />);

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
  });
```

- [ ] **Step 8: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/components/login/container.test.tsx
```

Expected: **PASS** (all 3)

- [ ] **Step 9: Create the route file**

Create `frontend/src/routes/login.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { LoginContainer } from "@/components/login";

export const Route = createFileRoute("/login")({
  component: LoginContainer,
});
```

- [ ] **Step 10: Commit**

```bash
git add frontend/src/components/login/ frontend/src/routes/login.tsx frontend/tests/unit/components/login/
git commit -m "feat(frontend): add login container, route, and component wiring with TDD"
```

---

## Task 8: Route Protection in __root.tsx

Gate the entire app behind authentication.

**Files:**
- Modify: `frontend/src/routes/__root.tsx`

- [ ] **Step 1: Update __root.tsx**

Replace `frontend/src/routes/__root.tsx`:

```tsx
import { createRootRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

function RootComponent() {
  const { isAuthenticated, initialize } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    initialize().finally(() => setIsInitializing(false));
  }, [initialize]);

  // Redirect to /login if not authenticated (but don't redirect if already on /login — avoids infinite loop)
  useEffect(() => {
    if (!isInitializing && !isAuthenticated && pathname !== "/login") {
      navigate({ to: "/login" });
    }
  }, [isInitializing, isAuthenticated, navigate, pathname]);

  if (isInitializing) {
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
  component: RootComponent,
});
```

- [ ] **Step 2: Run all unit tests**

```bash
cd frontend && npx vitest run
```

Expected: **PASS** — all tests pass. (The existing `App.test.tsx` may need updating — see next step.)

- [ ] **Step 3: Update the existing App test**

Replace `frontend/tests/unit/App.test.tsx` to account for the auth gate:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "../../src/routeTree.gen";
import { useAuthStore } from "../../src/stores/auth-store";

// Mock getMe to avoid real API calls during init
vi.mock("../../src/api/auth/auth", () => ({
  login: vi.fn(),
  getMe: vi.fn().mockRejectedValue(new Error("no token")),
  useLogin: vi.fn(),
  getLoginMutationOptions: vi.fn(() => ({ mutationFn: vi.fn() })),
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
    expect(await screen.findByLabelText(/username/i)).toBeDefined();
  });
});
```

- [ ] **Step 4: Run all tests again**

```bash
cd frontend && npx vitest run
```

Expected: **PASS**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/routes/__root.tsx frontend/tests/unit/App.test.tsx
git commit -m "feat(frontend): add auth gate in root route"
```

---

## Task 9: Cleanup

**Files:**
- Delete: `frontend/src/App.tsx`

- [ ] **Step 1: Remove dead App.tsx**

```bash
rm frontend/src/App.tsx
```

- [ ] **Step 2: Run all tests**

```bash
cd frontend && npx vitest run
```

Expected: **PASS** — nothing depends on App.tsx.

- [ ] **Step 3: Run TypeScript check**

```bash
cd frontend && npx tsc -b
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add -A frontend/src/App.tsx
git commit -m "chore(frontend): remove dead App.tsx"
```

---

## Task 10: Manual Smoke Test

- [ ] **Step 1: Start the full stack**

```bash
docker compose --profile dev up --build
```

- [ ] **Step 2: Verify viewport meta tag**

Check `frontend/index.html` contains `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`. It should already be there — this is required for mobile rendering.

- [ ] **Step 3: Open the app in a mobile browser or device simulator**

Navigate to `http://localhost:5173`. You should be redirected to the login page.

- [ ] **Step 4: Test the login flow**

1. Verify the form renders with username, password, and sign in button
2. Click the eye icon — password should toggle between visible/hidden
3. Submit with wrong credentials — "Invalid username or password" should appear
4. Submit with correct admin credentials — should redirect to home page
5. Refresh the page — should stay on home (token persisted in localStorage)
6. Open DevTools → Application → localStorage — verify `auth-token` is stored

- [ ] **Step 5: Final commit if any fixes were needed**

If you had to fix anything during smoke testing, commit those fixes.

---

## Summary

| Task | What You Learned |
|------|-----------------|
| 1 | Project setup for a new feature |
| 2 | TDD basics — Red/Green/Refactor with pure state |
| 3 | Testing async code with mocks, fixing real bugs |
| 4 | Testing hooks that compose state + API calls |
| 5 | Using component libraries (shadcn CLI) |
| 6 | Testing presentational components with props (no mocks!) |
| 7 | Testing containers by mocking hooks |
| 8 | Integration — wiring auth into the app |
| 9 | Cleanup — removing dead code safely |
| 10 | Manual verification — TDD doesn't replace this |
