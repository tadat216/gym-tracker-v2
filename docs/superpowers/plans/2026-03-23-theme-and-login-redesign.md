# Theme System & Login Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add light/dark theme toggle (following shadcn Vite pattern) and redesign the login form to Minimal Edge style with Midnight Steel aesthetic.

**Architecture:** React Context `ThemeProvider` manages theme state and syncs `.dark` class on `<html>`. Mode toggle uses shadcn DropdownMenu with Sun/Moon icons. Login form is a view-only redesign — same props/hooks/container, new markup with underline inputs and split-color heading.

**Tech Stack:** React 19, Tailwind CSS v4, shadcn/ui (dropdown-menu), lucide-react (Sun/Moon/Eye/EyeOff), Vitest + Testing Library.

**Specs:**
- `docs/superpowers/specs/2026-03-23-theme-system-design.md`
- `docs/superpowers/specs/2026-03-22-login-redesign-design.md`

---

## File Structure

### Theme System (new files)
| File | Responsibility |
|------|---------------|
| `src/components/theme-provider.tsx` | React Context provider + `useTheme` hook |
| `src/components/mode-toggle.tsx` | Dropdown menu with Light/Dark/System options |
| `tests/unit/components/theme-provider.test.tsx` | ThemeProvider context + DOM class sync tests |
| `tests/unit/components/mode-toggle.test.tsx` | Toggle renders icons, calls setTheme |

### Modified files
| File | Change |
|------|--------|
| `src/App.css` | Update `:root` light theme to Steel Light palette |
| `src/main.tsx` | Wrap app with `<ThemeProvider>` |
| `src/components/login/views/login-form.tsx` | Redesign to Minimal Edge style |
| `tests/unit/components/login/login-form.test.tsx` | Update for new markup if needed |

### Dependencies to install
| Package | Purpose |
|---------|---------|
| shadcn `dropdown-menu` | Mode toggle dropdown |

---

## Task 1: Install dropdown-menu component

**Files:**
- Modify: `src/ui/` (shadcn adds files here)

- [ ] **Step 1: Install shadcn dropdown-menu**

```bash
cd frontend && npx shadcn@latest add dropdown-menu
```

- [ ] **Step 2: Verify installation**

```bash
ls frontend/src/ui/dropdown-menu.tsx
```

Expected: file exists.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/ui/ frontend/package.json frontend/package-lock.json
git commit -m "feat: add shadcn dropdown-menu component"
```

---

## Task 2: Update light theme CSS variables

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: Update `:root` block with Steel Light colors**

Replace the entire `:root` block in `src/App.css` with:

```css
:root {
    --background: #f4f6fa;
    --foreground: #111827;
    --card: #ffffff;
    --card-foreground: #111827;
    --popover: #ffffff;
    --popover-foreground: #111827;
    --primary: #2563eb;
    --primary-foreground: #ffffff;
    --secondary: #edf0f7;
    --secondary-foreground: #374151;
    --muted: #edf0f7;
    --muted-foreground: #9ca3af;
    --accent: #dbeafe;
    --accent-foreground: #2563eb;
    --destructive: #ef4444;
    --border: #e5e7eb;
    --input: #e5e7eb;
    --ring: #2563eb;
    --chart-1: oklch(0.87 0 0);
    --chart-2: oklch(0.556 0 0);
    --chart-3: oklch(0.439 0 0);
    --chart-4: oklch(0.371 0 0);
    --chart-5: oklch(0.269 0 0);
    --radius: 0.625rem;
    --sidebar: oklch(0.985 0 0);
    --sidebar-foreground: oklch(0.145 0 0);
    --sidebar-primary: oklch(0.205 0 0);
    --sidebar-primary-foreground: oklch(0.985 0 0);
    --sidebar-accent: oklch(0.97 0 0);
    --sidebar-accent-foreground: oklch(0.205 0 0);
    --sidebar-border: oklch(0.922 0 0);
    --sidebar-ring: oklch(0.708 0 0);

    /* Steel Light custom tokens */
    --success: #16a34a;
    --success-foreground: #ffffff;
    --avatar-from: #dbeafe;
    --avatar-to: #c7d8f0;
    --fab-from: #2563eb;
    --fab-to: #2563eb;
    --glass-bg: #ffffff;
    --glass-border: #e5e7eb;
}
```

- [ ] **Step 2: Run type check to verify no CSS issues**

```bash
cd frontend && npx tsc --noEmit
```

Expected: PASS (CSS changes don't affect types, but verifies nothing broke).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.css
git commit -m "style: update light theme to Steel Light palette"
```

