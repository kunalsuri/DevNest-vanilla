# API Reference

Base URL: `http://localhost:5000` (default). All endpoints are prefixed with `/api`
unless noted.

> **Interactive docs:** run the server and open `http://localhost:5000/api-docs` for the
> live OpenAPI / Swagger UI (non-production only). The raw spec is at `/api-docs.json`.

## Authentication model

- **Access token (JWT):** sent as `Authorization: Bearer <token>`; short-lived (~15 min).
- **Refresh token:** used at `POST /api/auth/refresh` to obtain a new access token.
- **CSRF:** all state-changing requests (`POST`/`PUT`/`PATCH`/`DELETE`) require a valid
  `X-CSRF-Token` header.
- **Admin routes** additionally require the authenticated user to have the `admin` role.

## Auth — `/api/auth`

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create a new user account |
| POST | `/api/auth/login` | Authenticate; issues access + refresh tokens |
| POST | `/api/auth/refresh` | Exchange a refresh token for a new access token |
| POST | `/api/auth/logout` | Revoke the current session |
| POST | `/api/auth/logout-all` | Revoke all of the user's sessions |
| GET | `/api/auth/user` | Get the current authenticated user |
| POST | `/api/auth/cleanup-sessions` | Prune expired sessions |
| POST | `/api/auth/password-reset/request` | Request a password-reset token |
| POST | `/api/auth/password-reset/confirm` | Confirm reset with a token |

## Profile — `/api/profile`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/profile` | Get the current user's profile |
| PUT | `/api/profile` | Update profile fields |
| POST | `/api/profile/upload-picture` | Upload a profile picture |
| DELETE | `/api/profile` | Delete the current user's account |
| GET | `/api/profile/preferences` | Get preferences (theme, notifications, etc.) |
| PUT | `/api/profile/preferences` | Update preferences |

## Admin — `/api/admin` (admin role required)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/admin/users` | List users (supports `limit` ≤ 200, `offset`) |
| GET | `/api/admin/users/:id` | Get a user by id |
| POST | `/api/admin/users` | Create a user |
| PATCH | `/api/admin/users/:id` | Update a user |
| PATCH | `/api/admin/users/:id/role` | Change a user's role |
| DELETE | `/api/admin/users/:id` | Delete a user |
| GET | `/api/admin/stats` | Aggregate user/usage stats |
| GET | `/api/admin/audit-log` | Read the audit log |

### Feature flags — `/api/admin/feature-flags` (admin role required)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/admin/feature-flags` | List all flags |
| GET | `/api/admin/feature-flags/:key` | Get a flag |
| POST | `/api/admin/feature-flags` | Create a flag |
| PUT | `/api/admin/feature-flags/:key` | Replace a flag |
| PATCH | `/api/admin/feature-flags/:key` | Toggle / partially update a flag |
| DELETE | `/api/admin/feature-flags/:key` | Delete a flag |

## Observability & health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | none | Liveness probe |
| GET | `/health/ready` | none | Readiness probe |
| POST | `/api/logs` | user | Submit client logs |
| GET | `/api/logs` | admin | Retrieve collected logs |

## Partial / scaffolded

`Notifications` (`/api/notifications`) and `Subscriptions` (`/api/subscription`) endpoints
exist but are incomplete in this template — see the live `/api-docs` for current request and
response shapes before relying on them.
