# Agent Routing Guide — Feature-Based Agent Dispatch

> **Purpose:** Help AI agents determine which feature context to load based on user requests.
> **Last Updated:** 2026-05-28

---

## Overview

This guide helps AI agents quickly map user requests to the relevant feature(s) in the codebase.
Use this for:

- Determining which feature documentation to read
- Identifying feature ownership and safety level
- Understanding feature dependencies before making changes
- Routing complex requests to multiple feature contexts

---

## Request Type Classification

### 1. Authentication & Session Management

**Keywords:** login, signup, register, logout, password, session, token, JWT, refresh, CSRF, 2FA, auth

**Primary Feature:** F-01 (Authentication)

**Related Features:**
- F-02 (User Profile) — for post-login profile access
- F-03 (Account Preferences) — for 2FA settings
- F-04 (Admin User Management) — for admin auth operations

**Entry Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#f-01-authentication-jwt)
- [features/authentication.md](features/authentication.md)
- [specs/authentication/spec.md](specs/authentication/spec.md)

**Safety Level:** HIGH

---

### 2. User Profile & Account

**Keywords:** profile, user info, picture, avatar, upload, name, email, phone, department, position

**Primary Feature:** F-02 (User Profile)

**Related Features:**
- F-01 (Authentication) — for auth context
- F-03 (Account Preferences) — for preference management

