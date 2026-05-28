# Evaluation: Authentication — Account Lockout & Session Hardening

## Eval Header

| Field | Value |
|---|---|
| **Feature** | Authentication (JWT) |
| **Feature ID** | F-01 |
| **Spec Version** | 1.0 |
| **Outcome** | PARTIAL |
| **Evaluator** | AI Architectural Analysis (pre-implementation eval) |
| **Date** | 2026-05-28 |
| **Linked Spec** | `ai-meta/specs/authentication/spec.md` |

> **NOTE:** This is a pre-implementation evaluation conducted during architectural analysis.
> It documents the current state of coverage gaps that the spec intends to address.
> A post-implementation eval must replace this file after the spec is implemented.

---

## 1. Scope Compliance

### 1.1 Files Modified
This eval reflects current state — no implementation has been performed.

| File | In Spec? | Status |
|---|---|---|
| `tests/unit/server/auth-service.test.ts` | YES | NOT YET CREATED |
| `tests/unit/server/session-manager.test.ts` | YES | NOT YET CREATED |

### 1.2 Out-of-Scope Files Touched
- None (no implementation performed)

---

## 2. Behavior Verification

| Behavior from Spec §3.2 | Verified? | Evidence |
|---|---|---|
| Account lockout unit tests exist | NO | File not found in `tests/unit/server/` |
| Session cleanup unit tests exist | NO | File not found in `tests/unit/server/` |
| Existing tests pass | PARTIAL | No failures observed for existing tests (integration suite confirmed present) |

---

## 3. Test Results (Current State)

### 3.1 Automated Tests — Current Coverage Gaps
```
tests/unit/server/auth-service.test.ts   — MISSING
tests/unit/server/session-manager.test.ts — MISSING
```

Existing test files confirmed present:
- `tests/unit/feature-flag-service.test.ts` ✓
- `tests/unit/user-service.test.ts` ✓
- `tests/integration/integration.test.ts` ✓
- `tests/integration/smoke.test.ts` ✓

**Coverage gap:** Account lockout logic and session cleanup behavior have no unit-level test
coverage. Any future modification to `auth-service.ts` or `session-manager.ts` without
adding these tests carries regression risk.

### 3.2 TypeScript Check
Not run as part of this pre-implementation eval.
Run `npm run check` as part of post-implementation eval.

### 3.3 Lint
Not run as part of this pre-implementation eval.
Run `npm run lint` as part of post-implementation eval.

---

## 4. Security Review — Current State Assessment

| Checklist Item | Status | Notes |
|---|---|---|
| Brute-force protection (rate limiter) | PASS | `authLimiter` — 5 req/15min on auth endpoints |
| Account lockout schema fields exist | PASS | `failedLoginAttempts`, `lockedUntil` in `users` table |
| Lockout server-side enforcement | ASSUMED PASS | Code in `auth-service.ts` (not directly verified by test) |
| Refresh token stored as HTTP-only cookie | PASS | `server/auth/jwt-auth-routes.ts` line 30 |
| CSRF token stored as bcrypt hash in session | ASSUMED PASS | `session-manager.ts` design |
| Passwords bcrypt-hashed | PASS | `bcryptjs` used in `auth-service.ts` |
| `PublicUser` type omits password | PASS | `shared/schema.ts` — `Omit<User, 'password'>` |
| Sensitive fields sanitized in error logs | PASS | `server/index.ts` SENSITIVE_FIELDS list |

---

## 5. Invariant Verification

| Invariant | Status | Evidence |
|---|---|---|
| All auth endpoints require valid JWT or explicit exception | PASS | `authenticate` middleware applied in `routes.ts` |
| All API inputs Zod-validated | PASS | `jwtRegisterSchema.parse()`, `jwtLoginSchema.parse()` in routes |
| `password` field never in API response | PASS | `PublicUser = Omit<User, 'password'>` pattern enforced |
| Admin routes gated by `requireAdmin` | PASS | `server/api/admin-routes.ts` confirmed |

---

## 6. Deviations & Findings

### 6.1 Expected vs Actual Differences
- Spec calls for two new test files. They do not exist. This is the gap the spec targets.

### 6.2 Bugs Found (via static analysis)
1. **Email sending in password reset is unimplemented.** `authService.requestPasswordReset()`
   generates a token but there is no email transport. This is a functional gap, not a
   security vulnerability, but users cannot complete password reset without it.
   → Tracked in `features/authentication.md` §7, item 1. Requires separate spec.

2. **2FA preference has no server-side enforcement.** `twoFactorEnabled` in `accountPreferences`
   schema has no backend logic. A user enabling this toggle gains false security assurance.
   → Tracked in `features/authentication.md` §7, item 2. Requires separate spec.

3. **Access tokens not revocable mid-flight.** After logout, access token remains valid for
   up to 15 minutes. Acceptable for short-TTL tokens but documented for awareness.
   → Tracked as known limitation. Mitigation: short TTL (15m default).

### 6.3 New Risks Identified
- `data/sessions.json` is a flat file. If the file is corrupted mid-write (e.g. server crash
  during `saveUsers()`), all sessions are lost and users must re-login. The Mutex protects
  against concurrent write races but not mid-write crashes. Recommend atomic write (write
  to temp file then rename) in a future MEDIUM spec.

---

## 7. Follow-On Actions

| Action | Priority | New Spec Required? |
|---|---|---|
| Implement `auth-service.test.ts` per spec §7 | HIGH | NO (this spec covers it) |
| Implement `session-manager.test.ts` per spec §7 | HIGH | NO (this spec covers it) |
| Implement password reset email transport | MEDIUM | YES |
| Implement server-side 2FA enforcement | MEDIUM | YES |
| Atomic file write for sessions.json | LOW | YES |

---

## 8. Final Verdict

**Outcome:** PARTIAL

**Justification:**
The authentication system's core security mechanisms (JWT, CSRF, account lockout,
rate limiting) are structurally sound based on code evidence. However, two unit test
files specified in the linked spec have not been created yet. Until those tests are written
and passing, this eval cannot be upgraded to PASS. The spec remains in `APPROVED` state
pending implementation. A human or AI agent should implement the test files per spec §7,
re-run `npm run test:ci`, and update this eval file to reflect the final `PASS` outcome.
