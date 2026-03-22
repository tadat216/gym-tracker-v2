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
│   │   ├── types.ts                          # CREATE — UseAuthReturn and future hook types
│   │   └── use-auth.ts                       # CREATE — orchestration hook
│   ├── components/
│   │   └── login/
│   │       ├── hooks/
│   │       │   ├── use-login-form.ts         # CREATE — form state + submit handler
│   │       │   └── index.ts                  # CREATE — re-exports hooks
│   │       ├── types.ts                      # CREATE — LoginFormProps, UseLoginFormReturn
│   │       ├── views/
│   │       │   ├── login-form.tsx            # CREATE — pure rendering (props only)
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
│       │       ├── use-login-form.test.ts     # CREATE
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

## Task 2: Auth Store (Zustand — Token Only)

The store holds only the token. User data is server state — TanStack Query handles it via `useGetMe()`. This keeps the store minimal: just a credential + setters.

**Files:**
- Create: `frontend/tests/unit/stores/auth-store.test.ts`
- Create: `frontend/src/stores/auth-store.ts`

### TDD Cycle 1: Initial state

- [x] **Step 1: Write the failing test**

Create `frontend/tests/unit/stores/auth-store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/stores/auth-store";

describe("auth-store", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null });
  });

  it("starts with null token", () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
  });
});
```

- [x] **Step 2: Run test — see it fail (RED)**

```bash
cd frontend && npx vitest run tests/unit/stores/auth-store.test.ts
```

Expected: **FAIL** — `Cannot find module '@/stores/auth-store'`

> **TDD lesson:** The test fails because the file doesn't exist yet. That's the "Red" step. We've described what we *want* — now we write code to make it happen.

- [ ] **Step 3: Write minimal implementation (GREEN)**

Create `frontend/src/stores/auth-store.ts`:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthState {
  token: string | null;
  setToken: (token: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clear: () => set({ token: null }),
    }),
    { name: "auth-store" },
  ),
);
```

> **Why no `user` in the store?** User data is server state — it belongs in TanStack Query's cache (via `useGetMe()`). Zustand only holds the token (a client credential). This avoids duplicating server state and lets TanStack Query handle caching/refetching automatically.

- [ ] **Step 4: Run test — see it pass (GREEN)**

```bash
cd frontend && npx vitest run tests/unit/stores/auth-store.test.ts
```

Expected: **PASS**

### TDD Cycle 2: setToken

- [ ] **Step 5: Add test for setToken**

Add to the `describe` block in `auth-store.test.ts`:

```typescript
  it("setToken stores the token", () => {
    useAuthStore.getState().setToken("abc123");
    expect(useAuthStore.getState().token).toBe("abc123");
  });
```

- [ ] **Step 6: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/stores/auth-store.test.ts
```

Expected: **PASS** (both tests)

### TDD Cycle 3: clear()

- [ ] **Step 7: Add test for clear**

Add to the `describe` block:

```typescript
  it("clear resets token to null", () => {
    useAuthStore.getState().setToken("abc123");
    useAuthStore.getState().clear();
    expect(useAuthStore.getState().token).toBeNull();
  });
```

- [ ] **Step 8: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/stores/auth-store.test.ts
```

Expected: **PASS** (all 3 tests)

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

- [x] **Step 1: Rewrite the api mutator**

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

- [x] **Step 2: Verify existing tests still pass**

```bash
cd frontend && npx vitest run
```

Expected: **PASS** — all existing tests still work.

- [x] **Step 3: Run TypeScript check**

```bash
cd frontend && npx tsc -b
```

Expected: no errors. This confirms the new signature is compatible with Orval-generated code.

- [x] **Step 4: Commit**

```bash
git add frontend/src/lib/axios.ts
git commit -m "feat(frontend): fix api mutator for Orval fetch-style + add interceptors"
```

---

## Task 4: useAuth Hook

This hook composes Zustand (token) + TanStack Query (API calls). Instead of manual `useState`/`try`/`catch`, we use the Orval-generated `useLogin()` mutation and `useGetMe()` query — they provide `isPending`, `error`, caching, and refetching for free.

**Files:**
- Create: `frontend/src/hooks/types.ts`
- Create: `frontend/src/hooks/use-auth.ts`
- Create: `frontend/tests/unit/hooks/use-auth.test.tsx`

### TDD Cycle 1: login flow

- [x] **Step 1: Write the failing test**

Create `frontend/tests/unit/hooks/use-auth.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";

