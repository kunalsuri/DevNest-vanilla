# Feature Map — AI-Readable Feature Registry

> **Purpose:** Comprehensive, machine-parsable feature registry for autonomous AI agents.
> **Last Updated:** 2026-05-28
> **Maintenance:** Update immediately when features are added, modified, or removed.

---

## Overview

This file provides a complete inventory of all features in DevNest-Vanilla. It serves as the
primary source of truth for AI agents to understand:

- What features exist and their current state
- Where feature code lives (backend/frontend/shared)
- Dependencies between features
- API contracts and database interactions
- Testing coverage and known limitations
- Technical debt and planned improvements

---

## Feature Registry

| Feature ID | Feature Name | Description | Status | Safety | Owner | Tech Debt | Notes |
|------------|--------------|-------------|--------|--------|-------|-----------|-------|
| F-01 | Authentication (JWT) | Complete JWT auth system with access/refresh tokens, CSRF, session management, lockout | STABLE | HIGH | Auth | Email delivery not impl | See authentication.md |
| F-02 | User Profile | User profile CRUD with picture upload, professional info | STABLE | MEDIUM | Profile | None | Fully tested |
| F-03 | Account Preferences | Per-user preferences: theme, notifications, 2FA toggle (UI only), auto-logout | STABLE | MEDIUM | Profile | 2FA backend missing | 2FA UI exists but no server logic |
| F-04 | Admin User Management | Admin-only user CRUD: list, view, role change, delete | STABLE | HIGH | Admin | None | Protected by requireAdmin |
| F-05 | Feature Flags | Admin-controlled feature flags with per-user targeting | STABLE | MEDIUM | Admin | None | JSON-based storage |
| F-06 | Notifications | In-app notification system with CRUD endpoints | PARTIAL | MEDIUM | Notifications | UI incomplete | API complete, client partial |
| F-07 | Subscriptions | Subscription plan management | PARTIAL | MEDIUM | Subscriptions | Business logic incomplete | API scaffolded |
| F-08 | Dashboard | Main authenticated dashboard with stats widgets | PARTIAL | LOW | Dashboard | Data binding partial | UI scaffold exists |
| F-09 | Workspaces | Multi-workspace support | PARTIAL | LOW | Workspaces | No backend API | Client UI only |
| F-10 | Observability (Client) | Client-side error capture, logging, metrics, tracing | STABLE | MEDIUM | Observability | None | Sentry integrated |
| F-11 | Observability (Server) | Server logging, Sentry, distributed tracing, audit logs | STABLE | MEDIUM | Observability | None | Winston + Sentry |
| F-12 | Storage Layer | FileStorage implementation with JSON persistence | STABLE | CRITICAL | Storage | Scale bottleneck | Migration path to PG available |
| F-13 | App Shell / Navigation | Sidebar, navbar, layouts, routing, theme provider | STABLE | LOW | UI | None | Responsive design |
| F-14 | Health Checks | Liveness and readiness endpoints | STABLE | LOW | Health | None | Used by Docker |
| F-15 | API Documentation | OpenAPI 3.0 docs via Swagger | STABLE | LOW | Docs | None | Auto-generated from JSDoc |

---

## Feature Details

### F-01: Authentication (JWT)

**Description:** Complete JWT authentication system with access tokens (15min TTL), refresh tokens (7d TTL), CSRF protection, session management, account lockout after 10 failed attempts, and password reset flow.

**Status:** STABLE | **Safety:** HIGH | **Owner:** Auth

**Entry Points:**
- Server: `POST /api/auth/register`, `/login`, `/logout`, `/logout-all`, `/refresh`, `GET /api/auth/user`, password reset endpoints
- Client: `client/src/pages/auth-page.tsx`, `client/src/features/auth/`

**Related Files:**
- Backend: `server/auth/jwt-auth-routes.ts`, `auth-middleware.ts`, `jwt-utils.ts`, `session-manager.ts`, `server/services/auth-service.ts`
- Frontend: `client/src/features/auth/`, `client/src/lib/protected-route.tsx`, `client/src/lib/queryClient.ts`
- Shared: `shared/schema.ts` (JWT schemas, user types)

