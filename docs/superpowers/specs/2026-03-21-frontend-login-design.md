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
  - login(username, password) → uses useLogin().mutateAsync() → stores token in localStorage + store → fetches user via raw getMe() function → sets user in store
  - logout() → clears localStorage + store
  - initialize() → reads token from localStorage → sets token in store → validates via raw getMe() function → sets user on success, or catches 401 and calls clear() directly (does NOT rely on the interceptor for this)
```

**Important hook vs function distinction:**
- `login()` action uses `useLogin().mutateAsync()` — the hook is called at the top level of `useAuth`, and `mutateAsync` is used inside the login function
- `initialize()` calls the raw `getMe()` function (not the `useGetMe` hook) because it runs once on mount and doesn't need reactive caching
- `initialize()` catches 401 errors from `getMe()` and calls `clear()` directly, avoiding the 401 interceptor loop

### 3. Route Protection

**File:** `src/routes/__root.tsx` (modify existing)

- On mount, calls `initialize()` from `useAuth()`
- While initializing: show a loading spinner (full screen, centered)
- If not authenticated after init: redirect to `/login`
- If authenticated: render the app (Outlet)

**Login route** (`/login`) is the only route accessible without auth.
**If already authenticated and on `/login`:** redirect to `/`.

### 4. Login Page — Mobile-First

**File:** `src/routes/login.tsx`

**Layout:**
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

**Behavior:**
- HTML required attribute for validation (no fancy client-side validation)
- Submit calls `login()` from `useAuth()`
- On success: redirect to `/`
- On error: show "Invalid username or password" message below the form
- Button shows loading spinner while request is in flight
- If user is already authenticated: redirect to `/`

**Mobile considerations:**
- `inputmode` and `type` attributes for correct mobile keyboards
- `autocomplete` attributes for mobile autofill
- Touch targets minimum 44px
- Verify responsive viewport meta tag exists

## Components to Create

| Component | File | Purpose |
|-----------|------|---------|
| API mutator fix | `src/lib/axios.ts` | Fix fetch-style signature + interceptors |
| Auth store | `src/stores/auth-store.ts` | Pure Zustand state for token + user |
| useAuth hook | `src/hooks/use-auth.ts` | Orchestrates login/logout/initialize |
| Login page | `src/routes/login.tsx` | Login form route |
| Root route update | `src/routes/__root.tsx` | Auth gate + loading state |
| Remove App.tsx | `src/App.tsx` | Dead code — TanStack Router doesn't use it |

## Testing Strategy (TDD)

Since this project is learning TDD, tests are written before implementation:

1. **Auth store tests** — verify setToken, setUser, clear behaviors. No mocks needed (pure state).
2. **useAuth hook tests** — mock the raw Orval-generated functions (`login`, `getMe`) and the `useLogin` hook. Verify login/logout/initialize flows including 401 handling during initialize.
3. **Login page tests** — mock `useAuth` hook return values. Test form rendering, submission, error display, password visibility toggle.
4. **Axios interceptor tests** — mock Zustand store's `getState()`, verify header injection with token present/absent, verify 401 triggers store clear.

## Backend API Reference

- `POST /api/v1/auth/login` — body: `{ username, password }` → response: `{ access_token, token_type }`
- `GET /api/v1/auth/me` — header: `Authorization: Bearer <token>` → response: `UserRead`
- Error: 401 `{ detail: "Invalid credentials" }`
