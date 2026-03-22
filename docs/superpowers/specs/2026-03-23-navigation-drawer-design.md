# Navigation Drawer & Header Bar Design

## Overview

Mobile-first navigation system for the gym tracker app. A shared top header bar with hamburger menu icon, page title, and theme toggle appears on all authenticated pages. The hamburger opens a slide-out drawer with user info, navigation links (admin-aware), and logout.

## Decisions

- **Pattern:** Hamburger drawer — scales well as pages grow, separates admin from regular nav
- **Header bar:** Shared across all authenticated pages via root route layout
- **Header content:** `[☰ hamburger]` — `Page Title` — `[Sun/Moon toggle]`
- **Drawer content:** Username + admin badge at top, nav links in middle, logout at bottom
- **Admin links:** "Users" link only visible when `user.is_admin === true`
- **Login page:** No header bar or drawer — standalone page
- **Theme toggle:** Reuses existing `ModeToggle` component (lucide-react Sun/Moon icons)
- **No animations beyond defaults** — use shadcn Sheet's built-in slide transition only
- **Target:** Mobile-first (mobile is the only priority)

## Dependencies to Install

- shadcn/ui `sheet` component (slide-out drawer)
- shadcn/ui `separator` component (divider between nav sections)

Already available: `button`, `dropdown-menu`, lucide-react icons, `ModeToggle`, `useAuth`, `useTheme`

## Architecture

### Component Structure

```
components/navigation/
├── container.tsx              # Wires useAuth + useDrawer → views
├── types.ts                   # Shared interfaces
├── index.ts                   # Barrel exports
├── hooks/
│   ├── use-drawer.ts          # Drawer open/close state
│   └── index.ts
└── views/
    ├── app-header.tsx         # Top bar: hamburger + title + theme toggle
    ├── nav-drawer/
    │   ├── nav-drawer.tsx     # Sheet wrapper with user info + nav links + logout
    │   ├── nav-link.tsx       # Single navigation link row (icon + label + active state)
    │   └── index.ts
    └── index.ts
```

### 0. Root Route Layout Update

**File:** `src/routes/__root.tsx`

Currently renders just `<Outlet />`. Update to wrap authenticated routes with the navigation container:

```
If on /login → render <Outlet /> only (no header)
Otherwise → render:
  <div class="flex flex-col min-h-screen">
    <NavigationContainer title={currentPageTitle} />
    <main class="flex-1">
      <Outlet />
    </main>
  </div>
```

Page title is derived from the current route pathname:
- `/` → "Home"
- `/admin/users` → "Users"

### 1. Hooks

#### use-drawer.ts

```
State:
  - isOpen: boolean (default false)

Actions:
  - open() → sets isOpen to true
  - close() → sets isOpen to false
  - toggle() → flips isOpen

Returns: { isOpen, open, close, toggle }
```

Simple `useState` wrapper — extracted so container and views stay clean.

### 2. Types

**File:** `types.ts`

```
NavigationContainerProps:
  - title: string                    # Current page title

AppHeaderProps:
  - title: string                    # Displayed in center
  - onMenuClick: () => void          # Opens drawer

NavDrawerProps:
  - isOpen: boolean
  - onClose: () => void
  - username: string
  - isAdmin: boolean
  - currentPath: string              # For active link highlighting
  - onLogout: () => void
  - onNavigate: (path: string) => void

NavLinkProps:
  - icon: LucideIcon                 # Icon component from lucide-react
  - label: string
  - href: string
  - isActive: boolean
  - onClick: (path: string) => void
```

### 3. Views

#### app-header.tsx

Top sticky bar rendered on every authenticated page.

```
Layout (h-14, sticky top-0, z-40, bg-background, border-b):
  Left:   Button (ghost, icon) → Menu icon (lucide-react) → calls onMenuClick
  Center: <h1> with title text (font-semibold, text-lg)
  Right:  <ModeToggle /> (existing component)
```