**Entry Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#f-02-user-profile)
- [features/INDEX.md](features/INDEX.md#f-02-user-profile)

**Safety Level:** MEDIUM

---

### 3. Preferences & Settings

**Keywords:** settings, preferences, theme, dark mode, notifications, auto-logout, 2FA toggle

**Primary Feature:** F-03 (Account Preferences)

**Related Features:**
- F-01 (Authentication) — for auth context
- F-13 (App Shell) — for theme provider

**Entry Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#f-03-account-preferences)
- [features/INDEX.md](features/INDEX.md#f-03-account-preferences)

**Safety Level:** MEDIUM

---

### 4. Admin & User Management

**Keywords:** admin, manage users, delete user, change role, user list, audit log, stats

**Primary Feature:** F-04 (Admin User Management)

**Related Features:**
- F-01 (Authentication) — for requireAdmin middleware
- F-11 (Observability Server) — for audit logs

**Entry Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#f-04-admin-user-management)
- [features/INDEX.md](features/INDEX.md#f-04-admin-user-management)

**Safety Level:** HIGH

---

### 5. Feature Flags

**Keywords:** feature flag, toggle, rollout, A/B test, targeting, gradual release

**Primary Feature:** F-05 (Feature Flags)

**Related Features:**
- F-04 (Admin User Management) — admin manages flags

**Entry Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#f-05-feature-flags)
- [features/INDEX.md](features/INDEX.md#f-05-feature-flags)

**Safety Level:** MEDIUM

---

### 6. Notifications

**Keywords:** notification, alert, in-app notification, notification center, unread

**Primary Feature:** F-06 (Notifications)

**Related Features:**
- F-03 (Account Preferences) — notification preferences

**Entry Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#f-06-notifications)
- [features/INDEX.md](features/INDEX.md#f-06-notifications)

**Safety Level:** MEDIUM

**Note:** PARTIAL implementation — UI incomplete

---

### 7. Subscriptions & Billing

**Keywords:** subscription, plan, billing, payment, upgrade, downgrade

**Primary Feature:** F-07 (Subscriptions)

**Related Features:**
- F-04 (Admin User Management) — admin manages plans

**Entry Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#f-07-subscriptions)
- [features/INDEX.md](features/INDEX.md#f-07-subscriptions)

**Safety Level:** MEDIUM

**Note:** PARTIAL implementation — business logic incomplete

---

### 8. Dashboard & Analytics

**Keywords:** dashboard, stats, analytics, charts, overview, widgets

**Primary Feature:** F-08 (Dashboard)

**Related Features:**
- F-04 (Admin User Management) — for admin stats

**Entry Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#f-08-dashboard)
- [features/INDEX.md](features/INDEX.md#f-08-dashboard)

**Safety Level:** LOW

**Note:** PARTIAL implementation — data binding incomplete

---

### 9. Workspaces

**Keywords:** workspace, organization, team, multi-tenant

**Primary Feature:** F-09 (Workspaces)

**Related Features:**
- None (not yet implemented)

**Entry Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#f-09-workspaces)
- [features/INDEX.md](features/INDEX.md#f-09-workspaces)

**Safety Level:** LOW

**Note:** PARTIAL implementation — no backend API

---

### 10. Observability (Client)

**Keywords:** client error, browser log, metrics, tracing, sentry, error boundary, performance

**Primary Feature:** F-10 (Observability Client)

**Related Features:**
- F-11 (Observability Server) — for log collection endpoint

**Entry Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#f-10-observability-client)
- [features/INDEX.md](features/INDEX.md#f-10-observability-client)

**Safety Level:** MEDIUM

---

### 11. Observability (Server)

**Keywords:** server log, winston, sentry, trace, audit log, monitoring, distributed tracing

**Primary Feature:** F-11 (Observability Server)

**Related Features:**
- F-04 (Admin User Management) — audit log access
- F-10 (Observability Client) — log collection

**Entry Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#f-11-observability-server)
- [features/INDEX.md](features/INDEX.md#f-11-observability-server)

**Safety Level:** MEDIUM

---

### 12. Storage & Data Layer

**Keywords:** storage, database, JSON files, file storage, persistence, drizzle, PostgreSQL, migration

**Primary Feature:** F-12 (Storage Layer)

**Related Features:**
- All features depend on storage

**Entry Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#f-12-storage-layer)
- [features/INDEX.md](features/INDEX.md#f-12-storage-layer)

**Safety Level:** CRITICAL

**Warning:** Changes to storage layer affect all features

---

### 13. UI Shell & Navigation

**Keywords:** sidebar, navigation, layout, app shell, menu, routing, theme

**Primary Feature:** F-13 (App Shell / Navigation)

**Related Features:**
- F-03 (Account Preferences) — theme preferences

**Entry Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#f-13-app-shell--navigation)
- [features/INDEX.md](features/INDEX.md#f-13-app-shell--navigation)

**Safety Level:** LOW

---

### 14. Health Checks

**Keywords:** health check, liveness, readiness, docker health, monitoring probe

**Primary Feature:** F-14 (Health Checks)

**Related Features:**
- None (independent)

**Entry Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#f-14-health-checks)
- [features/INDEX.md](features/INDEX.md#f-14-health-checks)

**Safety Level:** LOW

---

### 15. API Documentation

**Keywords:** swagger, OpenAPI, API docs, documentation, /api-docs

**Primary Feature:** F-15 (API Documentation)

**Related Features:**
- All API features (docs are generated from route annotations)

**Entry Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#f-15-api-documentation)
- [features/INDEX.md](features/INDEX.md#f-15-api-documentation)

**Safety Level:** LOW

---

## Multi-Feature Requests

### Security Review

**Features Involved:** F-01 (Auth), F-04 (Admin), All API features

**Documents:**
- [features/authentication.md](features/authentication.md) — Risk register
- [FEATURE_MAP.md](FEATURE_MAP.md#security) — Cross-cutting security concerns
- [CHANGE_POLICY.md](CHANGE_POLICY.md) — Safety boundaries

**Safety Level:** HIGH to CRITICAL

---

### Error Handling

**Features Involved:** All features

**Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#error-handling) — Error handling strategy
- [features/INDEX.md](features/INDEX.md) — Per-feature error handling

**Safety Level:** MEDIUM

---

### Validation

**Features Involved:** All API features

**Documents:**
- [FEATURE_MAP.md](FEATURE_MAP.md#validation) — Validation strategy
- `shared/schema.ts` — Zod schemas

**Safety Level:** MEDIUM

---

## Routing Decision Tree

```
User Request
│
├── Mentions "login", "auth", "password", "session"?
│   → Load F-01 (Authentication) context
│
├── Mentions "profile", "avatar", "user info"?
│   → Load F-02 (User Profile) context
│
├── Mentions "settings", "preferences", "theme"?
│   → Load F-03 (Account Preferences) context
│
├── Mentions "admin", "manage users", "audit"?
│   → Load F-04 (Admin User Management) context
│   → Check: Safety Level HIGH
│
├── Mentions "feature flag", "toggle", "rollout"?
│   → Load F-05 (Feature Flags) context
│
├── Mentions "notification", "alert"?
│   → Load F-06 (Notifications) context
│   → Note: PARTIAL implementation
│
├── Mentions "subscription", "billing", "plan"?
│   → Load F-07 (Subscriptions) context
│   → Note: PARTIAL implementation
│
├── Mentions "dashboard", "stats", "charts"?
│   → Load F-08 (Dashboard) context
│
├── Mentions "workspace", "organization"?
│   → Load F-09 (Workspaces) context
│   → Note: PARTIAL implementation (no backend)
│
├── Mentions "client error", "browser log", "metrics"?
│   → Load F-10 (Observability Client) context
│
├── Mentions "server log", "winston", "trace", "audit log"?
│   → Load F-11 (Observability Server) context
│
├── Mentions "storage", "database", "persistence"?
│   → Load F-12 (Storage Layer) context
│   → Warning: CRITICAL safety level
│
├── Mentions "sidebar", "navigation", "layout"?
│   → Load F-13 (App Shell) context
│
├── Mentions "health check", "liveness", "readiness"?
│   → Load F-14 (Health Checks) context
│
└── Mentions "swagger", "API docs", "documentation"?
    → Load F-15 (API Documentation) context
```

---

## Safety-First Routing

### CRITICAL Safety Level

**Features:** F-12 (Storage Layer)

**Required Actions:**
1. Read [AGENT_GUIDE.md](AGENT_GUIDE.md) — Pre-flight checklist
2. Read [CHANGE_POLICY.md](CHANGE_POLICY.md) — Boundaries
3. Locate or create spec in `specs/` directory
4. Confirm spec status is APPROVED
5. Run full test sequence after changes

---

### HIGH Safety Level

**Features:** F-01 (Authentication), F-04 (Admin User Management)

**Required Actions:**
1. Read feature documentation thoroughly
2. Review risk register in feature docs
3. Check for existing specs
4. Implement minimal changes only
5. Run security-focused tests

---

### MEDIUM Safety Level

**Features:** F-02, F-03, F-05, F-06, F-07, F-10, F-11

**Required Actions:**
1. Read feature documentation
2. Check for known limitations
3. Review test coverage
4. Add tests for new functionality

---

### LOW Safety Level

**Features:** F-08, F-09, F-13, F-14, F-15

**Required Actions:**
1. Read feature overview
2. Check for related files
3. Add basic tests

---

## Quick Reference

| Request Contains | Route To | Safety | Status |
|------------------|----------|--------|--------|
| auth, login, password | F-01 | HIGH | STABLE |
| profile, avatar | F-02 | MEDIUM | STABLE |
| settings, preferences | F-03 | MEDIUM | STABLE |
| admin, manage users | F-04 | HIGH | STABLE |
| feature flag | F-05 | MEDIUM | STABLE |
| notification | F-06 | MEDIUM | PARTIAL |
| subscription, billing | F-07 | MEDIUM | PARTIAL |
| dashboard, stats | F-08 | LOW | PARTIAL |
| workspace | F-09 | LOW | PARTIAL |
| client error, metrics | F-10 | MEDIUM | STABLE |
| server log, trace | F-11 | MEDIUM | STABLE |
| storage, database | F-12 | CRITICAL | STABLE |
| sidebar, navigation | F-13 | LOW | STABLE |
| health check | F-14 | LOW | STABLE |
| swagger, API docs | F-15 | LOW | STABLE |

---

## Best Practices

1. **Always check safety level** before proceeding
2. **Read feature status** — PARTIAL features may have incomplete implementations
3. **Follow dependency graph** — changes may affect multiple features
4. **Consult tech debt** — understand known issues before adding to them
5. **Review test coverage** — fill gaps before adding functionality

---

**Maintenance:** Update this guide when adding new features or changing feature ownership.
**Last Updated:** 2026-05-28