**APIs:**
- `POST /api/auth/register` — Create new user account
- `POST /api/auth/login` — Authenticate and issue tokens
- `POST /api/auth/refresh` — Refresh access token using refresh token
- `POST /api/auth/logout` — Revoke current session
- `POST /api/auth/logout-all` — Revoke all user sessions
- `GET /api/auth/user` — Get current authenticated user
- `POST /api/auth/password-reset/request` — Request password reset
- `POST /api/auth/password-reset/confirm` — Confirm password reset

**State Management:**
- Client: TanStack Query + local token storage
- Server: Session state in `data/sessions.json` via SessionManager

**Database Tables:**
- `users` table: password (bcrypt), role, failedLoginAttempts, lockedUntil
- Sessions: sessionId, userId, refreshTokenHash, csrfTokenHash, userAgent, ip, timestamps

**Dependencies:**
- Internal: Storage Layer (F-12), User Service
- External: jsonwebtoken, bcryptjs, express middleware

**Feature Flags:** None

**Test Coverage:**
- Unit: Auth service tests expected in `tests/unit/server/`
- Integration: `tests/integration/integration.test.ts` (register, login, logout)
- **Gap:** No unit tests for jwt-utils.ts or session-manager.ts

**Tech Debt:**
- Email delivery not implemented (password reset tokens generated but not sent)
- 2FA preference field exists but no server-side enforcement
- Sessions stored in flat JSON (scale bottleneck)
- No access token revocation list (relies on short TTL)

**Known Limitations:**
- Access tokens valid until expiry even after logout (15min window)
- Account lockout can reveal whether username exists
- Session cleanup runs on schedule, not real-time

**Roadmap:**
- Implement email delivery service
- Add 2FA TOTP support
- Migrate sessions to database for scale
- Add WebAuthn/passkey support

---

### F-02: User Profile

**Description:** Authenticated users can view and update professional profile fields including name, position, department, phone, office location, and profile picture upload.

**Status:** STABLE | **Safety:** MEDIUM | **Owner:** Profile

**Entry Points:**
- Server: `GET/PUT /api/profile`, `POST /api/profile/upload-picture`
- Client: `client/src/pages/profile-page.tsx`

**Related Files:**
- Backend: `server/profile.ts`, `server/services/user-service.ts`
- Frontend: `client/src/features/user-profile/`, components, hooks, API layer
- Shared: `shared/schema.ts` (PublicUser, UpdateProfileInput)

**APIs:**
- `GET /api/profile` — Retrieve current user profile
- `PUT /api/profile` — Update profile fields
- `POST /api/profile/upload-picture` — Upload profile avatar
- `DELETE /api/profile` — Delete user account

**State Management:**
- Client: TanStack Query with `useProfile` hook
- Server: Storage Layer persistence

**Database Tables:**
- `users` table: name, email, position, department, phoneNumber, officeLocation, profilePicture

**Dependencies:**
- Internal: Auth (F-01), Storage Layer (F-12)
- External: multer (file upload), express-validator

**Feature Flags:** None

**Test Coverage:**
- Integration: Profile endpoints tested in integration suite
- Unit: User service tests in `tests/unit/user-service.test.ts`

**Tech Debt:** None identified

**Known Limitations:**
- Profile pictures stored in `data/uploads/` (not cloud storage)
- No image optimization or thumbnailing

**Roadmap:**
- Add cloud storage integration (S3/GCS)
- Implement profile picture cropping UI
- Add profile activity timeline

---

### F-03: Account Preferences

**Description:** Per-user preference management including theme (light/dark/system), notification toggles, 2FA toggle (UI only), and auto-logout duration. Persisted in `data/preferences.json`.

**Status:** STABLE | **Safety:** MEDIUM | **Owner:** Profile

**Entry Points:**
- Server: `GET/PUT /api/profile/preferences`
- Client: `client/src/pages/preferences-page.tsx`

**Related Files:**
- Backend: `server/profile.ts` (preference endpoints), `server/storage.ts`
- Frontend: `client/src/pages/preferences-page.tsx`, theme provider
- Shared: `shared/schema.ts` (PreferencesSchema)

**APIs:**
- `GET /api/profile/preferences` — Get user preferences
- `PUT /api/profile/preferences` — Update preferences

**State Management:**
- Client: TanStack Query + next-themes provider
- Server: Preferences persisted per-user in JSON

