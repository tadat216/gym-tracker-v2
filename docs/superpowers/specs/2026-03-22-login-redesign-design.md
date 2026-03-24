# Login Form Redesign — Midnight Steel

## Overview

Visual redesign of the existing login form to match the Midnight Steel theme. No behavior changes — same props, same hooks, same container. Only the view layer (`login-form.tsx`) changes. Dark mode is handled by the theme system (separate spec).

## Decisions

- **Style:** Minimal Edge — brand name top, large split-color heading, underline inputs, solid blue button
- **Scope:** View-only refactor. No changes to hooks, container, types, or route logic.
- **Dark mode:** App must have `class="dark"` on `<html>` to activate the Midnight Steel CSS variables
- **Font:** Already changed to Manrope Variable in `App.css`
- **Theme:** Already updated in `.dark` section of `App.css`

## What Changes

Only two files are touched:

### 1. `src/components/login/views/login-form.tsx` — Visual redesign

**Current:** Centered form with basic shadcn inputs, plain "Login" heading.

**New (Minimal Edge):**
- Full viewport height, content pushed to lower-center using flex spacers
- Top accent: thin horizontal gradient line (`primary` color, faded edges) at top of screen
- Brand section:
  - "GYM TRACKER" — uppercase, letter-spacing 4px, `text-primary` (`#64b4ff`), weight 800, 13px
  - "Log in" on first line — weight 800, 32px, `text-foreground`
  - "to continue" on second line — same size, `text-muted-foreground`
- Form fields:
  - Label: uppercase, 11px, weight 600, letter-spacing 0.5px, `text-muted-foreground`
  - Input: **borderless underline style** — transparent background, no side/top borders, only `border-bottom` using `border-input`, 16px font, padding 16px vertical
  - Password toggle: same eye/eye-off icon, positioned absolute right
- Submit button: full width, solid `bg-primary text-primary-foreground`, weight 700, 16px, rounded-xl (14px), height 52px. Text stays "Sign in" / "Signing in..." (unchanged from current — keeps tests passing)
- Error message: `text-destructive`, same position as current
- Bottom spacer: flex ratio ~0.6 to push content slightly above center

**Tailwind classes only** — no inline styles, no custom CSS. All colors via theme variables (`bg-background`, `text-primary`, `border-input`, etc.).

### 2. Dark mode activation

Handled by the theme system (see `2026-03-23-theme-system-design.md`). The theme system must be implemented first — it manages the `.dark` class on `<html>` based on system preference or user toggle. No dark mode logic in this spec.

## What Does NOT Change

- `types.ts` — same `LoginFormProps` interface
- `hooks/use-login-form.ts` — same form state hook
- `container.tsx` — same wiring
- `routes/login.tsx` — same route
- `hooks/use-auth.ts` — same auth logic
- `stores/auth-store.ts` — same store

## Visual Reference

```
┌─────────────────────────────┐
│ ═══════ blue gradient ═════ │  ← thin accent line
│                             │
│                             │
│                             │  ← flex spacer (pushes down)
│                             │
│  GYM TRACKER                │  ← brand, primary blue, uppercase
│  Log in                     │  ← large, white
│  to continue                │  ← large, muted gray
│                             │
│  USERNAME                   │  ← label, uppercase, muted
│  __________________________ │  ← underline input
│                             │
│  PASSWORD                 👁│  ← underline input + eye toggle
│  __________________________ │
│                             │
│  ┌───────────────────────┐  │
│  │       Log In          │  │  ← solid blue button
│  └───────────────────────┘  │
│                             │
│                             │  ← bottom spacer
└─────────────────────────────┘
```

## Testing Impact

Existing login form tests should still pass since:
- Same props interface (`LoginFormProps`)
- Same form elements (inputs, button, error message)
- Same `data-testid` / semantic queries (labels, roles)

If any tests rely on specific CSS classes or DOM structure, they may need minor updates to match new markup. But since views are tested via accessible queries (`getByLabelText`, `getByRole`), most tests should be unaffected.

## Prerequisites

- **Theme system** (`2026-03-23-theme-system-design.md`) must be implemented first — provides dark/light mode switching and updated CSS variables.
- Manrope font already installed and configured in `App.css`.

## Dependencies

None new beyond the theme system prerequisite.
