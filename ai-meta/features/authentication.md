# Feature: Authentication (JWT) — F-01

**ID:** F-01
**Safety Level:** HIGH
**Status:** STABLE
**Spec:** `ai-meta/specs/authentication/spec.md`
**Eval:** `ai-meta/evaluations/authentication/eval.md`

---

## 1. Scope

### In Scope
- User registration with username/email uniqueness enforcement
- JWT access token issuance (15-minute TTL by default)
- JWT refresh token issuance (7-day TTL), stored as HTTP-only cookie
- CSRF token issuance, stored as JS-readable cookie + bcrypt hash in session
- Session management (create, retrieve, revoke, cleanup) via `SessionManager`
- Login with account lockout (5 failed attempts → `lockedUntil` timestamp)
- Token refresh (sliding sessions)
- Logout (single session) and logout-all (all sessions for user)
- Password reset request (email token generation)
- Password reset confirmation (token verification + password update)
- Auth middleware: `authenticate`, `validateAccessToken`, `validateCSRF`, `requireAdmin`

### Out of Scope (existing system — do NOT add without separate spec)
- OAuth / social login providers
- Two-factor authentication (field exists in preferences schema but no server logic)
- Magic link authentication
- WebAuthn / passkeys

---

## 2. Server-Side Files

| File | Role |
|---|---|
| `server/auth/jwt-auth-routes.ts` | Route handlers for all `/api/auth/*` endpoints |
| `server/auth/auth-middleware.ts` | Express middleware: authenticate, requireAdmin, validateCSRF |
| `server/auth/jwt-utils.ts` | Token sign/verify using `jsonwebtoken` |
| `server/auth/session-manager.ts` | Session CRUD; persists to `data/sessions.json` |
| `server/services/auth-service.ts` | Business logic: register, login, refresh, logout, passwordReset |
| `shared/schema.ts` | Zod schemas: jwtRegisterSchema, jwtLoginSchema, sessionSchema, etc. |

---

## 3. Client-Side Files

| File | Role |
|---|---|
| `client/src/features/auth/hooks/` | `useAuth` hook wrapping TanStack Query mutations |
| `client/src/features/auth/utils/` | Token storage, auth state helpers |
| `client/src/pages/auth-page.tsx` | Login / register form page |
| `client/src/lib/protected-route.tsx` | Route guard: redirects to `/auth` if unauthenticated |
| `client/src/lib/queryClient.ts` | `apiRequest` helper: injects `Authorization` + `X-CSRF-Token` |

---

## 4. API Contract Summary

| Method | Path | Auth | Rate Limit |
|---|---|---|---|
| POST | `/api/auth/register` | None | 5/15min |
| POST | `/api/auth/login` | None | 5/15min |
| POST | `/api/auth/refresh` | refreshToken cookie | 5/15min |
| POST | `/api/auth/logout` | refreshToken cookie | — |
| POST | `/api/auth/logout-all` | ****** | — |
| GET | `/api/auth/user` | ****** | — |
| POST | `/api/auth/password-reset/request` | None | 5/15min |
| POST | `/api/auth/password-reset/confirm` | None | 5/15min |
| POST | `/api/auth/cleanup-sessions` | ****** Admin | — |

---

## 5. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| JWT secret rotation causes mass logout | LOW | HIGH | Re-issue tokens on next login; document rotation procedure |
| Refresh token theft via XSS | LOW | HIGH | httpOnly cookie; CSRF double-submit pattern |
| Session fixation | LOW | HIGH | New session created on every login |
| Brute-force login | MEDIUM | HIGH | authLimiter (5/15min) + account lockout |
| bcrypt timing attack via login error | LOW | MEDIUM | Uniform error message "Invalid credentials" regardless of step that failed |
| Stale sessions after server restart | LOW | MEDIUM | `SERVER_START_TIME` exported to help invalidate pre-restart sessions |
| Concurrent write race on sessions.json | LOW | HIGH | Mutex in `SessionManager` serializes all writes |

---

## 6. Data Model (from `shared/schema.ts`)

### `users` table fields relevant to auth:
- `password` — bcrypt hash; never returned in API responses (`PublicUser` omits it)
- `role` — `"user"` | `"admin"`; controls `requireAdmin` access
- `failedLoginAttempts` — incremented on bad password; reset on successful login
- `lockedUntil` — timestamp; if > now, login is rejected

### Session schema (`sessionSchema`):
- `sessionId`, `userId`, `refreshTokenHash`, `csrfTokenHash`
- `userAgent`, `ip`, `createdAt`, `expiresAt`, `revokedAt`

---

## 7. Known Limitations / Technical Debt

1. **Email delivery not implemented.** `requestPasswordReset` generates a token but
   the email transport is stubbed or logging-only. Marked PARTIAL for email sending.
2. **`twoFactorEnabled` preference field has no server-side enforcement.** UI toggle
   exists but backend 2FA verification is not implemented.
3. **Sessions stored in flat JSON file.** At scale, this becomes a write bottleneck.
   See F-12 (Storage Layer) for migration path.
4. **No token revocation list for access tokens.** Access tokens are valid until expiry
   even after logout. Mitigation: short TTL (15 min).

---

## 8. Testing Coverage

| Test File | Coverage |
|---|---|
| `tests/unit/server/` | Auth service unit tests expected here |
| `tests/integration/integration.test.ts` | Auth API endpoints (register, login, logout) |
| `tests/integration/smoke.test.ts` | Server start + health endpoint |

**Gap:** No unit tests found for `jwt-utils.ts` or `session-manager.ts` directly.
Agent must add tests to these files before making any changes to them.