**Database Tables:**
- `preferences.json`: theme, emailNotifications, pushNotifications, twoFactorEnabled, autoLogout

**Dependencies:**
- Internal: Auth (F-01), Storage Layer (F-12)
- External: next-themes

**Feature Flags:** None

**Test Coverage:**
- Integration: Preference endpoints in integration suite

**Tech Debt:**
- 2FA toggle exists but no backend enforcement
- Auto-logout not implemented on server side

**Known Limitations:**
- Preferences not cached client-side (fetched on page load)

**Roadmap:**
- Implement 2FA TOTP backend
- Add auto-logout server enforcement
- Add more granular notification preferences

---

### F-04: Admin User Management

**Description:** Admin-only interface for user management including list users, view details, change roles, and delete accounts. Protected by `requireAdmin` middleware.

**Status:** STABLE | **Safety:** HIGH | **Owner:** Admin

**Entry Points:**
- Server: `GET/POST /api/admin/users`, `GET/PATCH/DELETE /api/admin/users/:id`, `PATCH /api/admin/users/:id/role`
- Client: `client/src/pages/admin-users-page.tsx`

**Related Files:**
- Backend: `server/api/admin-routes.ts`, `server/services/user-service.ts`, `server/auth/auth-middleware.ts`
- Frontend: `client/src/pages/admin-users-page.tsx`
- Shared: `shared/schema.ts` (AdminStats, User types)

**APIs:**
- `GET /api/admin/users` — List all users (admin only)
- `POST /api/admin/users` — Create new user (admin only)
- `GET /api/admin/users/:id` — Get user details (admin only)
- `PATCH /api/admin/users/:id` — Update user (admin only)
- `DELETE /api/admin/users/:id` — Delete user (admin only)
- `PATCH /api/admin/users/:id/role` — Change user role (admin only)
- `GET /api/admin/stats` — System statistics (admin only)
- `GET /api/admin/audit-log` — View audit log (admin only)

**State Management:**
- Client: TanStack Query with admin hooks
- Server: User service with storage layer

**Database Tables:**
- `users` table: Full access to all user fields
- `audit.json`: Audit trail of admin actions

**Dependencies:**
- Internal: Auth (F-01), Storage Layer (F-12), Audit Service
- External: express-validator

**Feature Flags:** None

**Test Coverage:**
- Integration: Admin endpoints in integration suite
- Unit: User service tests include admin operations

**Tech Debt:** None identified

**Known Limitations:**
- No bulk user operations
- Audit log is append-only JSONL (no search/filter UI)

**Roadmap:**
- Add user bulk import/export
- Build audit log search interface
- Add user impersonation for support

---

### F-05: Feature Flags

**Description:** Admin-controlled feature flag system with per-user/per-role targeting. Flags stored in `data/feature-flags.json`. Allows gradual feature rollout and A/B testing.

**Status:** STABLE | **Safety:** MEDIUM | **Owner:** Admin

**Entry Points:**
- Server: `GET /api/admin/feature-flags`, `GET /api/admin/feature-flags/:key`, `POST /api/admin/feature-flags`, `PUT /api/admin/feature-flags/:key`, `PATCH /api/admin/feature-flags/:key`, `DELETE /api/admin/feature-flags/:key`
- Client: Feature flag checks in components via API

**Related Files:**
- Backend: `server/api/feature-flag-routes.ts`, `server/services/feature-flag-service.ts`
- Frontend: Components that check flags
- Shared: Feature flag types

**APIs:**
- `GET /api/admin/feature-flags` — List all flags (admin only)
- `GET /api/admin/feature-flags/:key` — Get specific flag (admin only)
- `POST /api/admin/feature-flags` — Create/upsert flag (admin only)
- `PUT /api/admin/feature-flags/:key` — Replace flag (admin only)
- `PATCH /api/admin/feature-flags/:key` — Partial update flag (admin only)
- `DELETE /api/admin/feature-flags/:key` — Delete flag (admin only)

**State Management:**
- Server: In-memory cache + JSON file persistence
- Client: Query-based flag checks

**Database Tables:**
- `feature-flags.json`: key, enabled, description, targetUsers, targetRoles

**Dependencies:**
- Internal: Auth (F-01), Storage Layer (F-12)
- External: None

**Feature Flags:** None (feature enables itself)

