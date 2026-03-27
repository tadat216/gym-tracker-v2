# Copy Default Exercises on User Creation

## Summary

When an admin creates a new user, automatically copy the system user's muscle groups and exercises to the new user's library. The copy is best-effort — if it fails, user creation still succeeds (user starts with an empty library).

## Change

In `backend/app/routes/users.py` `create_user` endpoint:

1. After `session.flush()` (user has an `id`), look up the system user
2. Call `copy_defaults_to_user(session, system_user.id, user.id)`
3. Wrap the copy in `try/except` so failures don't block user creation
4. Log a warning if copy fails

## Files

| File | Change |
|------|--------|
| `backend/app/routes/users.py` | Import `copy_defaults_to_user`, look up system user, call copy after flush |
| `backend/tests/test_users.py` | Add test verifying new user gets default exercises copied |

## Edge Cases

- **No system user exists:** Skip copy, log warning
- **Copy fails mid-way:** Catch exception, user creation still completes
- **System user has no exercises:** Copy completes with nothing copied — fine
