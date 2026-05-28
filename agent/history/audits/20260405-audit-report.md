# DevNest-vanilla — Comprehensive Pre-Public Release Audit Report

**Report ID:** 20260405-audit-report
**Date:** 2026-04-05
**Project:** DevNest-vanilla
**Auditor:** Claude Sonnet 4.6 (Senior Security Architect)
**Trigger:** Pre-public release audit before opening to students and external contributors
**Release Readiness Score:** 62 / 100
**Verdict:** ❌ NOT ready for public release as-is — 7 hours of fixes required

---

## HOW TO USE THIS REPORT (FOR AI AGENTS)

This report is structured for direct consumption by an AI coding agent. Each issue contains:

- **Severity** — Critical / High / Medium / Low
- **Status** — `[ ]` open, `[x]` resolved
- **File + Line** — exact location to edit
- **Root Cause** — what is wrong and why it matters
- **Fix** — copy-paste ready code or precise instruction

Work through sections in order: **CRITICAL → HIGH → MEDIUM → LOW → MISSING FILES**.
After fixing each item, mark it `[x]` and move on.
Do not refactor surrounding code unless the fix explicitly requires it.

---

## ARCHITECTURE SNAPSHOT

```text
DevNest-vanilla/
├── client/          React 19 + Vite + TypeScript (SPA)
│   └── features/auth/   JWT auth context, hooks, utilities
├── server/          Express 5 + TypeScript (REST API + SPA host)
│   ├── auth/            JWT utils, session manager, middleware
│   ├── api/             Admin, feature-flags, notifications, subscriptions
│   ├── middleware/       Validation, tracing
│   ├── monitoring/       Sentry integration
│   ├── services/         Auth, User, Audit-log, Feature-flag, etc.
│   ├── index.ts          Security headers, CORS, rate limiting
│   └── storage.ts        File-based JSON storage (+ optional Drizzle/PostgreSQL)
├── shared/          Zod schemas, Drizzle ORM schema, error codes
├── tests/           Vitest unit + integration (102 passing)
├── data/            Runtime JSON files (gitignored)
└── .github/         CI/CD workflows (ci.yml, deploy.yml)
```

**Auth model:** JWT access token (15 min) + HTTP-only refresh token cookie (7 d) + per-session CSRF token
**Storage:** File-based JSON (default) | PostgreSQL via Drizzle ORM (optional)
**Key libs:** Express 5, Helmet, express-rate-limit, express-validator, bcryptjs, Winston, Zod, Sentry

---

## SECURITY POSTURE SUMMARY

| Layer                         | Rating           | Key Gap                            |
| ----------------------------- | ---------------- | ---------------------------------- |
| Authentication (JWT/Sessions) | ✅ Strong        | All-users logout on restart        |
| Authorization (RBAC)          | 🟡 Good with gap | Admin routes missing CSRF          |
| Input Validation              | 🟡 Good with gap | Preferences endpoint unvalidated   |
| Password Security             | ✅ Strong        | bcryptjs cost 12, timing-safe      |
| Security Headers              | ✅ Strong        | Helmet fully configured            |
| Rate Limiting                 | 🟡 Good with gap | Password reset unprotected         |
| Logging                       | 🔴 Gap           | Plaintext passwords in error logs  |
| Dependencies                  | ✅ Clean         | 0 vulnerabilities (npm audit)      |
| Open Source Readiness         | 🔴 Not ready     | 5 critical community files missing |

---

## SECTION 1 — CRITICAL ISSUES

> These MUST be fixed before any public release. All are high-impact, low-effort.

---

### CRIT-01 — Admin mutating routes bypass CSRF validation

- **Status:** `[ ]`
- **Severity:** Critical
- **File:** `server/api/admin-routes.ts`
- **Affected routes:** `PATCH /api/admin/users/:id/role`, `DELETE /api/admin/users/:id`, `POST /api/admin/users`, `PATCH /api/admin/users/:id`
- **Root cause:** All admin write endpoints use `validateAccessToken + requireAdmin` but skip `validateCSRF`. A logged-in admin visiting a malicious page can be tricked into promoting attacker accounts, deleting users, or creating new admins via a forged request.
- **OWASP:** A01 (Broken Access Control), A03 (CSRF)

**Fix — add `validateCSRF` to every state-changing admin route:**