**Test Coverage:**
- Unit: `tests/unit/feature-flag-service.test.ts`
- Integration: Admin feature flag tests in `tests/unit/server/feature-flag-admin.test.ts`

**Tech Debt:** None identified

**Known Limitations:**
- No flag versioning or history
- No percentage-based rollouts
- No client-side flag SDK

**Roadmap:**
- Add percentage-based gradual rollouts
- Implement flag audit trail
- Build client-side flag evaluation SDK

---

### F-06: Notifications

**Description:** In-app notification system with CRUD endpoints. Users can receive, read, and manage notifications.

**Status:** PARTIAL | **Safety:** MEDIUM | **Owner:** Notifications

**Entry Points:**
- Server: `GET /api/notifications`, `PATCH /api/notifications/read-all`, `PATCH /api/notifications/:id/read`, `DELETE /api/notifications/:id`
- Client: Notification components (partial)

**Related Files:**
- Backend: `server/api/notification-routes.ts`, `server/services/notification-service.ts`
- Frontend: Notification UI components (incomplete)
- Shared: Notification types

**APIs:**
- `GET /api/notifications` — List user notifications
- `PATCH /api/notifications/read-all` — Mark all notifications as read
- `PATCH /api/notifications/:id/read` — Mark a notification as read
- `DELETE /api/notifications/:id` — Delete notification

**State Management:**
- Server: Storage layer persistence
- Client: Query-based notification list

**Database Tables:**
- `notifications.json`: id, userId, title, message, type, read, createdAt

**Dependencies:**
- Internal: Auth (F-01), Storage Layer (F-12)
- External: None

**Feature Flags:** None

**Test Coverage:**
- Integration: Notification endpoints tested
- **Gap:** No client-side tests

**Tech Debt:**
- Full notification center UI incomplete
- No real-time notification delivery
- No email/push notification integration

**Known Limitations:**
- Notifications are pull-based (no push)
- No notification preferences per type
- No notification batching

**Roadmap:**
- Complete notification center UI
- Add WebSocket/SSE for real-time notifications
- Integrate email delivery
- Add push notification support (PWA)

---

### F-07: Subscriptions

**Description:** Subscription plan management system. API endpoints scaffolded for plan CRUD and user subscription management.

**Status:** PARTIAL | **Safety:** MEDIUM | **Owner:** Subscriptions

**Entry Points:**
- Server: `GET /api/subscription/plans`, `GET /api/subscription`
- Client: Subscription UI (partial)

**Related Files:**
- Backend: `server/api/subscription-routes.ts`, `server/services/subscription-service.ts`
- Frontend: Subscription management UI (incomplete)
- Shared: Subscription types

**APIs:**
- `GET /api/subscription/plans` — List available plans (public)
- `GET /api/subscription` — Get current user's active subscription (authenticated)

**State Management:**
- Server: Storage layer persistence
- Client: Query-based plan management

**Database Tables:**
- `subscriptions.json`: Plan definitions
- User subscription state (location TBD)

**Dependencies:**
- Internal: Auth (F-01), Storage Layer (F-12)
- External: Payment processor (not integrated)

**Feature Flags:** None

**Test Coverage:**
- **Gap:** Limited test coverage

**Tech Debt:**
- Business logic for plan enforcement not implemented
- No payment integration
- User subscription assignment incomplete

**Known Limitations:**
- No payment processor integration
- No subscription lifecycle hooks
- No usage metering

**Roadmap:**
- Integrate Stripe or similar payment processor
- Implement plan enforcement middleware
- Add usage-based billing
- Build subscription management UI

---

### F-08: Dashboard

**Description:** Main authenticated dashboard page with statistics widgets and overview cards.

**Status:** PARTIAL | **Safety:** LOW | **Owner:** Dashboard

**Entry Points:**
- Client: `client/src/pages/dashboard-page.tsx`

**Related Files:**
- Frontend: `client/src/features/dashboard/`, dashboard components
- Backend: Data sources for stats (various APIs)

**APIs:**
- Uses existing endpoints for data (admin stats, user profile, etc.)

**State Management:**
- Client: TanStack Query for data fetching

**Database Tables:**
- None (reads from various sources)

**Dependencies:**
- Internal: Auth (F-01), Admin API (F-04)
- External: recharts (for charts)

