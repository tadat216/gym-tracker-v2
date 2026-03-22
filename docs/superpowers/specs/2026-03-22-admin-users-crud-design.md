# Admin Users CRUD Page Design

## Overview

Mobile-first admin user management page for the gym tracker app. Single-page layout with bottom sheet for create/edit forms. Full CRUD: list all users, create new users, edit any user, delete users. Only accessible to admin users.

## Decisions

- **Layout:** Single page + bottom sheet (no page transitions, native mobile feel)
- **Aesthetic:** Midnight Steel — dark navy background, cool blue accents, frosted glass cards, Manrope font
- **Delete UX:** Delete button inside edit sheet only, always with confirmation dialog
- **List rows:** Username, email, admin badge. Created date shown in edit sheet only.
- **Form reuse:** One `UserFormSheet` component handles both create and edit modes via a `mode` prop
- **No swipe gestures:** Keep interactions basic — tap only
- **No fancy animations:** Sheet open/close from shadcn is sufficient
- **Component granularity:** Small focused files — each state (loading, empty) is its own component for isolated testing
- **Data fetching:** Orval-generated hooks (`useListUsers`, `useCreateUser`, `useUpdateUser`, `useDeleteUser`). No optimistic UI — wait for server confirmation.
- **Component pattern:** Hooks/Types/Views/Container — same as login component

## Backend Prerequisites

Before building the frontend, the backend schemas need updating:

1. **Add `is_admin` to `UserCreate`:** `is_admin: bool = False` — allows admin to set admin flag when creating users
2. **Add `is_admin` to `UserUpdate`:** `is_admin: bool | None = None` — allows admin to toggle admin flag when editing users
3. **Regenerate API client:** Run `scripts/generate-api.sh` after backend changes so Orval picks up the new fields

These are small schema additions. The `update_user` handler uses `model_dump(exclude_unset=True)` + `setattr`, so it will handle `is_admin` automatically once added to the schema. The `create_user` handler manually constructs the `User` object, so it will also need `is_admin=body.is_admin` added to the constructor.

## Dependencies to Install

- shadcn/ui components: `sheet`, `alert-dialog`, `switch`, `badge`, `sonner` (toast)
- `@fontsource/manrope` or Google Fonts link for Manrope font

## Architecture

### 1. Route — Admin Guard

**File:** `src/routes/admin/users.tsx`

- `beforeLoad`: reads `useAuthStore.getState()`, checks token exists and user is admin
- If not admin → redirect to `/`
- Renders `<UsersContainer />` from `src/components/users`

### 2. Component Structure

```
src/components/users/
├── container.tsx
├── types.ts
├── index.ts
├── hooks/
│   ├── use-users-data.ts
│   ├── use-user-form.ts
│   └── index.ts
└── views/
    ├── users-page.tsx
    ├── user-form-sheet.tsx
    ├── user-list/
    │   ├── user-list.tsx
    │   ├── user-row.tsx
    │   ├── user-list-skeleton.tsx
    │   ├── user-list-empty.tsx
    │   └── index.ts
    ├── delete-confirm/
    │   ├── delete-confirm.tsx
    │   └── index.ts
    └── index.ts
```

### 3. Types

**File:** `src/components/users/types.ts`

```
UserFormMode: 'closed' | 'create' | 'edit'

UsersPageProps:
  - users: UserRead[]
  - isLoading: boolean
  - formMode: UserFormMode
  - formValues: UserFormValues
  - editingUser: UserRead | null
  - isSubmitting: boolean
  - isSelfSelected: boolean
  - submitError: string | null
  - isDeleting: boolean
  - deleteConfirmOpen: boolean
  - onCreateClick: () => void
  - onUserClick: (user: UserRead) => void
  - onFormChange: (field: string, value: string | boolean) => void
  - onFormSubmit: () => void
  - onFormClose: () => void
  - onDeleteClick: () => void
  - onDeleteConfirm: () => void
  - onDeleteCancel: () => void

UserListProps:
  - users: UserRead[]
  - onUserClick: (user: UserRead) => void

UserRowProps:
  - user: UserRead
  - onClick: () => void

UserListSkeletonProps: (none — stateless)

UserListEmptyProps: (none — stateless)

UserFormSheetProps:
  - mode: UserFormMode
  - open: boolean
  - values: UserFormValues
  - isSelfSelected: boolean
  - isSubmitting: boolean
  - error: string | null
  - onChange: (field: string, value: string | boolean) => void
  - onSubmit: () => void
  - onClose: () => void
  - onDeleteClick: () => void

UserFormValues:
  - username: string
  - email: string
  - password: string
  - is_admin: boolean

DeleteConfirmProps:
  - open: boolean
  - username: string
  - isDeleting: boolean
  - onConfirm: () => void
  - onCancel: () => void
```

