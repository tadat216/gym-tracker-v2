# Theme System — Light/Dark Toggle

## Overview

Cross-cutting theme system that respects the user's system color preference and provides a manual toggle to override it. Persists the user's choice in localStorage. All pages automatically adapt via CSS variables.

Follows the [shadcn/ui dark mode guide for Vite](https://ui.shadcn.com/docs/dark-mode/vite.md) — uses React Context (`ThemeProvider`) instead of Zustand.

## Decisions

- **Default:** Follow system preference (`prefers-color-scheme`)
- **Override:** Manual toggle persists in localStorage, overrides system preference
- **No preference stored:** Falls back to system preference
- **Toggle location:** On authenticated pages, sun/moon icon button in the page header (top-right). Not shown on login page (no header — uses system or stored preference).
- **Icons:** `Sun` and `Moon` from `lucide-react`
- **Implementation:** React Context + `ThemeProvider` (shadcn pattern) — NOT Zustand. Theme is UI-only state, no need for external store access.
- **CSS:** Tailwind dark mode via `class` strategy — `.dark` on `<html>` element
- **Scope:** Standalone system — login redesign and CRUD page consume it, not the other way around

## Light Theme Update

The `:root` (light) theme in `App.css` needs updating to match the Midnight Steel design language (same layout/structure, inverted colors):

| Variable | Current (base-nova) | New (Steel Light) |
|----------|---------------------|-------------------|
| `--background` | `oklch(1 0 0)` (white) | `#f4f6fa` (cool gray) |
| `--foreground` | `oklch(0.145 0 0)` (black) | `#111827` (near-black) |
| `--card` | `oklch(1 0 0)` (white) | `#ffffff` |
| `--card-foreground` | `oklch(0.145 0 0)` | `#111827` |
| `--popover` | `oklch(1 0 0)` | `#ffffff` |
| `--popover-foreground` | `oklch(0.145 0 0)` | `#111827` |
| `--primary` | `oklch(0.205 0 0)` (black) | `#2563eb` (blue) |
| `--primary-foreground` | `oklch(0.985 0 0)` | `#ffffff` |
| `--secondary` | `oklch(0.97 0 0)` | `#edf0f7` |
| `--secondary-foreground` | `oklch(0.205 0 0)` | `#374151` |
| `--muted` | `oklch(0.97 0 0)` | `#edf0f7` |
| `--muted-foreground` | `oklch(0.556 0 0)` | `#9ca3af` |
| `--accent` | `oklch(0.97 0 0)` | `#dbeafe` |
| `--accent-foreground` | `oklch(0.205 0 0)` | `#2563eb` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `#ef4444` |
| `--border` | `oklch(0.922 0 0)` | `#e5e7eb` |
| `--input` | `oklch(0.922 0 0)` | `#e5e7eb` |
| `--ring` | `oklch(0.708 0 0)` | `#2563eb` |

Custom tokens for light:
```
--success: #16a34a
--success-foreground: #ffffff
--avatar-from: #dbeafe
--avatar-to: #c7d8f0
--fab-from: #2563eb
--fab-to: #2563eb
--glass-bg: #ffffff
--glass-border: #e5e7eb
```

Chart and sidebar variables remain unchanged from current `:root` values.

## Architecture

### 1. ThemeProvider — `src/components/theme-provider.tsx`

Follows the shadcn/ui Vite dark mode pattern:

```
Theme type: 'dark' | 'light' | 'system'

ThemeProviderProps:
  - children: React.ReactNode
  - defaultTheme?: Theme (default: 'system')
  - storageKey?: string (default: 'gym-tracker-theme')

ThemeProviderState (context value):
  - theme: Theme (current stored preference)
  - setTheme: (theme: Theme) => void

Behavior:
  - On mount: reads theme from localStorage (or uses defaultTheme)
  - useEffect syncs the resolved theme to document.documentElement:
    - Removes both 'light' and 'dark' classes
    - If theme === 'system': checks window.matchMedia('(prefers-color-scheme: dark)')
    - Adds the resolved class ('light' or 'dark')
  - setTheme: updates state + writes to localStorage
```

### 2. useTheme Hook — `src/components/theme-provider.tsx` (co-located)

Exported from the same file as ThemeProvider (shadcn pattern):

```
Returns:
  - theme: Theme (raw stored preference: 'system' | 'light' | 'dark')
  - setTheme: (theme: Theme) => void

Throws if used outside ThemeProvider.
```

### 3. Provider Setup — `src/main.tsx`

Wrap the app with `ThemeProvider`:

```tsx
<ThemeProvider defaultTheme="system" storageKey="gym-tracker-theme">
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
</ThemeProvider>
```

ThemeProvider wraps everything so the theme is available in all routes including login.

### 4. Mode Toggle — `src/components/mode-toggle.tsx`

Uses shadcn `DropdownMenu` + lucide-react icons:

```
Renders:
  - Trigger: Button (variant="ghost", size="icon") with Sun/Moon icons
    - Sun icon: visible in light mode (rotates + scales to hidden in dark)
    - Moon icon: visible in dark mode (rotates + scales to hidden in light)
  - Dropdown menu with 3 items:
    - Light (onClick: setTheme("light"))
    - Dark (onClick: setTheme("dark"))
    - System (onClick: setTheme("system"))
  - Uses useTheme() to get current theme and setTheme
```

This gives users explicit control over all 3 modes (unlike a simple toggle that hides the "system" option).

### 5. Where the Toggle Lives

- **Login page:** No toggle visible (no header). Theme follows stored preference or system default.
- **Authenticated pages:** Mode toggle in the page header area (e.g., `users-page.tsx` renders it in the top-right of the header bar)
- Future: when a shared layout/navbar exists, move the toggle there

## What Changes

| File | Change |
|------|--------|
| `src/App.css` | Update `:root` light theme colors to Steel Light palette |
| `src/components/theme-provider.tsx` | New file — React Context provider + useTheme hook |
| `src/components/mode-toggle.tsx` | New file — dropdown menu with Light/Dark/System options |
| `src/main.tsx` | Wrap app with `<ThemeProvider>` |
| `src/routes/__root.tsx` | Remove any hardcoded dark class logic if present |

## Dependencies to Install

- shadcn/ui component: `dropdown-menu` (for the mode toggle menu)

## Testing Strategy

1. **theme-provider tests** — verify context provides theme/setTheme, applies correct class to documentElement, reads from localStorage, falls back to defaultTheme
2. **mode-toggle tests** — renders trigger button, opens dropdown with 3 options, calls setTheme with correct value on click

## Dependencies

- `lucide-react` — already installed
- shadcn `dropdown-menu` — needs to be added via `npx shadcn@latest add dropdown-menu`