**Feature Flags:** None

**Test Coverage:**
- **Gap:** No dedicated dashboard tests

**Tech Debt:**
- Real-time data updates not implemented
- Static widget layout (no customization)
- Limited chart types

**Known Limitations:**
- Dashboard widgets are hardcoded
- No user customization of dashboard
- No data export functionality

**Roadmap:**
- Add real-time data updates
- Implement draggable widget layout
- Add dashboard customization
- Build data export functionality

---

### F-09: Workspaces

**Description:** Multi-workspace support for organizing users and resources.

**Status:** PARTIAL | **Safety:** LOW | **Owner:** Workspaces

**Entry Points:**
- Client: `client/src/pages/workspaces-page.tsx`

**Related Files:**
- Frontend: `client/src/pages/workspaces-page.tsx` (UI scaffold only)
- Backend: None (no API endpoints)

**APIs:**
- None (not implemented)

**State Management:**
- None

**Database Tables:**
- None (schema not defined)

**Dependencies:**
- Internal: Auth (F-01) when implemented
- External: None

**Feature Flags:** None

**Test Coverage:**
- None

**Tech Debt:**
- No backend API implementation
- Data model not defined
- User-workspace relationships undefined

**Known Limitations:**
- Feature is UI scaffold only
- No server-side implementation
- No data persistence

**Roadmap:**
- Define workspace data model
- Implement workspace CRUD APIs
- Add user-workspace membership
- Build workspace settings UI
- Implement workspace-scoped resources

---

### F-10: Observability (Client)

**Description:** Client-side observability including error capture, structured logging, performance metrics, and distributed tracing.

**Status:** STABLE | **Safety:** MEDIUM | **Owner:** Observability

**Entry Points:**
- Client: Error boundary, logger utilities, metrics collectors
- Server: `POST /api/logs` (log sink)

**Related Files:**
- Frontend: `client/src/lib/logger.ts`, `error-logger.ts`, `tracing.ts`, `metrics.ts`, `sentry.ts`, `client/src/features/observability/`, `client/src/components/error-boundary.tsx`
- Backend: `server/logging-endpoint.ts` (log collection)

**APIs:**
- `POST /api/logs` — Send client logs to server
- `GET /api/logs` — Retrieve logs (admin only)

**State Management:**
- Client: Local log buffering + batch send
- Server: Winston structured logging

**Database Tables:**
- Server logs in daily rotate files

**Dependencies:**
- Internal: Auth (F-01) for log API
- External: @sentry/react, winston (server-side)

**Feature Flags:** None

**Test Coverage:**
- Unit: Logger and metrics tests expected
- Integration: Error boundary rendering tests

**Tech Debt:** None identified

**Known Limitations:**
- No log search UI
- Client logs buffered in memory (lost on crash)
- No log sampling for high-volume scenarios

**Roadmap:**
- Add log search/filter UI
- Implement log sampling
- Add performance profiling
- Build real-user monitoring dashboard

---

### F-11: Observability (Server)

**Description:** Server-side observability including Winston structured logging, Sentry error tracking, distributed tracing with trace IDs, and audit logging.

**Status:** STABLE | **Safety:** MEDIUM | **Owner:** Observability

**Entry Points:**
- Server: Logger factory, Sentry initialization, trace middleware

**Related Files:**
- Backend: `server/logger.ts`, `server/monitoring/sentry.ts`, `server/middleware/trace-middleware.ts`, `server/services/audit-log-service.ts`

**APIs:**
- Logging: Internal logging via Winston
- Tracing: `X-Trace-Id` header propagation
- Audit: `server/services/audit-log-service.ts` writes to `data/audit.json`

**State Management:**
- Logs: Daily rotate files in `logs/`
- Audit: Append-only JSONL in `data/audit.json`

**Database Tables:**
- `audit.json`: Append-only audit trail

**Dependencies:**
- External: winston, winston-daily-rotate-file, @sentry/node

**Feature Flags:** None

**Test Coverage:**
- Unit: Logger initialization tests
- Integration: Trace middleware tests

**Tech Debt:** None identified

**Known Limitations:**
- Audit log is append-only (no search/filter)
- No log aggregation for multi-instance deployments
- No structured query interface