// Mock the Orval-generated API functions (raw functions used by the hooks internally)
vi.mock("@/api/auth/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/auth/auth")>();
  return {
    ...actual,
    login: vi.fn(),
    getMe: vi.fn(),
  };
});

import { login as apiLogin, getMe as apiGetMe } from "@/api/auth/auth";

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
    useAuthStore.setState({ token: null });
  });

  it("login stores token", async () => {
    vi.mocked(apiLogin).mockResolvedValueOnce({
      data: { access_token: "jwt-token-123", token_type: "bearer" },
      status: 200,
      headers: new Headers(),
    } as any);

    const { useAuth } = await import("@/hooks/use-auth");
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.login("admin", "password123");
    });

    expect(useAuthStore.getState().token).toBe("jwt-token-123");
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

- [x] **Step 2: Run test — see it fail (RED)**

```bash
cd frontend && npx vitest run tests/unit/hooks/use-auth.test.tsx
```

Expected: **FAIL** — `Cannot find module '@/hooks/use-auth'`

- [x] **Step 3: Write minimal implementation (GREEN)**

Create `frontend/src/hooks/types.ts`:

```typescript
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
```

> **No `initialize()`** — `useGetMe()` auto-fetches when the token exists. No manual `isLoading` or `error` state — TanStack Query provides `isPending` and `error` for free.

Create `frontend/src/hooks/use-auth.ts`:

```typescript
import { useAuthStore } from "@/stores/auth-store";
import { useLogin, useGetMe } from "@/api/auth/auth";
import type { UseAuthReturn } from "./types";

export function useAuth(): UseAuthReturn {
  const { token, setToken, clear } = useAuthStore();

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
  }

  function logout(): void {
    clear();
  }

  const user = meResponse?.data ?? null;

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isInitializing: !!token && isInitializing,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error ? "Invalid username or password" : null,
    login,
    logout,
  };
}
```

> **How this works:**
> - `useGetMe({ enabled: !!token })` — only fetches when token exists. On page load, Zustand rehydrates the token from localStorage, then `useGetMe` auto-fires to validate it and fetch user data.
> - `useLogin().mutateAsync()` — TanStack Query handles the loading/error state. No manual `try/catch` or `useState` needed in the hook.
> - If `getMe` fails with 401 → the axios interceptor calls `clear()` → token becomes null → `useGetMe` disables itself.
> - `isAuthenticated` requires both token AND user — this prevents a flash of "authenticated" before the user is fetched.

- [x] **Step 4: Run test — see it pass (GREEN)**

```bash
cd frontend && npx vitest run tests/unit/hooks/use-auth.test.tsx
```

Expected: **PASS**

### TDD Cycle 2: logout

- [x] **Step 5: Add test for logout**

Add to the `describe` block in `use-auth.test.tsx`:

```tsx
  it("logout clears token", async () => {
    useAuthStore.setState({ token: "existing-token" });

    const { useAuth } = await import("@/hooks/use-auth");
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    act(() => {
      result.current.logout();
    });

    expect(useAuthStore.getState().token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
```