Uses `flex items-center justify-between px-4` for layout.

#### nav-drawer/nav-drawer.tsx

Slide-out sheet from left side using shadcn `Sheet` (side="left").

```
Layout:
  SheetHeader:
    - Username (text-lg, font-bold)
    - Admin badge if isAdmin (small accent-colored badge, text "Admin")

  Separator

  Nav section (flex-1, py-4):
    - NavLink: icon=Home,   label="Home",  href="/"
    - NavLink: icon=Users,  label="Users", href="/admin/users"  (only if isAdmin)

  Separator

  Footer (pb-6):
    - NavLink: icon=LogOut, label="Log out", href="logout" (triggers onLogout instead of navigation)
```

#### nav-drawer/nav-link.tsx

Single row in the drawer. Pure component.

```
Layout (flex items-center gap-3, px-3 py-3, rounded-lg):
  - Icon component (size 20, muted-foreground, or accent if active)
  - Label text (text-sm, font-medium)
  - If active: bg-accent/10 background tint

  onClick → calls onClick(href)
```

Active state determined by `isActive` prop (compared in container).

### 4. Container

**File:** `container.tsx`

```
Wiring:
  - useAuth() → { user, logout }
  - useDrawer() → { isOpen, open, close }
  - useRouterState() → current pathname
  - useNavigate() → for programmatic navigation

  handleNavigate(path):
    if path === "logout" → logout() and navigate to /login
    else → navigate(path) and close drawer

  Renders:
    <>
      <AppHeader title={title} onMenuClick={open} />
      <NavDrawer
        isOpen={isOpen}
        onClose={close}
        username={user?.username ?? ""}
        isAdmin={user?.is_admin ?? false}
        currentPath={pathname}
        onLogout={logout}
        onNavigate={handleNavigate}
      />
    </>
```

### 5. Route File for Admin Users (placeholder)

**File:** `src/routes/admin/users.tsx`

```
beforeLoad:
  - Check useAuthStore.getState().token → redirect /login if missing
  - Check useAuthStore.getState().user?.is_admin → redirect / if not admin

Component:
  - Placeholder <div>Users CRUD coming soon</div> (actual CRUD from separate spec)
```

This requires creating `src/routes/admin/` directory and the route file so TanStack Router auto-generates the route tree entry.

## Visual Reference

### Header Bar (mobile, 375px)
```
┌─────────────────────────────────┐
│ ☰         Home          ☀/🌙   │  h-14, sticky
├─────────────────────────────────┤
│                                 │
│         Page content            │
│                                 │
└─────────────────────────────────┘
```

### Drawer Open
```
┌──────────────────┬──────────────┐
│  dat.ta           │              │
│  Admin            │  (dimmed     │
│─────────────────  │   overlay)   │
│  🏠 Home          │              │
│  👥 Users         │              │
│                   │              │
│                   │              │
│                   │              │
│─────────────────  │              │
│  🚪 Log out       │              │
└──────────────────┴──────────────┘
```

## Styling Notes (Midnight Steel Theme)

- Header: `bg-background border-b border-border` — adapts to light/dark
- Drawer: `bg-background` — uses shadcn Sheet defaults
- Active nav link: `bg-accent/10 text-accent-foreground`
- Icons: lucide-react — `Menu`, `Home`, `Users`, `LogOut`, `Sun`, `Moon`
- Admin badge: `bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium`

## Test Strategy

Each component is a pure view (props only) — test with mock props:

- **app-header** — renders title, calls onMenuClick when hamburger tapped
- **nav-drawer** — shows username, shows/hides admin links, calls onLogout, calls onNavigate
- **nav-link** — renders icon + label, applies active styles, calls onClick
- **use-drawer** — open/close/toggle state transitions
- **container** — integration test: wiring hooks to views correctly
- **root route** — shows header on authenticated pages, hides on /login