### 4. Hooks

#### use-users-data.ts — Data layer

```
Uses Orval-generated hooks:
  - useListUsers() → user list + isLoading
  - useCreateUser() → mutation
  - useUpdateUser() → mutation
  - useDeleteUser() → mutation

Each mutation's onSuccess:
  - Invalidates listUsers query key (TanStack Query refetches)
  - Shows success toast via sonner

Returns:
  - users: UserRead[]
  - isLoading: boolean
  - createUser: (data: UserCreate) => Promise
  - updateUser: (userId: number, data: UserUpdate) => Promise
  - deleteUser: (userId: number) => Promise
  - isCreating: boolean
  - isUpdating: boolean
  - isDeleting: boolean
```

#### use-user-form.ts — Form state machine

```
State:
  - mode: UserFormMode ('closed' | 'create' | 'edit')
  - formValues: UserFormValues
  - editingUser: UserRead | null

Actions:
  - openCreate() → mode='create', reset all fields
  - openEdit(user: UserRead) → mode='edit', pre-fill fields from user, store editingUser
  - close() → mode='closed', reset
  - setField(field: string, value: string | boolean) → update single field
  - reset() → clear all fields to defaults

Returns: all state + actions
```

### 5. Container

**File:** `src/components/users/container.tsx`

Wires hooks to the page view:
- Calls `useUsersData()` for data + mutations
- Calls `useUserForm()` for form state
- Reads current user from `useAuth()` to detect self-selection (prevent self-delete)
- Manages `deleteConfirmOpen` state (boolean)
- Handles `onFormSubmit`:
  - Create mode: calls `createUser()` with form values, on success calls `close()`
  - Edit mode: builds partial update from changed fields only, calls `updateUser()`, on success calls `close()`
- Handles `onDeleteConfirm`: calls `deleteUser()`, on success closes dialog + form
- Handles errors: catches 409 from mutations, sets `submitError` to "Username or email already taken"
- Passes all props to `<UsersPage />`

### 6. Views (all pure — props only, no hooks)

#### users-page.tsx — Page composition

- Page header: "Users" title (Manrope 800) + "{count} members" subtitle
- Conditional content:
  - `isLoading` → `<UserListSkeleton />`
  - `users.length === 0` → `<UserListEmpty />`
  - Otherwise → `<UserList />`
- FAB button at bottom-right: "+" icon, calls `onCreateClick`
- Renders `<UserFormSheet />` (controlled by `formMode`)
- Renders `<DeleteConfirm />` (controlled by `deleteConfirmOpen`)

#### user-list/user-list.tsx — List rendering

- Maps `users` array to `<UserRow />` components
- No conditional logic (loading/empty handled by parent)

#### user-list/user-row.tsx — Single row

- Frosted glass card style (dark navy, subtle border)
- Avatar: rounded square with first letter of username, blue gradient background
- Username text + admin badge (conditional, uses shadcn Badge or styled span)
- Email text (truncated with ellipsis)
- Chevron icon on right
- Entire row is tappable → calls `onClick`

#### user-list/user-list-skeleton.tsx — Loading state

- Renders 3 skeleton rows mimicking user-row layout
- Shimmer animation on placeholder blocks

#### user-list/user-list-empty.tsx — Empty state

- Centered vertically
- User icon (from lucide-react)
- "No users yet" title
- "Tap the + button to create your first user" description

#### user-form-sheet.tsx — Bottom sheet form

