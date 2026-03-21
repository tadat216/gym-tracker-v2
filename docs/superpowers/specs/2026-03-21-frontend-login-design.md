# Frontend Login UI Design

## Overview

Mobile-first login page for the gym tracker app using shadcn/ui components, Zustand for auth state, and Orval-generated TanStack Query hooks for API communication.

## Decisions

- **Auth state:** Zustand as pure client state (token + user), no API calls in the store
- **API calls:** Orval-generated hooks (`useLogin()`, `useGetMe()`) handle server communication
- **Orchestration:** A `useAuth()` custom hook composes the store + generated hooks
- **Token storage:** localStorage — token expiry is enforced server-side (JWT `exp` claim causes 401), no client-side TTL needed. The 401 response interceptor handles expired tokens.
- **Route protection:** Entire app requires login; unauthenticated users always see login page
- **Registration:** None — users are created by admin only
- **Target:** Mobile-first (mobile is the only priority)
- **Component pattern:** Hooks/Types/Views/Container — hooks own data + behavior, types define contracts, views are pure rendering (props only, no hooks), container bridges hooks → views. Route files are thin wrappers.

## Dependencies to Install

- `zustand` — client state management
- `lucide-react` — icons (eye/eye-off for password toggle)
- shadcn/ui CLI + components (`button`, `input`, `label`)

## Architecture

### 0. Fix API Mutator — Critical Prerequisite

**File:** `src/lib/axios.ts` (rewrite existing)

The current `api` function accepts a single `AxiosRequestConfig`, but Orval generates calls with a fetch-style signature: `api<T>(url, requestInit)` (two arguments). This mismatch must be fixed first.

Rewrite the `api` mutator to accept `(url: string, init?: RequestInit)` and translate to an Axios call internally:

```
api<T>(url: string, init?: RequestInit): Promise<T>
  - Maps fetch-style RequestInit (method, headers, body) to Axios config
  - Uses the shared Axios instance (so interceptors work)
  - Returns response.data
```

Token injection and 401 handling are added as Axios interceptors on the shared instance:
- **Request interceptor:** reads token from Zustand store (`useAuthStore.getState().token`), attaches `Authorization: Bearer <token>` header
- **Response interceptor:** on 401 response, clears token and user from both store and localStorage. **Exception:** does NOT trigger logout for requests during `initialize()` — that flow handles 401 gracefully on its own (see Section 2).

**Also:** Remove `App.tsx` — it's dead code since TanStack Router doesn't use it.

### 1. Auth State — Zustand Store

**File:** `src/stores/auth-store.ts`

```
State:
  - token: string | null
  - user: UserRead | null

Actions (pure state setters):
  - setToken(token: string | null)
  - setUser(user: UserRead | null)
  - clear()  → resets token and user to null
```

No API calls in the store. Just state + setters.

### 2. Auth Orchestration — useAuth Hook

**File:** `src/hooks/use-auth.ts`

Composes Zustand store + Orval-generated functions:

```
Returns:
  - user: UserRead | null (from store)
  - isAuthenticated: boolean (derived: token !== null)
  - isLoading: boolean (true during initialize or login)
  - login(username, password) → calls raw login() function → stores token in localStorage + store → fetches user via raw getMe() function → sets user in store
  - logout() → clears localStorage + store
  - initialize() → reads token from localStorage → sets token in store → validates via raw getMe() function → sets user on success, or catches 401 and calls clear() directly (does NOT rely on the interceptor for this)
```

**Why raw functions instead of hooks:**
- Both `login()` and `initialize()` call the raw Orval-generated functions directly (not `useLogin`/`useGetMe` hooks). Since auth state lives in Zustand (not TanStack Query cache), the hook wrappers provide no benefit — they would add complexity without value.
- `initialize()` catches 401 errors from `getMe()` and calls `clear()` directly, avoiding the 401 interceptor loop

### 3. Route Protection

**File:** `src/routes/__root.tsx` (modify existing)

- On mount, calls `initialize()` from `useAuth()`
- While initializing: show a loading spinner (full screen, centered)
- If not authenticated after init: redirect to `/login`
- If authenticated: render the app (Outlet)

**Login route** (`/login`) is the only route accessible without auth.
**If already authenticated and on `/login`:** redirect to `/`.

### 4. Login Page — Mobile-First (Hooks/Types/Views/Container Pattern)