```typescript
// server/api/admin-routes.ts — update import
import { validateAccessToken, requireAdmin, validateCSRF } from "../auth/auth-middleware";

// Apply to PATCH role:
app.patch("/api/admin/users/:id/role",
  validateAccessToken, requireAdmin, validateCSRF,
  async (req, res, next) => { ... }
);

// Apply to DELETE:
app.delete("/api/admin/users/:id",
  validateAccessToken, requireAdmin, validateCSRF,
  async (req, res, next) => { ... }
);

// Apply to POST create:
app.post("/api/admin/users",
  validateAccessToken, requireAdmin, validateCSRF,
  async (req, res, next) => { ... }
);

// Apply to PATCH update:
app.patch("/api/admin/users/:id",
  validateAccessToken, requireAdmin, validateCSRF,
  async (req, res, next) => { ... }
);
```

---

### CRIT-02 — Error handler logs raw `req.body` — plaintext passwords in logs

- **Status:** `[ ]`
- **Severity:** Critical
- **File:** `server/index.ts` — lines 213–221 (inside the global error handler `app.use(...)`)
- **Root cause:** `logger.error(...)` receives `body: req.body` directly. For failed login/registration calls, bcrypt hasn't run yet — the plaintext password is in `req.body.password`. This creates a credential leak in Winston log files and Sentry events.
- **OWASP:** A09 (Logging Failures), GDPR Art. 32

**Fix — sanitize body before logging:**

```typescript
// server/index.ts — inside the global error handler, replace the logger.error call:

const SENSITIVE_FIELDS = [
  "password",
  "currentPassword",
  "newPassword",
  "confirmPassword",
  "token",
];
const sanitizedBody = req.body ? { ...req.body } : undefined;
if (sanitizedBody) {
  SENSITIVE_FIELDS.forEach((f) => {
    if (f in sanitizedBody) sanitizedBody[f] = "[FILTERED]";
  });
}

logger.error(`Error ${status} on ${req.method} ${req.path}`, {
  message: err.message,
  stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  body: sanitizedBody,
  statusCode: status,
  method: req.method,
  path: req.path,
});
```

---

### CRIT-03 — Preferences endpoint accepts unvalidated raw request body

- **Status:** `[ ]`
- **Severity:** Critical
- **File:** `server/profile.ts` — `PUT /api/profile/preferences` handler (lines 247–265)
- **Root cause:** `req.body` is passed directly to `userService.updateUserPreferences()` with no schema validation. An authenticated user can inject arbitrary fields into their record, potentially polluting the storage object or escalating privileges if the preferences object is ever merged with the user record.
- **OWASP:** A03 (Injection), A01 (Access Control)

**Fix — add a strict Zod schema:**

```typescript
// server/profile.ts — add near the top with other schemas

import { z } from "zod";

const preferencesSchema = z
  .object({
    theme: z.enum(["light", "dark", "system"]).optional(),
    notifications: z.boolean().optional(),
    language: z.string().max(10).optional(),
    // Add any other valid preference fields here
  })
  .strict(); // .strict() rejects unknown keys

// Update the route handler:
app.put(
  "/api/profile/preferences",
  validateAccessToken,
  validateCSRF,
  async (req, res) => {
    const result = preferencesSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation error",
        code: "VALIDATION_ERROR",
        errors: result.error.issues,
      });
    }
    try {
      const preferences = await userService.updateUserPreferences(
        req.jwtUser!.userId,
        result.data,
      );
      res.json(preferences);
    } catch (error) {
      logger.error("Update preferences error", {
        error: error instanceof Error ? error.message : String(error),
        userId: req.jwtUser?.userId,
      });
      res.status(500).json({ message: "Internal server error" });
    }
  },
);
```

---

### CRIT-04 — Password reset endpoint has no rate limiting

- **Status:** `[ ]`
- **Severity:** Critical
- **File:** `server/index.ts` — rate limiter application block (lines 139–141)
- **Root cause:** `POST /api/auth/password-reset/request` is only covered by the general API limiter (100 req/15 min). An attacker can enumerate registered emails or flood a target user's inbox without restriction.
- **OWASP:** A07 (Authentication Failures)

**Fix — add one line to the auth limiter block:**

```typescript
// server/index.ts — add alongside existing authLimiter applications:
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/refresh", authLimiter);
app.use("/api/auth/password-reset", authLimiter); // ← ADD THIS LINE
```

---

## SECTION 2 — HIGH PRIORITY ISSUES

> Fix these within the first sprint after the critical items are resolved.

---

### HIGH-01 — No per-account lockout after repeated failed logins

