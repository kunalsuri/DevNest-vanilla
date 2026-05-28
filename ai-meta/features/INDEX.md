# Feature Index — DevNest-Vanilla

> Each feature below is a logical unit of functionality.
> Safety levels: LOW | MEDIUM | HIGH | CRITICAL
> Status: STABLE | PARTIAL | EXPERIMENTAL | UNKNOWN

---

## Feature List

| ID | Feature | Safety Level | Status | Spec | Eval |
|---|---|---|---|---|---|
| F-01 | Authentication (JWT) | HIGH | STABLE | [spec](../specs/authentication/spec.md) | [eval](../evaluations/authentication/eval.md) |
| F-02 | User Profile | MEDIUM | STABLE | — | — |
| F-03 | Account Preferences | MEDIUM | STABLE | — | — |
| F-04 | Admin User Management | HIGH | STABLE | — | — |
| F-05 | Feature Flags | MEDIUM | STABLE | — | — |
| F-06 | Notifications | MEDIUM | PARTIAL | — | — |
| F-07 | Subscriptions | MEDIUM | PARTIAL | — | — |
| F-08 | Dashboard | LOW | PARTIAL | — | — |
| F-09 | Workspaces | LOW | PARTIAL | — | — |
| F-10 | Observability (Client) | MEDIUM | STABLE | — | — |
| F-11 | Observability (Server) | MEDIUM | STABLE | — | — |
| F-12 | Storage Layer | CRITICAL | STABLE | — | — |
| F-13 | App Shell / Navigation | LOW | STABLE | — | — |
| F-14 | Health Checks | LOW | STABLE | — | — |
| F-15 | API Documentation (Swagger) | LOW | STABLE | — | — |

---

## F-01: Authentication (JWT)

**Safety Level:** HIGH
**Status:** STABLE

Full JWT-based authentication system with access tokens, refresh tokens, CSRF protection,
session management, account lockout, and password reset.

Server: `server/auth/`, `server/services/auth-service.ts`
Client: `client/src/features/auth/`, `client/src/pages/auth-page.tsx`

---

## F-02: User Profile

**Safety Level:** MEDIUM
**Status:** STABLE

Authenticated users can view and update their professional profile fields (name, position,
department, phone, office location, profile picture upload).

Server: `server/profile.ts`, `server/services/user-service.ts`
Client: `client/src/features/user-profile/`, `client/src/pages/profile-page.tsx`

---

## F-03: Account Preferences

**Safety Level:** MEDIUM
**Status:** STABLE

Per-user preferences: theme (light/dark/system), notification toggles, 2FA toggle (UI only),
auto-logout. Persisted per-user in `data/preferences.json`.

Server: `server/profile.ts` (preference endpoints), `server/storage.ts`
Client: `client/src/pages/preferences-page.tsx`

---

## F-04: Admin User Management

**Safety Level:** HIGH
**Status:** STABLE

Admin-only CRUD on user accounts: list users, view detail, change roles, delete users.
Protected by `requireAdmin` middleware.

Server: `server/api/admin-routes.ts`, `server/services/user-service.ts`
Client: `client/src/pages/admin-users-page.tsx`

---

## F-05: Feature Flags

**Safety Level:** MEDIUM
**Status:** STABLE

Admin-controlled feature flags persisted in `data/feature-flags.json`. Service evaluates
flags per-user with optional user/role targeting. Admin UI to toggle flags.

Server: `server/api/feature-flag-routes.ts`, `server/services/feature-flag-service.ts`
Client: Consumed via API calls where flags are checked

---

## F-06: Notifications

**Safety Level:** MEDIUM
**Status:** PARTIAL

In-app notification system. CRUD endpoints exist. Full client-side notification center
is partially implemented (API wired, full UI scaffold may be incomplete).

Server: `server/api/notification-routes.ts`, `server/services/notification-service.ts`
Client: Notification UI components (PARTIAL)

---

## F-07: Subscriptions

**Safety Level:** MEDIUM
**Status:** PARTIAL

Subscription plan management. API endpoints scaffolded. Business logic for plan enforcement
is not fully implemented — marked PARTIAL based on code evidence.

Server: `server/api/subscription-routes.ts`, `server/services/subscription-service.ts`
Client: Subscription UI (PARTIAL)

---

## F-08: Dashboard

**Safety Level:** LOW
**Status:** PARTIAL

Authenticated main dashboard page with stats widgets. Component scaffold exists;
real-time or persisted data binding is partial.

Client: `client/src/pages/dashboard-page.tsx`, `client/src/features/dashboard/`

---

## F-09: Workspaces

**Safety Level:** LOW
**Status:** PARTIAL

Workspaces page exists (`workspaces-page.tsx`) but no corresponding server API routes
were found. Assumed to be a UI scaffold awaiting backend implementation.

Client: `client/src/pages/workspaces-page.tsx`

---

## F-10: Observability (Client)

**Safety Level:** MEDIUM
**Status:** STABLE

Client-side error capture (Sentry), structured logging to server (`/api/logs`),
performance metrics, trace context propagation, error boundary component.

Client: `client/src/lib/logger.ts`, `client/src/lib/error-logger.ts`,
        `client/src/lib/tracing.ts`, `client/src/lib/metrics.ts`,
        `client/src/lib/sentry.ts`, `client/src/features/observability/`

---

## F-11: Observability (Server)

**Safety Level:** MEDIUM
**Status:** STABLE

Winston structured logging (daily rotate files), Sentry Node SDK, distributed trace
middleware (`X-Trace-Id`), audit log service, Swagger API docs.

Server: `server/logger.ts`, `server/monitoring/sentry.ts`,
        `server/middleware/trace-middleware.ts`, `server/services/audit-log-service.ts`

---

## F-12: Storage Layer

**Safety Level:** CRITICAL
**Status:** STABLE

`FileStorage` class implements `IStorage` interface. All data persisted as JSON files
in `data/`. Mutex-protected writes. Optional PostgreSQL migration path via Drizzle Kit.

Server: `server/storage.ts`, `shared/schema.ts`, `drizzle.config.ts`

---

## F-13: App Shell / Navigation

**Safety Level:** LOW
**Status:** STABLE

Sidebar, top navigation bar, layout wrapper, route configuration, theme provider.

Client: `client/src/features/app-shell/`, `client/src/components/theme-provider.tsx`

---

## F-14: Health Checks

**Safety Level:** LOW
**Status:** STABLE

Liveness (`GET /health`) and readiness (`GET /health/ready`) endpoints. No auth required.
Used by Docker Compose healthcheck.

Server: `server/health.ts`

---

## F-15: API Documentation (Swagger)

**Safety Level:** LOW
**Status:** STABLE

OpenAPI 3.0 docs auto-generated from JSDoc annotations. Served at `/api-docs`.

Server: `server/swagger.ts`