- [x] **Step 6: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/hooks/use-auth.test.tsx
```

Expected: **PASS** (both tests)

### TDD Cycle 3: isAuthenticated requires both token and user

- [x] **Step 7: Add test for isAuthenticated**

Add to the `describe` block:

```tsx
  it("isAuthenticated is false when token exists but user not yet loaded", async () => {
    useAuthStore.setState({ token: "some-token" });

    // getMe is still loading (never resolves in this test)
    vi.mocked(apiGetMe).mockReturnValueOnce(new Promise(() => {}));

    const { useAuth } = await import("@/hooks/use-auth");
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.token).toBe("some-token");
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isInitializing).toBe(true);
  });
```

- [x] **Step 8: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/hooks/use-auth.test.tsx
```

Expected: **PASS** (all 3)

- [x] **Step 9: Commit**

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

## Task 6: Login Form — Hook + View Split

Split into two parts: `useLoginForm` (form state + submit logic) and `LoginForm` (pure rendering). This makes each piece independently testable — hook tests don't need DOM, view tests don't need behavior assertions.

**Files:**
- Create: `frontend/src/components/login/types.ts`
- Create: `frontend/src/components/login/hooks/use-login-form.ts`
- Create: `frontend/src/components/login/hooks/index.ts`
- Create: `frontend/src/components/login/views/login-form.tsx`
- Create: `frontend/src/components/login/views/index.ts`
- Create: `frontend/tests/unit/components/login/use-login-form.test.ts`
- Create: `frontend/tests/unit/components/login/login-form.test.tsx`

### Part A: useLoginForm Hook

### TDD Cycle 1: handleSubmit calls onSubmit with field values

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/unit/components/login/use-login-form.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

describe("useLoginForm", () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onSubmit with username and password on handleSubmit", async () => {
    const { useLoginForm } = await import("@/components/login/hooks/use-login-form");
    const { result } = renderHook(() => useLoginForm(mockOnSubmit));

    act(() => {
      result.current.setUsername("admin");
      result.current.setPassword("secret123");
    });

    act(() => {
      // Simulate form submit event
      const fakeEvent = { preventDefault: vi.fn() } as any;
      result.current.handleSubmit(fakeEvent);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith("admin", "secret123");
  });
});
```

- [ ] **Step 2: Run test — see it fail (RED)**

```bash
cd frontend && npx vitest run tests/unit/components/login/use-login-form.test.ts
```

Expected: **FAIL** — module not found.

- [ ] **Step 3: Create types.ts and the hook (GREEN)**

Create `frontend/src/components/login/types.ts`:

```typescript
import type { FormEvent } from "react";

export interface LoginFormProps {
  username: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string | null;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export interface UseLoginFormReturn {
  username: string;
  password: string;
  showPassword: boolean;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  togglePassword: () => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
}
```

Create `frontend/src/components/login/hooks/use-login-form.ts`:

```typescript
import { useState, type FormEvent } from "react";
import type { UseLoginFormReturn } from "../types";

export function useLoginForm(
  onSubmit: (username: string, password: string) => void,
): UseLoginFormReturn {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    onSubmit(username, password);
  }

  function togglePassword(): void {
    setShowPassword((prev) => !prev);
  }

  return {
    username,
    password,
    showPassword,
    setUsername,
    setPassword,
    togglePassword,
    handleSubmit,
  };
}
```

Create `frontend/src/components/login/hooks/index.ts`:

```typescript
export { useLoginForm } from "./use-login-form";
```

- [ ] **Step 4: Run test — see it pass (GREEN)**

```bash
cd frontend && npx vitest run tests/unit/components/login/use-login-form.test.ts
```

Expected: **PASS**

### TDD Cycle 2: password visibility toggle

- [ ] **Step 5: Add test for togglePassword**

Add to the `describe` block:

```typescript
  it("togglePassword flips showPassword", async () => {
    const { useLoginForm } = await import("@/components/login/hooks/use-login-form");
    const { result } = renderHook(() => useLoginForm(mockOnSubmit));

    expect(result.current.showPassword).toBe(false);

    act(() => {
      result.current.togglePassword();
    });

    expect(result.current.showPassword).toBe(true);

    act(() => {
      result.current.togglePassword();
    });

    expect(result.current.showPassword).toBe(false);
  });