- **Status:** `[ ]`
- **Severity:** High
- **File:** `server/services/auth-service.ts` — `login()` method
- **Root cause:** Rate limiting is IP-based only (5 attempts / 15 min). A distributed botnet using rotating IPs can brute-force a specific user's account indefinitely. There is no per-username failure counter.
- **OWASP:** A07 (Authentication Failures)

**Fix — add failed login tracking to storage and auth service:**

```typescript
// shared/schema.ts — add to user schema:
// failedLoginAttempts: integer (default 0)
// lockedUntil: timestamp (nullable)

// server/services/auth-service.ts — in login():
const user = await storage.getUserByUsername(credentials.username);
if (!user) throw new Error("Invalid credentials");

if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
  const retryAfter = Math.ceil(
    (new Date(user.lockedUntil).getTime() - Date.now()) / 60000,
  );
  throw new Error(`Account locked. Try again in ${retryAfter} minutes.`);
}

const passwordMatch = await comparePassword(
  credentials.password,
  user.password,
);
if (!passwordMatch) {
  const attempts = (user.failedLoginAttempts || 0) + 1;
  const lockUntil =
    attempts >= 10 ? new Date(Date.now() + 30 * 60 * 1000) : undefined;
  await storage.updateUser(user.id, {
    failedLoginAttempts: attempts,
    ...(lockUntil ? { lockedUntil: lockUntil.toISOString() } : {}),
  });
  throw new Error("Invalid credentials");
}

// On success, reset:
await storage.updateUser(user.id, {
  failedLoginAttempts: 0,
  lockedUntil: null,
});
```

---

### HIGH-02 — Uploaded files served from a relative path (path traversal risk)

- **Status:** `[ ]`
- **Severity:** High
- **File:** `server/profile.ts` — line 268
- **Root cause:** `expressStatic("uploads")` uses a relative path resolved from `process.cwd()`. If the working directory changes (common in some deployment setups), this resolves to an unintended directory. Directory listing is also not explicitly disabled.

**Fix:**

```typescript
// server/profile.ts — replace the static file serving line:
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Replace:
// app.use("/uploads", expressStatic("uploads"));
// With:
app.use(
  "/uploads",
  expressStatic(join(__dirname, "..", "uploads"), {
    dotfiles: "deny",
    index: false, // disable directory listing
    etag: true,
    maxAge: "1d",
  }),
);
```

---

### HIGH-03 — All sessions invalidated on every server restart

- **Status:** `[ ]`
- **Severity:** High
- **File:** `server/auth/session-manager.ts` — line 143
- **Root cause:** `const isStale = session.createdAt < SERVER_START_TIME` causes every session created before the current process started to be rejected. Every server restart logs out all users. This is disruptive in containerized/load-balanced environments.

**Fix (short-term — remove the stale check):**

```typescript
// server/auth/session-manager.ts — in getSession(), remove the isStale check:

// REMOVE these two lines:
// const isStale = session.createdAt < SERVER_START_TIME;
// if (isExpired || isRevoked || isStale) {

// REPLACE WITH:
if (isExpired || isRevoked) {
  await this.revokeSession(sessionId);
  return null;
}
```

> **Note for future:** The long-term fix is to migrate sessions to a shared persistent store (Redis or PostgreSQL) so sessions survive restarts and support horizontal scaling.

---

### HIGH-04 — Swagger UI is publicly accessible in production

- **Status:** `[ ]`
- **Severity:** High
- **File:** `server/swagger.ts` (registered in `server/routes.ts`)
- **Root cause:** The API documentation endpoint `/api-docs` is accessible to unauthenticated users in all environments. It exposes all endpoint details, request/response schemas, and the security model — useful reconnaissance for attackers.

**Fix:**

```typescript
// server/swagger.ts — wrap everything in an environment check:
export function setupSwagger(app: Express) {
  if (process.env.NODE_ENV === "production") {
    // Optionally expose behind admin auth instead of disabling entirely
    return;
  }
  // ... existing swagger setup code
}
```

---

### HIGH-05 — README.md is significantly outdated

- **Status:** `[ ]`
- **Severity:** High
- **File:** `README.md`
- **Root cause:** Multiple inaccuracies will confuse contributors and damage project credibility.

| README states                                               | Actual reality                             |
| ----------------------------------------------------------- | ------------------------------------------ |
| "React 18"                                                  | `react: ^19.2.4`                           |
| `JWT_SECRET` env var                                        | `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET` |
| `FROM node:18-alpine` in Docker example                     | Actual Dockerfile uses `node:20-alpine`    |
| No mention of Helmet, CSRF, rate limiting                   | These are core security features           |
| No mention of file-based storage                            | Default storage mode for dev               |
| Missing API endpoints (refresh, logout-all, password-reset) | All implemented                            |

