# Backend Auth & User Management — Design Spec

**Goal:** Implement JWT-based authentication and admin user CRUD for the gym tracker backend.

**Scope:** Backend only. Frontend auth will be a separate spec.

---

## Architecture

- JWT access token only (no refresh token), 7-day expiry
- Admin-creates-users pattern (no self-registration)
- First admin seeded on app startup from env vars
- `is_admin` boolean on User model for authorization
- All return types are Pydantic/SQLModel models (no raw dicts)
- Reuses existing `SECRET_KEY` and `ACCESS_TOKEN_EXPIRE_MINUTES` from `config.py`

## Dependencies

Add to `pyproject.toml`:
- `bcrypt` — password hashing
- `PyJWT` — JWT creation and verification

## File Structure

New packages require `__init__.py` files.

```
backend/app/
  models/
    __init__.py
    user.py              # User SQLModel table model
  schemas/
    __init__.py
    user.py              # UserCreate, UserUpdate, UserRead
    auth.py              # LoginRequest, TokenResponse, TokenPayload, MessageResponse
  auth/
    __init__.py
    password.py          # hash_password(), verify_password()
    jwt.py               # create_access_token(), decode_access_token()
    dependencies.py      # get_current_user(), get_current_admin()
  routes/
    __init__.py
    auth.py              # POST /auth/login, GET /auth/me
    users.py             # Admin CRUD endpoints
  main.py                # Add lifespan (admin seed), register routers

backend/tests/
  test_auth.py           # Login, token, me endpoint tests
  test_users.py          # Admin CRUD tests
```

Note: The User model must be imported before `SQLModel.metadata.create_all` runs (in `conftest.py` and Alembic `env.py`) so the table is registered with metadata.

## Data Model

### User table

| Column | Type | Constraints |
|--------|------|-------------|
| id | int | PK, auto-increment |
| username | str | unique, indexed |
| email | str | unique |
| password_hash | str | — |
| is_admin | bool | default False |
| created_at | datetime | default `datetime.now(UTC)` |

### Alembic Migration

One migration to create the `users` table. Alembic `env.py` already targets `SQLModel.metadata` — just ensure the User model is imported.

## Schemas

### `schemas/auth.py`

- **LoginRequest** — `username: str`, `password: str`
- **TokenResponse** — `access_token: str`, `token_type: str = "bearer"`
- **TokenPayload** — `sub: int`, `exp: datetime` (Note: `sub` is stored as string in JWT per convention, converted to `int` on decode)
- **MessageResponse** — `message: str`

### `schemas/user.py`

- **UserCreate** — `username: str`, `email: str`, `password: str`
- **UserUpdate** — `username: str | None = None`, `email: str | None = None`, `password: str | None = None`
- **UserRead** — `id: int`, `username: str`, `email: str`, `is_admin: bool`, `created_at: datetime`

## Auth Utilities

### `auth/password.py`

- `hash_password(plain: str) -> str` — bcrypt hash
- `verify_password(plain: str, hashed: str) -> bool` — bcrypt verify

### `auth/jwt.py`

- `create_access_token(user_id: int) -> str` — signs `{"sub": str(user_id), "exp": now + ACCESS_TOKEN_EXPIRE_MINUTES}` with `SECRET_KEY`
- `decode_access_token(token: str) -> TokenPayload` — verifies signature and expiry, casts `sub` back to `int`, returns `TokenPayload` or raises `HTTPException(401)`

### `auth/dependencies.py`

- `get_current_user(token: str, session: AsyncSession) -> User` — extracts Bearer token from Authorization header via `OAuth2PasswordBearer`, decodes it, loads user from DB. Raises 401 if token invalid or user not found.
- `get_current_admin(user: User) -> User` — depends on `get_current_user`, raises 403 if `user.is_admin` is False.

## API Endpoints

### Auth Router — prefix `/api/v1/auth`

| Method | Path | Auth | Request Body | Response | Description |
|--------|------|------|-------------|----------|-------------|
| POST | `/login` | None | `LoginRequest` | `TokenResponse` | Verify credentials, return JWT |
| GET | `/me` | User | — | `UserRead` | Return current user profile |

### Users Router — prefix `/api/v1/users`

| Method | Path | Auth | Request Body | Response | Description |
|--------|------|------|-------------|----------|-------------|
| GET | `/` | Admin | — | `list[UserRead]` | List all users (no pagination — deferred, user count is small) |
| GET | `/{id}` | Admin | — | `UserRead` | Get user by ID |
| POST | `/` | Admin | `UserCreate` | `UserRead` | Create new user |
| PATCH | `/{id}` | Admin | `UserUpdate` | `UserRead` | Update user fields |
| DELETE | `/{id}` | Admin | — | `MessageResponse` | Delete user (admin cannot delete themselves — returns 400) |

### Error Responses

All error responses use FastAPI's `HTTPException`:
- **400 Bad Request** — admin trying to delete themselves
- **401 Unauthorized** — invalid/expired token, wrong credentials
- **403 Forbidden** — user is not admin
- **404 Not Found** — user ID doesn't exist
- **409 Conflict** — duplicate username or email

## Admin Seed

### Config Changes

Add to `Settings` in `config.py` (alongside existing `SECRET_KEY` and `ACCESS_TOKEN_EXPIRE_MINUTES`):
- `ADMIN_USERNAME: str = "admin"`
- `ADMIN_EMAIL: str = "admin@gym-tracker.local"`
- `ADMIN_PASSWORD: str = "changeme"`

Also update `backend/.env.example` with the new `ADMIN_*` variables.

### Startup Logic

In `main.py`, use FastAPI lifespan:
1. On startup, open a DB session
2. Check if any user with `is_admin=True` exists
3. If not, create one from `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
4. Idempotent — safe to run on every startup

## Testing Strategy

### `tests/test_auth.py`

- Login with valid credentials → 200 + TokenResponse
- Login with wrong password → 401
- Login with non-existent username → 401
- GET /me with valid token → 200 + UserRead
- GET /me with no token → 401
- GET /me with expired token → 401

### `tests/test_users.py`

- List users as admin → 200 + list
- List users as non-admin → 403
- List users with no token → 401
- Create user as admin → 201 + UserRead
- Create user with duplicate username → 409
- Create user with duplicate email → 409
- Get user by ID as admin → 200
- Get non-existent user → 404
- Update user as admin → 200
- Update user with duplicate username → 409
- Update user with duplicate email → 409
- Delete user as admin → 200 + MessageResponse
- Delete non-existent user → 404
- Delete self as admin → 400
- Delete user as non-admin → 403

### Test Fixtures (in `conftest.py`)

- `admin_user` — creates an admin user in the test DB
- `regular_user` — creates a non-admin user
- `admin_token` — JWT for the admin user
- `user_token` — JWT for the regular user
- `admin_client` — AsyncClient with admin Authorization header
- `user_client` — AsyncClient with user Authorization header