```

- [ ] **Step 6: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/components/login/use-login-form.test.ts
```

Expected: **PASS** (both tests)

### TDD Cycle 3: handleSubmit calls preventDefault

- [ ] **Step 7: Add test for preventDefault**

Add to the `describe` block:

```typescript
  it("handleSubmit calls preventDefault", async () => {
    const { useLoginForm } = await import("@/components/login/hooks/use-login-form");
    const { result } = renderHook(() => useLoginForm(mockOnSubmit));

    const fakeEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(fakeEvent);
    });

    expect(fakeEvent.preventDefault).toHaveBeenCalled();
  });
```

- [ ] **Step 8: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/components/login/use-login-form.test.ts
```

Expected: **PASS** (all 3)

- [ ] **Step 9: Commit**

```bash
git add frontend/src/components/login/types.ts frontend/src/components/login/hooks/ frontend/tests/unit/components/login/use-login-form.test.ts
git commit -m "feat(frontend): add useLoginForm hook with TDD"
```

---

### Part B: LoginForm View (Pure Rendering)

The view receives ALL data as props — no hooks, no state, no logic. Just renders what it's given.

### TDD Cycle 4: renders form fields

- [ ] **Step 10: Write the failing test**

Create `frontend/tests/unit/components/login/login-form.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "@/components/login/views";
import type { LoginFormProps } from "@/components/login/types";

describe("LoginForm", () => {
  const defaultProps: LoginFormProps = {
    username: "",
    password: "",
    showPassword: false,
    isLoading: false,
    error: null,
    onUsernameChange: vi.fn(),
    onPasswordChange: vi.fn(),
    onTogglePassword: vi.fn(),
    onSubmit: vi.fn(),
  };

  it("renders username and password fields with labels", () => {
    render(<LoginForm {...defaultProps} />);

    expect(screen.getByLabelText(/username/i)).toBeDefined();
    expect(screen.getByLabelText(/password/i)).toBeDefined();
  });
});
```

- [ ] **Step 11: Run test — see it fail (RED)**

```bash
cd frontend && npx vitest run tests/unit/components/login/login-form.test.tsx
```

Expected: **FAIL** — module not found.

- [ ] **Step 12: Write minimal LoginForm (GREEN)**

Create `frontend/src/components/login/views/login-form.tsx`:

```tsx
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import type { LoginFormProps } from "../types";