---

## Task 3: Create ThemeProvider with tests (TDD)

**Files:**
- Create: `src/components/theme-provider.tsx`
- Create: `tests/unit/components/theme-provider.test.tsx`

- [ ] **Step 1: Write failing tests for ThemeProvider**

Create `frontend/tests/unit/components/theme-provider.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "@/components/theme-provider";

function TestConsumer() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={() => setTheme("system")}>Set System</button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light", "dark");
  });

  it("defaults to system theme", () => {
    render(
      <ThemeProvider defaultTheme="system" storageKey="test-theme">
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme").textContent).toBe("system");
  });

  it("applies dark class when theme is dark", () => {
    render(
      <ThemeProvider defaultTheme="dark" storageKey="test-theme">
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("applies light class when theme is light", () => {
    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists theme to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="system" storageKey="test-theme">
        <TestConsumer />
      </ThemeProvider>,
    );

    await user.click(screen.getByText("Set Dark"));

    expect(localStorage.getItem("test-theme")).toBe("dark");
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("reads initial theme from localStorage", () => {
    localStorage.setItem("test-theme", "dark");

    render(
      <ThemeProvider defaultTheme="system" storageKey="test-theme">
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npx vitest run tests/unit/components/theme-provider.test.tsx
```

Expected: FAIL — `theme-provider` module doesn't exist.

- [ ] **Step 3: Implement ThemeProvider**

Create `frontend/src/components/theme-provider.tsx`:

```tsx
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined,
);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "gym-tracker-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeProviderContext.Provider {...props} value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run tests/unit/components/theme-provider.test.tsx
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/theme-provider.tsx frontend/tests/unit/components/theme-provider.test.tsx
git commit -m "feat: add ThemeProvider with system/light/dark support"
```

---

## Task 4: Create ModeToggle with tests (TDD)

**Files:**
- Create: `src/components/mode-toggle.tsx`
- Create: `tests/unit/components/mode-toggle.test.tsx`

- [ ] **Step 1: Write failing tests for ModeToggle**

Create `frontend/tests/unit/components/mode-toggle.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ModeToggle } from "@/components/mode-toggle";

const mockSetTheme = vi.fn();

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({
    theme: "system",
    setTheme: mockSetTheme,
  }),
}));

describe("ModeToggle", () => {
  it("renders a toggle button", () => {
    render(<ModeToggle />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeDefined();
  });

  it("opens dropdown with theme options on click", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    await user.click(screen.getByRole("button", { name: /toggle theme/i }));

    expect(screen.getByRole("menuitem", { name: /light/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /dark/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /system/i })).toBeDefined();
  });

  it("calls setTheme with 'light' when Light is clicked", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    await user.click(screen.getByRole("menuitem", { name: /light/i }));

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("calls setTheme with 'dark' when Dark is clicked", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    await user.click(screen.getByRole("menuitem", { name: /dark/i }));

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme with 'system' when System is clicked", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    await user.click(screen.getByRole("menuitem", { name: /system/i }));

    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npx vitest run tests/unit/components/mode-toggle.test.tsx
```

Expected: FAIL — `mode-toggle` module doesn't exist.

- [ ] **Step 3: Implement ModeToggle**

Create `frontend/src/components/mode-toggle.tsx`:

```tsx
import { Moon, Sun } from "lucide-react";
import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run tests/unit/components/mode-toggle.test.tsx
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/mode-toggle.tsx frontend/tests/unit/components/mode-toggle.test.tsx
git commit -m "feat: add ModeToggle dropdown with Light/Dark/System options"
```