- Uses shadcn `Sheet` (side="bottom")
- Drag handle at top
- Title: "New User" (create) or "Edit User" (edit)
- Form fields:
  - Username: text input
  - Email: text input
  - Password: text input, placeholder varies by mode ("Required" vs "Leave empty to keep current")
  - Administrator: shadcn Switch toggle
- Inline error message below form (red text, shown when `error` is set)
- Submit button: "Create User" or "Save Changes", shows loading state when `isSubmitting`
- Delete button: only in edit mode, red text style, calls `onDeleteClick`. Hidden when `isSelfSelected` (admin cannot delete themselves)

#### delete-confirm/delete-confirm.tsx — Confirmation dialog

- Uses shadcn `AlertDialog`
- Title: "Delete User?"
- Description: "Are you sure you want to delete **{username}**? This cannot be undone."
- Cancel button: muted style
- Delete button: destructive style, shows loading state when `isDeleting`

### 7. Visual Design — Midnight Steel Theme

**Colors:**
- Background: `#0c0f14`
- Card background: `rgba(255,255,255,0.03)` with `rgba(255,255,255,0.05)` border
- Sheet background: linear gradient `#141a24` → `#111620`
- Primary accent: `#64b4ff` (cool blue)
- Avatar gradient: `#1e2a3a` → `#2a3a4e`
- Text primary: `#e2e8f0`
- Text secondary: `#4a5568`
- Admin badge: `rgba(100,180,255,0.1)` bg, `#64b4ff` text
- Destructive: `#ff5a5a`
- Success toast: `#50c878` with dark green background

**Typography:**
- Font: Manrope
- Page title: 28px, weight 800
- User name: 15px, weight 700
- User email: 13px, weight 400
- Form labels: 11px, weight 700, uppercase, letter-spacing 1px
- Form inputs: 15px, weight 500

**Spacing:**
- Card padding: 14px 16px
- Card gap: 8px
- Card border-radius: 14px
- Avatar: 42px, border-radius 12px
- Sheet border-radius: 20px top
- FAB: 52px, border-radius 14px

**Components:**
- Rows: frosted glass effect with subtle border, blue border on hover
- Sheet: top border glow `rgba(100,180,255,0.1)`
- FAB: gradient `#1a3050` → `#264060` with blue glow shadow
- Skeleton: shimmer animation on dark navy placeholders

## Testing Strategy (TDD)

Tests written before implementation, following existing patterns:

1. **use-users-data tests** — mock Orval hooks, verify mutations call correct endpoints, verify query invalidation on success
2. **use-user-form tests** — pure state tests: openCreate resets fields, openEdit pre-fills, setField updates, close resets
3. **user-row tests** — renders username, email, admin badge conditionally, fires onClick
4. **user-list tests** — renders correct number of rows from user array
5. **user-list-skeleton tests** — renders skeleton placeholder rows
6. **user-list-empty tests** — renders empty message text
7. **user-form-sheet tests** — renders correct title/button per mode, fires onChange/onSubmit, shows delete button only in edit mode, hides delete when isSelfSelected, shows error message
8. **delete-confirm tests** — renders username, fires onConfirm/onCancel, shows loading state
9. **users-page tests** — shows skeleton when loading, shows empty when no users, shows list when users exist, shows FAB
10. **container tests** — mock hooks, verify wiring: create flow, edit flow, delete flow, error handling

## Backend API Reference

All endpoints require admin authentication (`Authorization: Bearer <token>`, user must have `is_admin=true`).

- `GET /api/v1/users` → `UserRead[]` — list all users
- `POST /api/v1/users` — body: `UserCreate { username, email, password, is_admin? }` → `UserRead` (201)
- `GET /api/v1/users/{user_id}` → `UserRead`
- `PATCH /api/v1/users/{user_id}` — body: `UserUpdate { username?, email?, password?, is_admin? }` → `UserRead`
- `DELETE /api/v1/users/{user_id}` → `MessageResponse { message }` (200)
- Error 409: duplicate username or email
- Error 400: admin cannot delete themselves
- Error 403: not an admin