export function LoginForm({
  username,
  password,
  showPassword,
  isLoading,
  error,
  onUsernameChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}: LoginFormProps): React.JSX.Element {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold">Login</h1>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
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
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              autoComplete="current-password"
              required
              className="h-12 pr-12 text-base"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 size-11"
              onClick={onTogglePassword}
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

> **Note:** No `useState`, no `FormEvent` handler — everything comes from props. The view is truly pure.

Create `frontend/src/components/login/views/index.ts`:

```typescript
export { LoginForm } from "./login-form";
```

- [ ] **Step 13: Run test — see it pass (GREEN)**

```bash
cd frontend && npx vitest run tests/unit/components/login/login-form.test.tsx
```

Expected: **PASS**

### TDD Cycle 5: password visibility renders correctly

- [ ] **Step 14: Add test for password type based on showPassword prop**

Add to `login-form.test.tsx`:

```tsx
  it("renders password as hidden when showPassword is false", () => {
    render(<LoginForm {...defaultProps} showPassword={false} />);
    expect(screen.getByLabelText(/password/i).getAttribute("type")).toBe("password");
  });

  it("renders password as visible when showPassword is true", () => {
    render(<LoginForm {...defaultProps} showPassword={true} />);
    expect(screen.getByLabelText(/password/i).getAttribute("type")).toBe("text");
  });
```

- [ ] **Step 15: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/components/login/login-form.test.tsx
```

Expected: **PASS** (all 3)

### TDD Cycle 6: error display

- [ ] **Step 16: Add test for error message**

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

- [ ] **Step 17: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/components/login/login-form.test.tsx
```

Expected: **PASS** (all 5)

### TDD Cycle 7: loading state

- [ ] **Step 18: Add test for loading state**

Add to the `describe` block:

```tsx
  it("shows loading text and disables button when isLoading is true", () => {
    render(<LoginForm {...defaultProps} isLoading={true} />);

    const button = screen.getByRole("button", { name: /signing in/i });
    expect(button).toBeDisabled();
  });
```

- [ ] **Step 19: Run tests — should pass**

```bash
cd frontend && npx vitest run tests/unit/components/login/login-form.test.tsx
```

Expected: **PASS** (all 6)

- [ ] **Step 20: Commit**

```bash
git add frontend/src/components/login/views/ frontend/tests/unit/components/login/login-form.test.tsx
git commit -m "feat(frontend): add LoginForm view component with TDD"
```

---

## Task 7: Login Container + Component Wiring

The container wires `useAuth` (auth state) + `useLoginForm` (form state) → `LoginForm` (view). No local state — everything comes from hooks.

**Files:**
- Create: `frontend/tests/unit/components/login/container.test.tsx`
- Create: `frontend/src/components/login/container.tsx`
- Create: `frontend/src/components/login/index.ts`
- Create: `frontend/src/routes/login.tsx`

### TDD Cycle 1: renders LoginForm and calls login on submit

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/unit/components/login/container.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { UseAuthReturn } from "@/hooks/types";

// Mock useAuth hook
const mockLogin = vi.fn();
const mockUseAuth = vi.fn((): UseAuthReturn => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitializing: false,
  isLoggingIn: false,
  loginError: null,
  login: mockLogin,
  logout: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
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

    const { LoginContainer } = await import("@/components/login/container");
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
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useLoginForm } from "./hooks";
import { LoginForm } from "./views";

export function LoginContainer(): React.JSX.Element | null {
  const { login, isLoggingIn, loginError, isAuthenticated } = useAuth();
  const form = useLoginForm(login);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  return (
    <LoginForm
      username={form.username}
      password={form.password}
      showPassword={form.showPassword}
      isLoading={isLoggingIn}
      error={loginError}
      onUsernameChange={form.setUsername}
      onPasswordChange={form.setPassword}
      onTogglePassword={form.togglePassword}
      onSubmit={form.handleSubmit}
    />
  );
}
```

> **The container owns zero state.** `useAuth` provides auth state (from TanStack Query), `useLoginForm` provides form state, and `LoginForm` renders it all. Each layer has one job.

Create `frontend/src/components/login/index.ts`:

```typescript
export { LoginContainer } from "./container";
export type { LoginFormProps, UseLoginFormReturn } from "./types";
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
    mockUseAuth.mockReturnValueOnce({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitializing: false,
      isLoggingIn: false,
      loginError: "Invalid username or password",
      login: mockLogin,
      logout: vi.fn(),
    } satisfies UseAuthReturn);

    const { LoginContainer } = await import("@/components/login/container");
    render(<LoginContainer />);

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid username or password");
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
      isInitializing: false,
      isLoggingIn: false,
      loginError: null,
      login: mockLogin,
      logout: vi.fn(),
    } satisfies UseAuthReturn);

    const { LoginContainer } = await import("@/components/login/container");
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
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

function RootComponent(): React.JSX.Element {
  const { isAuthenticated, isInitializing } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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

> **No `initialize()` call** — `useGetMe({ enabled: !!token })` inside `useAuth` auto-fires when the token is rehydrated from localStorage. `isInitializing` is true while the request is in flight.

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
6. Open DevTools → Application → localStorage — verify `auth-store` key is present (this is where zustand persist stores the token)

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