**Roadmap:**
- Add audit log search UI
- Implement log aggregation (ELK/Loki)
- Add distributed tracing visualization
- Build alerting on log patterns

---

### F-12: Storage Layer

**Description:** Storage abstraction layer with FileStorage implementation. All data persisted as JSON files in `data/` directory. Mutex-protected writes. Optional PostgreSQL migration via Drizzle Kit.

**Status:** STABLE | **Safety:** CRITICAL | **Owner:** Storage

**Entry Points:**
- Server: `server/storage.ts` (IStorage interface + FileStorage)

**Related Files:**
- Backend: `server/storage.ts`, `shared/schema.ts`, `drizzle.config.ts`
- Data: `data/*.json` files (users, sessions, preferences, etc.)

**APIs:**
- Internal API: IStorage interface methods (get, set, delete, query)

**State Management:**
- In-memory data + mutex-protected writes to JSON files

**Database Tables:**
- File-based: users.json, sessions.json, preferences.json, feature-flags.json, notifications.json, audit.json
- PostgreSQL: Schema defined in `shared/schema.ts` via Drizzle

**Dependencies:**
- External: drizzle-orm, @neondatabase/serverless (optional), async-mutex

**Feature Flags:** None

**Test Coverage:**
- Unit: Storage operations tested
- Integration: All features test storage indirectly

**Tech Debt:**
- JSON file storage is a scale bottleneck
- Concurrent writes limited by mutex
- No transactions or rollback support

**Known Limitations:**
- Single-instance only (no distributed writes)
- No backup/restore automation
- Query performance degrades with data size
- No database indexes

**Roadmap:**
- Complete PostgreSQL migration
- Add automatic backup schedule
- Implement query optimization
- Add database connection pooling

---

### F-13: App Shell / Navigation

**Description:** Application shell with sidebar navigation, top header, layout wrappers, route configuration, and theme provider.

**Status:** STABLE | **Safety:** LOW | **Owner:** UI

**Entry Points:**
- Client: `client/src/features/app-shell/`, `client/src/components/theme-provider.tsx`

**Related Files:**
- Frontend: `client/src/features/app-shell/components/` (sidebar, header, layout), `client/src/features/app-shell/config/navigation.ts`, `client/src/components/theme-provider.tsx`

**APIs:**
- None (client-side only)

**State Management:**
- Theme: next-themes provider
- Navigation: Wouter router

**Database Tables:**
- None

**Dependencies:**
- External: wouter, next-themes, lucide-react

**Feature Flags:** None

**Test Coverage:**
- Unit: Component rendering tests expected

**Tech Debt:** None identified

**Known Limitations:**
- Navigation config is hardcoded
- No user customization of sidebar
- No breadcrumb navigation

**Roadmap:**
- Add configurable navigation
- Implement breadcrumb trail
- Add keyboard shortcuts for navigation
- Support collapsible sidebar sections

---

### F-14: Health Checks

**Description:** Liveness and readiness endpoints for container orchestration and monitoring.

**Status:** STABLE | **Safety:** LOW | **Owner:** Health

**Entry Points:**
- Server: `GET /health`, `GET /health/ready`

**Related Files:**
- Backend: `server/health.ts`

**APIs:**
- `GET /health` — Liveness probe (always 200 OK)
- `GET /health/ready` — Readiness probe (checks dependencies)

**State Management:**
- None

**Database Tables:**
- None

**Dependencies:**
- Internal: Storage layer (for readiness check)
- External: None

**Feature Flags:** None

**Test Coverage:**
- Integration: `tests/integration/smoke.test.ts`

**Tech Debt:** None identified

**Known Limitations:**
- Readiness check only validates storage layer
- No dependency health details in response

**Roadmap:**
- Add detailed health check responses
- Implement dependency health checks
- Add startup probe support

---

### F-15: API Documentation

**Description:** OpenAPI 3.0 documentation auto-generated from JSDoc annotations. Served via Swagger UI at `/api-docs`.

**Status:** STABLE | **Safety:** LOW | **Owner:** Docs

**Entry Points:**
- Server: `GET /api-docs` (Swagger UI)

**Related Files:**
- Backend: `server/swagger.ts`, JSDoc comments in route files

**APIs:**
- `/api-docs` — Swagger UI
- `/api-docs.json` — OpenAPI JSON spec