**Fix:** Update the following sections in README.md:

1. Technology Stack → React version to 19
2. Environment Variables section → replace `JWT_SECRET` with `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
3. Docker Support code block → update to `node:20-alpine`
4. Features list → add Security Features section (Helmet CSP, CSRF protection, rate limiting, audit logging)
5. API Endpoints section → add refresh, logout-all, password-reset endpoints

---

### HIGH-06 — `tsx` used as production runtime in Docker

- **Status:** `[ ]`
- **Severity:** High
- **File:** `Dockerfile` — line 43
- **Root cause:** `CMD ["npx", "tsx", "server/index.ts"]` runs TypeScript via on-the-fly transpilation in production. This adds cold-start overhead, requires TS source in the image (larger attack surface), and `npx` introduces supply-chain risk.

**Fix — use locally installed tsx (not npx):**

```dockerfile
# Dockerfile — replace CMD line:
# REMOVE:
# CMD ["npx", "tsx", "server/index.ts"]

# REPLACE WITH:
CMD ["./node_modules/.bin/tsx", "server/index.ts"]
```

> **Long-term:** Compile the server TypeScript at build time and run `node dist/server/index.js` for best production performance.

---

### HIGH-07 — CORS allows all null-origin requests

- **Status:** `[ ]`
- **Severity:** High
- **File:** `server/index.ts` — lines 69–71
- **Root cause:** `if (!origin) { return callback(null, true); }` allows all requests without an `Origin` header. In production, this includes sandboxed iframes that send `Origin: null` and certain redirect-based attack scenarios.

**Fix:**

```typescript
// server/index.ts — update the CORS origin callback:
origin: (origin, callback) => {
  if (!origin) {
    // Allow null-origin only in non-production (Postman, curl, local dev)
    if (env.NODE_ENV !== "production") {
      return callback(null, true);
    }
    logger.warn("CORS blocked null-origin request in production");
    return callback(new Error("Requests without an origin are not allowed in production"));
  }
  if (env.ALLOWED_ORIGINS.includes(origin)) {
    callback(null, true);
  } else {
    logger.warn(`CORS blocked request from unauthorized origin: ${origin}`);
    callback(new Error("Not allowed by CORS"));
  }
},
```

---

## SECTION 3 — MEDIUM PRIORITY ISSUES

> Fix in the sprint following the initial public release, or bundle with related feature work.

---

### MED-01 — `getCSRFToken()` in SessionManager is a broken dead method

- **Status:** `[ ]`
- **Severity:** Medium
- **File:** `server/auth/session-manager.ts` — lines 272–277
- **Root cause:** The method generates a new random token on every call instead of returning the stored token. It will never match the stored hash. This misleads contributors about how CSRF tokens work in this system.

**Fix — remove the method entirely:**

```typescript
// server/auth/session-manager.ts — delete this entire method:
// getCSRFToken(session: Session): string {
//   return generateSecureToken(24);
// }
```

The actual CSRF token is returned from `createSession()` and must be stored client-side. It is not recoverable from the server after session creation (by design — only the hash is stored).

---

### MED-02 — Health readiness endpoint exposes system internals

- **Status:** `[ ]`
- **Severity:** Medium
- **File:** `server/health.ts` — `handleReadinessCheck()`
- **Root cause:** The `/health/ready` response includes memory usage details (`used`, `total`, `percentage`) that provide reconnaissance value (heap profiling, resource exhaustion timing).

**Fix — return only a boolean status for public health checks:**

```typescript
// server/health.ts — simplify memory check in the public response:
checks: {
  sessionManager: sessionCheck,
  memory: memoryCheck.percentage > 90 ? "high" : "ok",  // not raw numbers
},
```

Also remove `nodeVersion` from the admin stats endpoint in `server/api/admin-routes.ts`:

```typescript
// server/api/admin-routes.ts — GET /api/admin/stats:
server: {
  uptime: process.uptime(),
  environment: process.env.NODE_ENV,
  // REMOVE: nodeVersion: process.version,
},
```

---

### MED-03 — No email verification on registration

- **Status:** `[ ]`
- **Severity:** Medium
- **File:** `server/services/auth-service.ts` — `register()` method
- **Root cause:** Users can register with any email address without verifying ownership. This enables account squatting (claiming others' emails before them), GDPR issues (associating data with a person who did not consent), and bypasses email-based security controls.

**Fix (minimum viable):**

1. Add `emailVerified: false` and `emailVerificationToken: string | null` to the user schema in `shared/schema.ts`
2. On registration: generate a secure token, store its hash, send a verification email
3. Add `GET /api/auth/verify-email?token=...` endpoint that sets `emailVerified: true`
4. Restrict sensitive features (admin access, password reset) to verified accounts only

---

### MED-04 — No pagination on admin user list

- **Status:** `[ ]`
- **Severity:** Medium
- **File:** `server/api/admin-routes.ts` — `GET /api/admin/users` (lines 51–64)
- **Root cause:** Returns all users in one response. With thousands of users this causes memory spikes and slow API responses.

**Fix:**

```typescript
// server/api/admin-routes.ts — GET /api/admin/users:
async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const allUsers = await storage.getAllUsers();
    const safeUsers = allUsers
      .slice(offset, offset + limit)
      .map(({ password: _p, ...rest }) => rest);
    res.json({ users: safeUsers, total: allUsers.length, limit, offset });
  } catch (err) {
    next(err);
  }
},
```

---

### MED-05 — `crossOriginEmbedderPolicy` disabled globally including production

- **Status:** `[ ]`
- **Severity:** Medium
- **File:** `server/index.ts` — line 52
- **Root cause:** `crossOriginEmbedderPolicy: false` is set unconditionally. This was likely done for development compatibility but should be enabled in production to support `SharedArrayBuffer` isolation and modern browser security features.

**Fix:**

```typescript
// server/index.ts — make COEP environment-aware:
crossOriginEmbedderPolicy: env.NODE_ENV === "production",
```

---

### MED-06 — No Node.js version specification

- **Status:** `[ ]`
- **Severity:** Medium
- **Files:** `package.json`, root directory
- **Root cause:** No `.nvmrc` or `engines` field. CI uses Node 20 but contributors have no way to know this from the project files. Wrong Node version causes subtle build/runtime issues.

**Fix — two steps:**

```bash
# Step 1: create .nvmrc
echo "20" > .nvmrc
```

```json
// Step 2: package.json — add engines field:
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