Following the frontend component structure skill:

```
src/components/login/
├── hooks/
│   └── index.ts              # re-exports useAuth (from src/hooks/use-auth.ts)
├── types.ts                  # LoginFormProps
├── views/
│   ├── login-form.tsx        # pure rendering — props only, no hooks
│   └── index.ts              # re-exports views
├── container.tsx             # calls useAuth, passes props to views, handles redirects
└── index.ts                  # public API — exports container
```

**Note:** `useAuth` lives in `src/hooks/use-auth.ts` (not inside this component) because it's shared across the app (root route, login, future components). The login component's `hooks/index.ts` re-exports it for local convenience.

**Route file:** `src/routes/login.tsx` is a thin wrapper that imports and renders `<Login />` from `src/components/login/`. TanStack Router requires the route file, but all logic lives in the component.

#### types.ts

```
LoginFormProps:
  - onSubmit(username: string, password: string): void
  - isLoading: boolean
  - error: string | null
```

#### views/login-form.tsx (pure rendering — no hooks)
- Receives `LoginFormProps` — no hooks, no side effects
- Local UI state for password visibility toggle is acceptable (UI-only `useState`)
- Full viewport height, vertically centered content
- No card wrapper on mobile — padded content directly on screen
- Large touch-friendly inputs and buttons (min 44px height)
- Generous vertical spacing between fields

**Components (shadcn):**
- `Input` — username and password fields, full width
- `Button` — full width submit, loading state with spinner
- `Label` — field labels

**Form fields:**
- Username: `type="text"`, `autocomplete="username"`, required
- Password: `type="password"` / `type="text"` toggle, `autocomplete="current-password"`, required
- Password visibility toggle: eye/eye-off icon button, thumb-friendly size

**Mobile considerations:**
- `inputmode` and `type` attributes for correct mobile keyboards
- `autocomplete` attributes for mobile autofill
- Touch targets minimum 44px
- Verify responsive viewport meta tag exists

#### container.tsx (bridges hooks → views)
- Calls `useAuth()` hook
- Handles form submission → calls `login()`
- Manages error state from failed login
- Redirects to `/` on success or if already authenticated
- Passes `onSubmit`, `isLoading`, `error` as props to `LoginForm` view

## Components to Create

| Component | Layer | File | Purpose |
|-----------|-------|------|---------|
| API mutator fix | infra | `src/lib/axios.ts` | Fix fetch-style signature + interceptors |
| Auth store | state | `src/stores/auth-store.ts` | Pure Zustand state for token + user |
| useAuth hook | hook | `src/hooks/use-auth.ts` | Shared orchestration: login/logout/initialize |
| Login types | types | `src/components/login/types.ts` | LoginFormProps interface |
| LoginForm view | view | `src/components/login/views/login-form.tsx` | Pure rendering (props only) |
| Login container | container | `src/components/login/container.tsx` | Calls hooks, passes props to views |
| Login index | export | `src/components/login/index.ts` | Public API |
| Login route | route | `src/routes/login.tsx` | Thin wrapper rendering Login container |
| Root route update | route | `src/routes/__root.tsx` | Auth gate + loading state |
| Remove App.tsx | cleanup | `src/App.tsx` | Dead code — TanStack Router doesn't use it |

## Testing Strategy (TDD)

Since this project is learning TDD, tests are written before implementation:

1. **Auth store tests** — verify setToken, setUser, clear behaviors. No mocks needed (pure state).
2. **useAuth hook tests** — mock the raw Orval-generated functions (`login`, `getMe`) and the `useLogin` hook. Verify login/logout/initialize flows including 401 handling during initialize.
3. **LoginForm view tests** — no mocks needed for hooks. Pass props directly. Test form rendering, password visibility toggle, onSubmit callback fired with correct values, error message display, loading state on button.
4. **Login container tests** — mock `useAuth` hook return values. Test that it renders LoginForm with correct props, handles redirect on success, redirects if already authenticated.
5. **Axios interceptor tests** — mock Zustand store's `getState()`, verify header injection with token present/absent, verify 401 triggers store clear.

## Backend API Reference

- `POST /api/v1/auth/login` — body: `{ username, password }` → response: `{ access_token, token_type }`
- `GET /api/v1/auth/me` — header: `Authorization: Bearer <token>` → response: `UserRead`
- Error: 401 `{ detail: "Invalid credentials" }`