**State Management:**
- None (generated on server start)

**Database Tables:**
- None

**Dependencies:**
- External: swagger-jsdoc, swagger-ui-express

**Feature Flags:** None

**Test Coverage:**
- None (documentation only)

**Tech Debt:** None identified

**Known Limitations:**
- Not all endpoints have JSDoc annotations
- No API versioning strategy
- No request/response examples for all endpoints

**Roadmap:**
- Complete JSDoc for all endpoints
- Add comprehensive request/response examples
- Implement API versioning
- Add interactive API testing in docs

---

## Cross-Cutting Concerns

### Security

**Features Involved:** F-01 (Auth), F-04 (Admin), All API features

**Implementation:**
- Helmet.js security headers (CSP, HSTS, X-Frame-Options)
- CSRF protection via double-submit cookie pattern
- Rate limiting: General limiter (100/15min) + Auth limiter (5/15min)
- bcrypt password hashing (cost 12)
- Account lockout after 10 failed login attempts
- JWT signature verification on all protected routes

**Files:**
- `server/index.ts` — Security middleware setup
- `server/auth/` — Auth implementation
- `server/middleware/` — Validation, rate limiting

**Test Coverage:** Integration tests cover auth security

**Tech Debt:**
- No security headers audit automation
- Rate limit configuration not per-route customizable
- No anomaly detection

---

### Error Handling

**Features Involved:** All features

**Implementation:**
- Express async error handler
- Sentry error capture (client + server)
- Error boundary components (React)
- Structured error responses with codes

**Files:**
- `server/index.ts` — Global error handler
- `server/monitoring/sentry.ts` — Sentry setup
- `client/src/components/error-boundary.tsx`
- `shared/error-codes.ts`

**Test Coverage:** Error scenarios tested per feature

**Tech Debt:**
- Error messages not internationalized
- No error recovery strategies
- Limited error context capture

---

### Validation

**Features Involved:** All API features

**Implementation:**
- Zod schemas for all inputs
- express-validator for request validation
- Client-side form validation with React Hook Form + Zod

**Files:**
- `shared/schema.ts` — Zod schemas
- `server/middleware/validation.ts` — Validation middleware
- Client forms use React Hook Form

**Test Coverage:** Validation tested per feature

**Tech Debt:**
- Not all endpoints have validation middleware
- Client validation duplicates server validation
- No automated validation test generation

---

## Dependency Graph

### Core Dependencies

```
Storage Layer (F-12)
  ├── Auth (F-01)
  │     ├── User Profile (F-02)
  │     ├── Preferences (F-03)
  │     ├── Admin (F-04)
  │     ├── Feature Flags (F-05)
  │     ├── Notifications (F-06)
  │     ├── Subscriptions (F-07)
  │     ├── Dashboard (F-08)
  │     ├── Workspaces (F-09)
  │     └── Observability Client (F-10)
  ├── Feature Flags (F-05)
  ├── Notifications (F-06)
  ├── Subscriptions (F-07)
  └── Observability Server (F-11)

App Shell (F-13)
  └── All authenticated client features

Health Checks (F-14) — Independent

API Docs (F-15) — Independent
```

### External Dependencies

**Production:**
- React 19 + React DOM
- Express 5
- TypeScript 5.6
- Drizzle ORM + PostgreSQL driver
- TanStack Query
- Wouter (routing)
- JWT libraries (jsonwebtoken)
- bcryptjs
- Zod
- Winston logging
- Sentry (client + server)
- Helmet, CORS, rate limiting
- shadcn/ui components

**Development:**
- Vite 7
- Vitest + Testing Library
- ESLint + Prettier
- Husky + lint-staged
- tsx (TypeScript execution)

---

## Update Workflows

### When to Update This File

**MANDATORY updates required when:**
1. Adding a new feature (create new entry)
2. Changing feature status (EXPERIMENTAL → STABLE, etc.)
3. Modifying safety level (e.g., LOW → HIGH after security review)
4. Adding/removing major APIs
5. Identifying new technical debt
6. Completing tech debt items
7. Adding/removing database tables
8. Changing feature dependencies

**OPTIONAL updates:**
1. Minor bug fixes (unless they affect known limitations)
2. Refactoring without behavior change
3. Test additions (unless filling coverage gaps)

### Update Process

