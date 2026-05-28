# Spec: Authentication — Account Lockout & Session Hardening

## Spec Header

| Field | Value |
|---|---|
| **Feature** | Authentication (JWT) |
| **Feature ID** | F-01 |
| **Spec Version** | 1.0 |
| **Status** | APPROVED |
| **Safety Level** | HIGH |
| **Author** | AI Agent (architectural analysis) |
| **Date** | 2026-05-28 |
| **Related Spec** | — |

---

## 1. Problem Statement

The current authentication system issues JWT access tokens and manages sessions via
`SessionManager`. However, two hardening gaps exist:

1. **Account lockout fields exist in the schema but enforcement is not validated in tests.**
   `failedLoginAttempts` and `lockedUntil` are schema fields and presumably checked in
   `auth-service.ts`, but no unit test exercises the lockout path to prevent regression.

2. **No server-side unit test covers `session-manager.ts` cleanup behavior.**
   The hourly cleanup scheduler in `routes.ts` calls `sessionManager.cleanupSessions()`,
   but no test verifies that expired sessions are removed and active sessions are retained.

This spec defines the test coverage additions required to harden these paths before any
future agent may modify `auth-service.ts` or `session-manager.ts`.

---

## 2. Scope

### 2.1 Files In — Will Be Modified
- `tests/unit/server/auth-service.test.ts` (create if not present)
- `tests/unit/server/session-manager.test.ts` (create if not present)

### 2.2 Files Out — Will NOT Be Modified
- `server/auth/jwt-auth-routes.ts`
- `server/auth/auth-middleware.ts`
- `server/auth/jwt-utils.ts`
- `server/auth/session-manager.ts`
- `server/services/auth-service.ts`
- `shared/schema.ts`
- `server/storage.ts`
- Any existing test files

### 2.3 New Files
- `tests/unit/server/auth-service.test.ts`
- `tests/unit/server/session-manager.test.ts`

---

## 3. Behavior Specification

### 3.1 Before (Current Behavior)
- `auth-service.ts` handles login, including checking `lockedUntil` and incrementing
  `failedLoginAttempts`. This logic executes but is not covered by unit tests.
- `session-manager.ts` implements `cleanupSessions()` removing sessions past `expiresAt`.
  No unit test verifies retention of valid sessions or removal of expired ones.

### 3.2 After (Target Behavior)
- Unit tests exist for account lockout: correct login resets counter; bad password
  increments counter; counter reaching 10 sets `lockedUntil`; locked account rejects login.
- Unit tests exist for session cleanup: expired sessions are deleted; active sessions
  are retained; `revokedAt`-set sessions are not returned by `getSession`.

### 3.3 Invariants (Must Remain True)
- All existing passing tests must continue to pass.
- No application code is modified.
- `PublicUser` type continues to omit the `password` field from all responses.
- `authenticate` middleware continues to require both valid JWT and valid session.

---

## 4. API Contract

No API changes. Test-only spec.

---

## 5. Schema Changes

None.

---

## 6. Security Considerations

- [ ] Tests must NOT commit real JWT secrets; use test-scoped environment variables or mocks.
- [ ] Tests must NOT write to `data/` directory; use in-memory or temp-dir storage mocks.
- [ ] bcrypt hashing in tests should use `rounds=1` to avoid slow test runs.
- [ ] No real user PII in test fixtures.

---

## 7. Test Plan

### Unit Tests — `tests/unit/server/auth-service.test.ts`

| Test Case | Setup | Expected Outcome |
|---|---|---|
| Successful login resets failedLoginAttempts | User with failedLoginAttempts=3, correct password | failedLoginAttempts reset to 0, returns tokens |
| Failed login increments failedLoginAttempts | User with failedLoginAttempts=0, wrong password | failedLoginAttempts becomes 1, throws "Invalid credentials" |
| 10th failed login sets lockedUntil | User with failedLoginAttempts=9, wrong password | lockedUntil set to future timestamp, throws lockout error |
| Locked account rejects correct password | User with lockedUntil in future, correct password | Throws lockout error without checking password |
| Lockout expires allows login | User with lockedUntil in past, correct password | Login succeeds, lockedUntil cleared |
| Register duplicate username rejected | Existing username in storage | Throws "Username already exists" |
| Register duplicate email rejected | Existing email in storage | Throws "Email already exists" |

### Unit Tests — `tests/unit/server/session-manager.test.ts`

| Test Case | Setup | Expected Outcome |
|---|---|---|
| createSession stores session | Valid session data | Returns session with correct fields |
| getSession returns active session | Active session in store | Returns session object |
| getSession returns undefined for expired session | Session with expiresAt in past | Returns undefined |
| getSession returns undefined for revoked session | Session with revokedAt set | Returns undefined |
| cleanupSessions removes expired sessions | Mix of expired and active sessions | Only expired sessions removed |
| cleanupSessions retains active sessions | Active sessions present | Active sessions unchanged after cleanup |
| validateCSRFToken returns true for valid token | Session with matching bcrypt hash | Returns true |
| validateCSRFToken returns false for invalid token | Session with non-matching hash | Returns false |

### Manual Verification Steps
1. Run `npm run test:ci` — all tests must pass.
2. Confirm no new files outside `tests/unit/server/` were created.

---

## 8. Rollback Plan

Delete the two new test files. No application code was changed so rollback has zero runtime risk.

---

## 9. Dependencies

No new npm packages required.

---

## 10. Assumptions

- [ ] `auth-service.ts` already implements lockout logic (assumed from schema field presence).
  If lockout is NOT implemented in `auth-service.ts`, the tests will fail and reveal the
  gap — this is the desired behavior (tests as documentation of expected behavior).
- [ ] `session-manager.ts` uses bcrypt to hash/compare CSRF tokens.
  If a different comparison method is found, update the test accordingly.
- [ ] Vitest with jsdom is already configured (confirmed: `vitest.config.ts` exists).

---

## 11. Reviewer Sign-Off

| Role | Name | Approved? | Date |
|---|---|---|---|
| Author | AI Architectural Analysis | Yes | 2026-05-28 |
| Reviewer 1 | — | — | — |
| Reviewer 2 | — | — | — |
