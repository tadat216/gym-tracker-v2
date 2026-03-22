# Theme System — Light/Dark Toggle

## Overview

Cross-cutting theme system that respects the user's system color preference and provides a manual toggle to override it. Persists the user's choice in localStorage. All pages automatically adapt via CSS variables.

## Decisions

- **Default:** Follow system preference (`prefers-color-scheme`)
- **Override:** Manual toggle persists in localStorage, overrides system preference
- **No preference stored:** Falls back to system preference
- **Toggle location:** On authenticated pages, sun/moon icon button in the page header (top-right). Not shown on login page (no header — uses system or stored preference).
- **Icons:** `Sun` and `Moon` from `lucide-react`
- **Implementation:** Zustand store with `persist` middleware (same pattern as auth-store)
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

## Architecture

### 1. Theme Store — `src/stores/theme-store.ts`

```
State:
  - mode: 'system' | 'light' | 'dark'

Actions:
  - setMode(mode) → sets mode
  - toggle() → cycles: if 'system' → 'dark', if 'dark' → 'light', if 'light' → 'system'

Derived (not in store — computed in hook):
  - resolvedTheme: 'light' | 'dark' → actual theme after resolving system preference
```

Uses `persist` middleware with localStorage key `"theme-store"`.

### 2. Theme Hook — `src/hooks/use-theme.ts`

```
Returns:
  - mode: 'system' | 'light' | 'dark' (raw stored preference)
  - resolvedTheme: 'light' | 'dark' (actual applied theme)
  - toggle() → cycles mode
  - setMode(mode) → sets explicitly
```

Logic:
- Reads `mode` from store
- If `mode === 'system'`: listens to `window.matchMedia('(prefers-color-scheme: dark)')` to resolve
- If `mode === 'light'` or `'dark'`: uses that directly
- Applies `class="dark"` on `document.documentElement` when resolved theme is dark, removes it when light
- Uses `useEffect` to sync class with resolved theme

### 3. Theme Initialization — `src/routes/__root.tsx`

- Calls `useTheme()` in the root route component (not in `beforeLoad`)
- The hook handles class application via `useEffect`
- No flash-of-wrong-theme: add a small inline `<script>` in `index.html` that reads localStorage and sets the class before React hydrates (optional optimization — can skip for v1)

### 4. Theme Toggle Button — `src/components/theme-toggle.tsx`

Simple standalone component (not part of hooks/views/container — it's a shared UI element):

```
Props: none (reads from useTheme hook directly)

Renders:
  - If resolvedTheme is 'dark': Sun icon (clicking switches to light)
  - If resolvedTheme is 'light': Moon icon (clicking switches to dark)
  - Uses lucide-react Sun and Moon icons
  - Styled as a ghost icon button (same as shadcn Button variant="ghost" size="icon")
```

### 5. Where the Toggle Lives

- **Login page:** No toggle — theme follows stored preference or system default
- **Authenticated pages:** Toggle button in the page header area. Each page includes it in its own header (e.g., `users-page.tsx` renders it in the top-right of the header bar)
- Future: when a shared layout/navbar exists, move the toggle there

## What Changes

| File | Change |
|------|--------|
| `src/App.css` | Update `:root` light theme colors to Steel Light palette |
| `src/stores/theme-store.ts` | New file — Zustand store for theme mode |
| `src/hooks/use-theme.ts` | New file — hook that resolves theme + syncs DOM class |
| `src/components/theme-toggle.tsx` | New file — sun/moon toggle button |
| `src/routes/__root.tsx` | Call `useTheme()` for root-level theme sync, remove hardcoded dark class |

## Testing Strategy

1. **theme-store tests** — verify setMode, toggle cycling, persist to localStorage
2. **use-theme tests** — mock matchMedia, verify resolvedTheme for each mode, verify DOM class sync
3. **theme-toggle tests** — renders Sun in dark mode, Moon in light mode, calls toggle on click

## Dependencies

None new — `lucide-react` is already installed. Zustand persist middleware already in use.