1. **Before implementation:** Review feature map for context
2. **During implementation:** Note any deviations from documented state
3. **After implementation:** Update all relevant fields in feature entry
4. **Before PR merge:** Ensure feature map accurately reflects changes
5. **Periodic review:** Quarterly audit of all feature statuses

### Validation

Run this check before committing feature map changes:

```bash
# Check that all referenced files exist
# npm run validate:feature-map  # (future: not yet implemented)

# Ensure linting passes
npm run lint

# Type check
npm run check
```

---

## AI Agent Usage Guidelines

### Quick Navigation

**For feature lookup:**
1. Scan Feature Registry table for feature ID/name
2. Jump to detailed section for full context
3. Check Related Files for implementation location
4. Review Dependencies before making changes

**For codebase exploration:**
1. Identify relevant feature by functionality
2. Use Entry Points to understand API surface
3. Follow Related Files to locate implementation
4. Check Dependency Graph for impact analysis

**For planning:**
1. Review Status + Tech Debt for current state
2. Check Safety level for required precautions
3. Review Test Coverage for gaps
4. Consult Roadmap for planned work

### Common Queries

**"Where is authentication implemented?"**
→ F-01 (Authentication), Related Files section

**"What features are incomplete?"**
→ Scan Status column for PARTIAL entries

**"What depends on the storage layer?"**
→ F-12 (Storage Layer), Dependency Graph

**"What APIs exist for user management?"**
→ F-02 (User Profile) and F-04 (Admin User Management), APIs sections

**"What features have technical debt?"**
→ Scan Tech Debt column for non-empty entries

**"What's the safety level of changing auth code?"**
→ F-01, Safety: HIGH — requires security review

### Best Practices

1. **Always read feature entry before modifying related code**
2. **Update feature map in same commit as code changes**
3. **Add tech debt items as you discover them**
4. **Mark features PARTIAL if incomplete, not STABLE**
5. **Update test coverage gaps when adding tests**
6. **Document known limitations as you encounter them**

---

## Automation Opportunities

### Auto-generation Candidates

1. **API inventory:** Parse route definitions to extract endpoints
2. **File inventory:** Scan directories to validate Related Files lists
3. **Dependency extraction:** Analyze imports to build dependency graph
4. **Test coverage:** Parse test files to count feature coverage
5. **Tech debt tracking:** Parse TODO/FIXME comments for tech debt items

### CI Integration Ideas

1. **Staleness detection:** Warn if feature map not updated in 30 days
2. **File existence validation:** Fail if Related Files don't exist
3. **API drift detection:** Compare documented APIs to actual routes
4. **Coverage validation:** Fail if test coverage drops below threshold
5. **Safety level enforcement:** Require security review for HIGH safety changes

### Maintenance Scripts

```bash
# Validate feature map (to be implemented)
npm run validate:feature-map

# Generate feature file inventory
npm run generate:feature-inventory

# Update API listings from route definitions
npm run update:api-inventory

# Check for stale feature documentation
npm run check:stale-features
```

---

## Related Documentation

- [ai-meta/features/INDEX.md](features/INDEX.md) — High-level feature list
- [ai-meta/features/authentication.md](features/authentication.md) — Detailed auth feature doc
- [ai-meta/architecture/MODULE_MAP.md](architecture/MODULE_MAP.md) — File-to-module mapping
- [ai-meta/architecture/OVERVIEW.md](architecture/OVERVIEW.md) — System architecture
- [ai-meta/AGENT_GUIDE.md](AGENT_GUIDE.md) — Agent operating instructions
- [ai-meta/CHANGE_POLICY.md](CHANGE_POLICY.md) — What agents can modify

---

## Glossary

- **Safety Level:** Risk classification for changes (LOW, MEDIUM, HIGH, CRITICAL)
- **Status:** Implementation completeness (STABLE, PARTIAL, EXPERIMENTAL, DEPRECATED)
- **Owner:** Logical module owner for organizational purposes
- **Tech Debt:** Known issues or improvements needed
- **Entry Points:** User-facing APIs or UI pages
- **Related Files:** Implementation files for the feature
- **Dependencies:** Other features or services required

---

**Maintenance:** This file should be reviewed and updated with every feature change.
**Last Updated:** 2026-05-28
**Next Review:** 2026-08-28