---

## Task 5: Wire ThemeProvider into main.tsx

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Wrap app with ThemeProvider**

Update `frontend/src/main.tsx` — add `ThemeProvider` import and wrap around `QueryClientProvider`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { routeTree } from "./routeTree.gen";
import "./App.css";

const queryClient = new QueryClient();
const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="gym-tracker-theme">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
```

- [ ] **Step 2: Run full test suite to verify nothing broke**

```bash
cd frontend && npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/main.tsx
git commit -m "feat: wrap app with ThemeProvider for system theme detection"
```

---

## Task 6: Redesign login form view

**Files:**
- Modify: `src/components/login/views/login-form.tsx`

- [ ] **Step 1: Run existing login form tests to confirm baseline**

```bash
cd frontend && npx vitest run tests/unit/components/login/login-form.test.tsx
```

Expected: all 6 tests PASS.

- [ ] **Step 2: Redesign login-form.tsx to Minimal Edge style**

Replace `frontend/src/components/login/views/login-form.tsx` with:

```tsx
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/ui/button";
import type { LoginFormProps } from "../types";

const LoginForm = ({
  username,
  password,
  showPassword,
  isLoading,
  error,
  onUsernameChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}: LoginFormProps) => {
  return (
    <div className="flex min-h-dvh flex-col bg-background px-7">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

      {/* Top spacer */}
      <div className="flex-1" />

      {/* Brand + heading */}
      <div className="mb-10 pt-5">
        <p className="mb-2 text-[13px] font-extrabold uppercase tracking-[4px] text-primary">
          Gym Tracker
        </p>
        <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-foreground">
          Log in
          <br />
          <span className="text-muted-foreground">to continue</span>
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="mb-10">
        <div className="mb-[18px]">
          <label
            htmlFor="username"
            className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.5px] text-muted-foreground"
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            autoComplete="username"
            required
            placeholder="Enter username"
            className="w-full border-b border-input bg-transparent py-4 text-base font-medium text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-primary"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="password"
            className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.5px] text-muted-foreground"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="Enter password"
              className="w-full border-b border-input bg-transparent py-4 pr-12 text-base font-medium text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-primary"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2"
              onClick={onTogglePassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-5 text-muted-foreground" />
              ) : (
                <Eye className="size-5 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="h-[52px] w-full rounded-xl text-base font-bold"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      {/* Bottom spacer */}
      <div className="flex-[0.6]" />
    </div>
  );
};

LoginForm.displayName = "LoginForm";
export default LoginForm;
```

Key changes from current:
- No shadcn `Input` or `Label` — using native `<input>` and `<label>` with Tailwind for underline style
- Split heading: "Log in" + "to continue" on separate lines
- Brand text "GYM TRACKER" at top
- Top accent gradient line
- Flex spacers for vertical positioning
- Button text unchanged: "Sign in" / "Signing in..." (keeps tests passing)
- Same `htmlFor` / `id` bindings (keeps `getByLabelText` queries working)

- [ ] **Step 3: Run login form tests to verify they pass**

```bash
cd frontend && npx vitest run tests/unit/components/login/login-form.test.tsx
```

Expected: all 6 tests PASS (same labels, same roles, same button text).

- [ ] **Step 4: Run full test suite**

```bash
cd frontend && npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/login/views/login-form.tsx
git commit -m "style: redesign login form to Minimal Edge style"
```

---

## Task 7: Run full verification

**Files:** none (verification only)

- [ ] **Step 1: Run full test suite**

```bash
cd frontend && npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 2: Run linter**

```bash
cd frontend && npx eslint .
```

Expected: no errors.

- [ ] **Step 3: Run type check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify visually (manual)**

Start dev server and check:
```bash
cd frontend && npm run dev
```

Verify in browser:
- Login page shows Minimal Edge design
- Theme toggle dropdown works (if added to a test page — toggle will be integrated into CRUD page header later)
- Light/dark themes switch correctly
- System preference is respected by default