---

### MED-07 — Password reset email delivery not verified

- **Status:** `[ ]`
- **Severity:** Medium
- **File:** `server/services/auth-service.ts` — `requestPasswordReset()` method
- **Root cause:** The password reset token generation and validation logic exists, but no email transport (SMTP, SendGrid, etc.) is wired up in the visible codebase. If resets silently succeed without delivering an email, users cannot recover accounts.

**Fix:**

1. Add `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (or `SENDGRID_API_KEY`) to `server/env.ts` schema
2. Implement email sending in `requestPasswordReset()` — use `nodemailer` or a provider SDK
3. Fail fast at startup if `NODE_ENV === "production"` and no email provider is configured
4. Add email transport config to `.env.example` with clear comments

---

### MED-08 — `REPL_ID` env var exposes platform origin

- **Status:** `[ ]`
- **Severity:** Low-Medium
- **File:** `server/env.ts` — line 91
- **Root cause:** `REPL_ID: z.string().optional()` indicates the project was built on Replit. For a public educational codebase this is confusing and unnecessary.

**Fix — remove from env schema:**

```typescript
// server/env.ts — delete this line:
// REPL_ID: z.string().optional(),
```

---

## SECTION 4 — LOW PRIORITY / SUGGESTIONS

> Improvements that raise quality and professionalism. Address incrementally.

| ID     | Issue                                                                    | File                                | Fix                                                                            |
| ------ | ------------------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------ |
| LOW-01 | Commit message style inconsistent (mix of `feat:`, `chore:`, plain text) | `.github/`                          | Add `commitlint` + `husky` commit-msg hook enforcing Conventional Commits      |
| LOW-02 | `cookies.txt` exists in working directory (gitignored but present)       | Root                                | `rm cookies.txt` — it is a libcurl artifact                                    |
| LOW-03 | `FEATURE_REGISTRY.json` purpose undocumented                             | Root                                | Add a comment header to the file explaining its purpose                        |
| LOW-04 | `scripts/seed-sncf-users.ts` may reference real org                      | `scripts/`                          | Review and anonymize all seed data before public release                       |
| LOW-05 | JSON body parser allows 10MB for all routes                              | `server/index.ts:144`               | Reduce to `1mb` for JSON API; keep `10mb` only for the upload route            |
| LOW-06 | `unsafe-inline` in CSP for styles                                        | `server/index.ts:27`                | Long-term: migrate Tailwind to eliminate inline styles and use nonce-based CSP |
| LOW-07 | Multer errors not caught explicitly                                      | `server/profile.ts`                 | Add explicit Multer error handler to return structured JSON, not raw errors    |
| LOW-08 | Access token returned in JSON response body                              | `server/auth/jwt-auth-routes.ts:81` | Consider Bearer-only flow (no JSON body return) to reduce XSS exposure surface |
| LOW-09 | `X-Permitted-Cross-Domain-Policies` header missing                       | `server/index.ts`                   | Add `permittedCrossDomainPolicies: { permittedPolicies: "none" }` to Helmet    |
| LOW-10 | No CI coverage threshold gate                                            | `.github/workflows/ci.yml`          | Add `--coverage --coverage.thresholds.lines=70` to vitest run in CI            |
| LOW-11 | No SAST beyond `npm audit`                                               | `.github/workflows/ci.yml`          | Add GitHub CodeQL action: `uses: github/codeql-action/analyze@v3`              |

---

## SECTION 5 — MISSING FILES (OPEN SOURCE READINESS)

> All items below are required before the repository is suitable for external contributors.

---

### FILE-01 — CONTRIBUTING.md

- **Status:** `[ ]`
- **Priority:** Critical for open source
- **Action:** Create `CONTRIBUTING.md` in the repo root with the following sections:
  - Development prerequisites (Node 20, npm 10+)
  - One-command setup: `npm install && cp .env.example .env && npm run dev`
  - Branching strategy: `main` (stable), `develop` (integration), `feature/*` branches
  - Commit message format: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
  - PR requirements: tests for new features, no TypeScript `any`, Prettier formatted
  - Test command: `npm test`
  - Code style: TypeScript strict mode, named exports, functional components
  - Security contributions: link to SECURITY.md

---

### FILE-02 — SECURITY.md

- **Status:** `[ ]`
- **Priority:** Critical for open source
- **Action:** Create `SECURITY.md` in the repo root:

```markdown
# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅        |

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Please report security issues privately to: [maintainer email or GitHub private advisory]

We aim to respond within 48 hours. Please include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

We follow responsible disclosure: we will confirm receipt, work on a patch,
and credit you in the release notes unless you prefer to remain anonymous.
```

---

### FILE-03 — CODE_OF_CONDUCT.md

- **Status:** `[ ]`
- **Priority:** High for open source
- **Action:** Create `CODE_OF_CONDUCT.md` using the Contributor Covenant v2.1 template:
  - Available at: <https://www.contributor-covenant.org/version/2/1/code_of_conduct/>
  - Customize the enforcement contact email placeholder

---

### FILE-04 — CHANGELOG.md

- **Status:** `[ ]`
- **Priority:** Medium
- **Action:** Create `CHANGELOG.md` following Keep a Changelog format:

```markdown
# Changelog

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Comprehensive JWT authentication system with CSRF protection
- Role-based access control (RBAC) with admin panel
- File upload with magic-byte validation
- Structured audit logging (append-only JSONL)
- Sentry error monitoring with PII filtering
- Dual-layer rate limiting (general + auth-specific)
- Health check and readiness endpoints

## [1.0.0] - 2026-04-05

### Added

- Initial public release
```

---

### FILE-05 — GitHub Issue Templates

- **Status:** `[ ]`
- **Priority:** High
- **Action:** Create `.github/ISSUE_TEMPLATE/` directory with two templates:

**`.github/ISSUE_TEMPLATE/bug_report.yml`:**

```yaml
name: Bug Report
description: Report a reproducible bug
labels: ["bug"]
body:
  - type: textarea
    id: description
    attributes:
      label: Description
      description: Clear description of the bug
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
    validations:
      required: true
  - type: dropdown
    id: environment
    attributes:
      label: Environment
      options: ["Development", "Production", "Docker"]
    validations:
      required: true
```

**`.github/ISSUE_TEMPLATE/feature_request.yml`:**

```yaml
name: Feature Request
description: Suggest a new feature
labels: ["enhancement"]
body:
  - type: textarea
    id: problem
    attributes:
      label: Problem Statement
      description: What problem does this solve?
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
    validations:
      required: true
  - type: checkboxes
    id: checklist
    attributes:
      label: Checklist
      options:
        - label: I searched existing issues
          required: true
        - label: This aligns with the project's educational goals
          required: true
```

---

### FILE-06 — Pull Request Template

- **Status:** `[ ]`
- **Priority:** High
- **Action:** Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Summary

<!-- What does this PR do? Why? -->

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactor
- [ ] Security fix

## Testing

- [ ] I added/updated tests
- [ ] All existing tests pass (`npm test`)
- [ ] I ran `npm run lint` with no errors

## Security Checklist (for auth/API changes)

- [ ] Input validated with Zod or express-validator
- [ ] Sensitive data not logged
- [ ] CSRF validation applied to state-changing routes
- [ ] No hardcoded secrets or credentials

## Breaking Changes

<!-- List any breaking changes or "None" -->
```

---

### FILE-07 — `.nvmrc`

- **Status:** `[ ]`
- **Priority:** Medium
- **Action:** `echo "20" > .nvmrc` in repo root

---

## SECTION 6 — WHAT IS WELL IMPLEMENTED

> These areas should be preserved and not regressed during the fix sprint.

| Area                      | Implementation                                                | Why It's Good                                       |
| ------------------------- | ------------------------------------------------------------- | --------------------------------------------------- |
| Password hashing          | bcryptjs cost 12, timing-safe comparison                      | Industry standard; resistant to brute force         |
| JWT architecture          | Access (15 min) + Refresh (7 d) + per-session CSRF            | Defense in depth; limits blast radius of token leak |
| CSRF token design         | 24-byte random, SHA-256 hashed in session, never stored plain | Proper token security                               |
| Rate limiting             | Dual-layer: 100/15min general + 5/15min auth-only             | Auth-specific throttling prevents brute force       |
| Security headers          | Helmet with full CSP, HSTS 1yr+preload, referrer policy       | Comprehensive header security                       |
| Input validation          | express-validator chains with strict regex on all endpoints   | Consistent, thorough                                |
| File upload security      | Extension whitelist + MIME check + magic-byte verification    | Goes beyond typical implementations                 |
| Opaque filenames          | UUID-based upload filenames                                   | Prevents user ID enumeration via profile pictures   |
| Audit logging             | Append-only JSONL with IP, user-agent, action, success flag   | Forensic trail for sensitive operations             |
| Sentry PII filtering      | Strips auth headers, cookies, passwords before sending        | Correct privacy-aware error monitoring              |
| Environment validation    | Zod schema + production fail-fast for weak secrets            | Prevents misconfigured production deploys           |
| Data directory protection | `/data/*` routes return 404                                   | Prevents direct file access                         |
| Docker security           | Multi-stage build, non-root `node` user, health check         | Production-safe container configuration             |
| CI pipeline               | lint → typecheck → test → build → npm audit chain             | Solid automated quality gate                        |
| Test coverage             | 102 passing tests across 12 files                             | Good baseline for an educational project            |
| npm audit                 | 0 vulnerabilities                                             | Clean dependency posture                            |

---

## SECTION 7 — RELEASE READINESS SCORECARD

| Category                  | Score      | Blocker                              |
| ------------------------- | ---------- | ------------------------------------ |
| Authentication & Sessions | 78/100     | Session restart issue (HIGH-03)      |
| Authorization & RBAC      | 60/100     | Admin CSRF bypass (CRIT-01)          |
| Input Validation          | 65/100     | Preferences unvalidated (CRIT-03)    |
| Password Security         | 95/100     | —                                    |
| Security Headers          | 88/100     | COEP disabled (MED-05)               |
| Rate Limiting             | 70/100     | Password reset unprotected (CRIT-04) |
| Logging & Monitoring      | 55/100     | Passwords in logs (CRIT-02)          |
| Dependency Security       | 95/100     | —                                    |
| Code Quality              | 75/100     | Several medium issues                |
| Testing                   | 65/100     | No coverage gate, no e2e in CI       |
| Documentation             | 30/100     | README outdated, 5 files missing     |
| Developer Experience      | 55/100     | Setup unclear for contributors       |
| CI/CD                     | 70/100     | No SAST, no coverage enforcement     |
| Open Source Readiness     | 35/100     | CONTRIBUTING, SECURITY, CoC missing  |
| Production Readiness      | 55/100     | tsx in Docker, file-based storage    |
| **OVERALL**               | **62/100** | **7 critical/high fixes required**   |

---

## SECTION 8 — FIX SPRINT PLAN

> Ordered by impact and dependency. An AI agent should execute fixes in this sequence.

### Phase 1 — Security Blockers (Day 1, ~3 hours)

| Order | ID      | Task                                    | File                         | Est.   |
| ----- | ------- | --------------------------------------- | ---------------------------- | ------ |
| 1     | CRIT-01 | Add `validateCSRF` to admin routes      | `server/api/admin-routes.ts` | 30 min |
| 2     | CRIT-02 | Sanitize `req.body` in error handler    | `server/index.ts`            | 20 min |
| 3     | CRIT-03 | Add Zod schema to preferences endpoint  | `server/profile.ts`          | 45 min |
| 4     | CRIT-04 | Add `authLimiter` to password reset     | `server/index.ts`            | 5 min  |
| 5     | HIGH-07 | Restrict null-origin CORS in production | `server/index.ts`            | 15 min |
| 6     | HIGH-04 | Disable Swagger in production           | `server/swagger.ts`          | 10 min |
| 7     | HIGH-02 | Fix uploads static path                 | `server/profile.ts`          | 20 min |

### Phase 2 — Stability & DevEx (Day 2, ~4 hours)

| Order | ID      | Task                              | File                             | Est.   |
| ----- | ------- | --------------------------------- | -------------------------------- | ------ |
| 8     | HIGH-03 | Remove isStale session check      | `server/auth/session-manager.ts` | 15 min |
| 9     | HIGH-05 | Update README.md                  | `README.md`                      | 60 min |
| 10    | HIGH-06 | Fix Docker CMD to use local tsx   | `Dockerfile`                     | 5 min  |
| 11    | MED-01  | Remove broken `getCSRFToken()`    | `server/auth/session-manager.ts` | 10 min |
| 12    | MED-06  | Add `.nvmrc` and engines field    | Root, `package.json`             | 5 min  |
| 13    | MED-08  | Remove `REPL_ID` from env schema  | `server/env.ts`                  | 5 min  |
| 14    | MED-04  | Add pagination to admin user list | `server/api/admin-routes.ts`     | 30 min |
| 15    | MED-02  | Sanitize health endpoint response | `server/health.ts`, admin-routes | 20 min |

### Phase 3 — Open Source Files (Day 2-3, ~3 hours)

| Order | ID      | Task                          | Est.   |
| ----- | ------- | ----------------------------- | ------ |
| 16    | FILE-02 | Create `SECURITY.md`          | 30 min |
| 17    | FILE-01 | Create `CONTRIBUTING.md`      | 90 min |
| 18    | FILE-05 | Create GitHub issue templates | 45 min |
| 19    | FILE-06 | Create PR template            | 20 min |
| 20    | FILE-03 | Create `CODE_OF_CONDUCT.md`   | 15 min |
| 21    | FILE-04 | Create `CHANGELOG.md`         | 20 min |
| 22    | FILE-07 | Create `.nvmrc`               | 2 min  |

### Phase 4 — Post-Release Backlog

| ID      | Task                                  | Notes                                  |
| ------- | ------------------------------------- | -------------------------------------- |
| HIGH-01 | Per-account lockout                   | Requires schema change                 |
| MED-03  | Email verification on registration    | Requires email transport               |
| MED-07  | Wire up password reset email delivery | Requires email transport               |
| MED-05  | Enable COEP in production             | Test for regressions first             |
| LOW-10  | Add CI coverage threshold             | Set threshold after measuring baseline |
| LOW-11  | Add GitHub CodeQL SAST                | Add to ci.yml                          |

---

## THREAT MODEL SUMMARY

| Scenario                                             | Likelihood | Impact   | Status                  |
| ---------------------------------------------------- | ---------- | -------- | ----------------------- |
| Admin CSRF → attacker promoted to admin              | High       | Critical | CRIT-01                 |
| Distributed brute-force on specific account          | Medium     | High     | HIGH-01 (backlog)       |
| Extract passwords from log files                     | Medium     | Critical | CRIT-02                 |
| Inject arbitrary data via preferences API            | Low        | Medium   | CRIT-03                 |
| Email enumeration via password reset                 | Medium     | Medium   | CRIT-04                 |
| Contributor confusion → bad PR → security regression | High       | Medium   | FILE-01 through FILE-06 |
| Swagger reconnaissance in production                 | Low        | Low      | HIGH-04                 |
| Session persistence loss on restart                  | High       | UX       | HIGH-03                 |

---

Report generated: 2026-04-05 | Next review recommended: 2026-07-01 or after 50+ external contributions
