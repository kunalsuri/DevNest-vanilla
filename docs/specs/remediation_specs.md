# Remediation Specifications

# Source Audit: /docs/audits/20260405-audit-report.md

# Generated: 2026-04-06

---

## SPEC-001

Audit-ID: CRIT-01
Title: Add CSRF validation to admin mutating routes
Problem: All admin write endpoints (`PATCH /api/admin/users/:id/role`, `DELETE /api/admin/users/:id`, `POST /api/admin/users`, `PATCH /api/admin/users/:id`) use `validateAccessToken + requireAdmin` but skip `validateCSRF`. A logged-in admin visiting a malicious page can be tricked into promoting attacker accounts, deleting users, or creating new admins via a cross-site forged request. This violates OWASP A01 (Broken Access Control) and A03 (CSRF).
Implementation Plan:

1. Open `server/api/admin-routes.ts`
2. Import `validateCSRF` alongside the existing auth middleware imports
3. Add `validateCSRF` as middleware to: `PATCH /api/admin/users/:id/role`, `DELETE /api/admin/users/:id`, `POST /api/admin/users`, `PATCH /api/admin/users/:id`
   Files to Modify: server/api/admin-routes.ts
   Risks: Any existing automated tests or scripts calling these endpoints without CSRF headers will break. Frontend must supply the CSRF token in all admin mutation requests.
   Acceptance Criteria:

- `PATCH /api/admin/users/:id/role` without CSRF token returns 403
- `DELETE /api/admin/users/:id` without CSRF token returns 403
- `POST /api/admin/users` without CSRF token returns 403
- `PATCH /api/admin/users/:id` without CSRF token returns 403
- All four routes succeed with a valid CSRF token
  Test Plan:
- `npm test` — run existing suite to catch regressions
- Manual: call each endpoint without `X-CSRF-Token` header; expect 403
- Manual: call each endpoint with valid CSRF token; expect 200/201

---

## SPEC-002

Audit-ID: CRIT-02
Title: Sanitize sensitive fields from error handler logs
Problem: The global Express error handler in `server/index.ts` passes `body: req.body` directly to `logger.error()`. For failed login and registration requests, bcrypt has not yet run, so the plaintext password lives in `req.body.password`. This creates a credential leak in Winston log files and any connected Sentry events, violating OWASP A09 (Logging Failures) and GDPR Art. 32.
Implementation Plan:

1. Open `server/index.ts` and locate the global error handler (around lines 213–221)
2. Define a `SENSITIVE_FIELDS` array: `["password", "currentPassword", "newPassword", "confirmPassword", "token"]`
3. Shallow-clone `req.body` into `sanitizedBody`
4. Iterate `SENSITIVE_FIELDS` and replace any present key with `"[FILTERED]"`
5. Pass `sanitizedBody` instead of `req.body` to `logger.error()`
   Files to Modify: server/index.ts
   Risks: Minimal — purely additive defensive change. Existing log structure unchanged except that sensitive fields are masked.
   Acceptance Criteria:

- A failed login attempt does NOT produce a log entry containing the submitted password
- Other non-sensitive body fields are still logged
- Sentry events do not include raw password fields
  Test Plan:
- `npm test`
- Manual: trigger a login failure; grep log output for literal password value; expect no match
- Unit test: call the sanitization logic directly with a body containing `password`; assert value is `"[FILTERED]"`

---

## SPEC-003

Audit-ID: CRIT-03
Title: Add Zod validation to preferences endpoint
Problem: The `PUT /api/profile/preferences` handler in `server/profile.ts` passes `req.body` directly to `userService.updateUserPreferences()` with no schema validation. An authenticated user can inject arbitrary fields into their record, potentially polluting the storage object or escalating privileges if the preferences object is ever merged into the user record. Violates OWASP A03 (Injection) and A01 (Access Control).
Implementation Plan:

1. Open `server/profile.ts`
2. Add `import { z } from "zod"` if not already present
3. Define `preferencesSchema` with `.strict()`: `theme` (enum light/dark/system, optional), `notifications` (boolean, optional), `language` (string max 10, optional)
4. In the `PUT /api/profile/preferences` handler, call `preferencesSchema.safeParse(req.body)`
5. On parse failure return `400` with `VALIDATION_ERROR` and the Zod issues
6. On success pass `result.data` to `userService.updateUserPreferences()`
   Files to Modify: server/profile.ts
   Risks: Any client sending undocumented preference keys will now receive 400. Known valid preference fields must be enumerated in the schema.
   Acceptance Criteria:

- Request with unknown key (e.g. `{ "role": "admin" }`) returns 400
- Request with `{ "theme": "dark" }` succeeds
- Request with `{ "theme": "invalid" }` returns 400
- Valid preferences are persisted correctly
  Test Plan:
- `npm test`
- Unit test: call handler with `{ role: "admin" }`; expect 400 with VALIDATION_ERROR
- Unit test: call handler with `{ theme: "dark" }`; expect 200
- Unit test: call handler with `{ theme: "rainbow" }`; expect 400

---

## SPEC-004

Audit-ID: CRIT-04
Title: Apply auth rate limiter to password-reset endpoint
Problem: `POST /api/auth/password-reset/request` is only covered by the general API limiter (100 req/15 min). An attacker can enumerate registered emails or flood a target user's inbox without restriction. Violates OWASP A07 (Authentication Failures).
Implementation Plan:

1. Open `server/index.ts`
2. Locate the block where `authLimiter` is applied to login, register, and refresh
3. Add: `app.use("/api/auth/password-reset", authLimiter);`
   Files to Modify: server/index.ts
   Risks: Legitimate users who trigger password reset multiple times (e.g. typo in email) may hit the limit. This is acceptable and the intended behaviour.
   Acceptance Criteria:

- After 5 rapid requests to `POST /api/auth/password-reset/request`, subsequent requests return 429
- Normal single requests still succeed (200/204)
  Test Plan:
- `npm test`
- Manual: fire 6+ rapid requests to the endpoint; expect 429 on the 6th

---

## SPEC-005

Audit-ID: HIGH-01
Title: Add per-account lockout after repeated failed logins
Problem: Rate limiting is IP-based only (5 attempts / 15 min). A distributed botnet using rotating IPs can brute-force a specific user's account indefinitely. There is no per-username failure counter. Violates OWASP A07 (Authentication Failures).
Implementation Plan:

1. Open `shared/schema.ts` and add `failedLoginAttempts` (integer, default 0) and `lockedUntil` (timestamp nullable) to the user schema
2. Open `server/services/auth-service.ts`, in the `login()` method:
   a. After fetching the user, check `lockedUntil` — if in the future, throw with retry-after message
   b. On password mismatch, increment `failedLoginAttempts`; if >= 10, set `lockedUntil` to now + 30 min
   c. On successful login, reset `failedLoginAttempts: 0, lockedUntil: null`
   Files to Modify: shared/schema.ts, server/services/auth-service.ts
   Risks: Adds two new fields to the user record — existing stored JSON files lack these fields and must handle `undefined` gracefully (treat as 0 / null). Drizzle migration needed if using PostgreSQL.
   Acceptance Criteria:

- 10 consecutive failed logins result in account lock
- Locked account returns error with retry-after time
- Successful login resets counter
- Lock expires naturally after 30 minutes
  Test Plan:
- `npm test`
- Unit test: simulate 10 failed logins; assert `lockedUntil` is set
- Unit test: attempt login on locked account; expect lockout error
- Unit test: successful login resets counters

---

## SPEC-006

Audit-ID: HIGH-02
Title: Fix uploaded files static serving path to absolute
Problem: `expressStatic("uploads")` in `server/profile.ts` uses a relative path resolved from `process.cwd()`. If the working directory differs from the project root (common in deployment), this resolves to an unintended directory, creating a path traversal risk. Directory listing is also not explicitly disabled.
Implementation Plan:

1. Open `server/profile.ts`
2. Import `fileURLToPath` from `node:url` and `dirname`/`join` from `node:path`
3. Derive `__dirname` via `dirname(fileURLToPath(import.meta.url))`
4. Replace `expressStatic("uploads")` with `expressStatic(join(__dirname, "..", "uploads"), { dotfiles: "deny", index: false, etag: true, maxAge: "1d" })`
   Files to Modify: server/profile.ts
   Risks: Path join logic assumes `server/profile.ts` is one level below the project root. Verify deployment structure matches.
   Acceptance Criteria:

- Static files are served correctly from the absolute uploads path
- Requests for dotfiles (e.g. `.htaccess`) return 403
- Directory listing requests return 403 or 404
  Test Plan:
- `npm test`
- Manual: request `/uploads/.env`; expect 403
- Manual: request `/uploads/`; expect 403/404

---

## SPEC-007

Audit-ID: HIGH-03
Title: Remove session stale-check that logs out all users on restart
Problem: `session.createdAt < SERVER_START_TIME` in `server/auth/session-manager.ts` causes every session created before the current process started to be rejected, logging out all users on any restart. This is disruptive in containerized and load-balanced environments.
Implementation Plan:

1. Open `server/auth/session-manager.ts`
2. In `getSession()`, locate the `isStale` variable and the compound `if (isExpired || isRevoked || isStale)` check
3. Remove the `isStale` assignment and reduce the condition to `if (isExpired || isRevoked)`
   Files to Modify: server/auth/session-manager.ts
   Risks: Sessions that were intentionally considered "stale" (pre-restart) will now survive restarts. This is the desired behaviour. No regression risk to normal session expiry or revocation logic.
   Acceptance Criteria:

- Active sessions created before a server restart remain valid after restart
- Expired sessions are still rejected
- Revoked sessions are still rejected
  Test Plan:
- `npm test`
- Unit test: create a session with `createdAt` before `SERVER_START_TIME`; assert `getSession()` returns it (not null)

---

## SPEC-008

Audit-ID: HIGH-04
Title: Gate Swagger UI behind environment check
Problem: The API documentation endpoint `/api-docs` is accessible to unauthenticated users in all environments. It exposes all endpoint details, request/response schemas, and the security model — providing direct reconnaissance value to attackers in production.
Implementation Plan:

1. Open `server/swagger.ts`
2. At the top of `setupSwagger()`, add: `if (process.env.NODE_ENV === "production") { return; }`
   Files to Modify: server/swagger.ts
   Risks: Developers relying on `/api-docs` in production will lose access. If production API docs are required, the return can be replaced with an admin-auth guard.
   Acceptance Criteria:

- `GET /api-docs` returns 404 (or similar non-doc response) when `NODE_ENV=production`
- `GET /api-docs` works normally when `NODE_ENV=development`
  Test Plan:
- `npm test`
- Manual with `NODE_ENV=production npm start`: request `/api-docs`; expect no Swagger UI
- Manual with `NODE_ENV=development npm run dev`: request `/api-docs`; expect Swagger UI

---

## SPEC-009

Audit-ID: HIGH-05
Title: Update README.md to reflect current project state
Problem: README.md contains multiple inaccuracies: React version listed as 18 (actual: 19), wrong JWT env var names (`JWT_SECRET` vs `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`), outdated Docker Node image tag, missing core security features, missing API endpoints, and no mention of file-based storage. These inaccuracies will confuse contributors and damage project credibility.
Implementation Plan:

1. Open `README.md`
2. Update Technology Stack: React 18 → React 19
3. Update Environment Variables section: replace `JWT_SECRET` with `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
4. Update Docker example: `node:18-alpine` → `node:20-alpine`
5. Add Security Features section listing: Helmet CSP, CSRF protection, rate limiting, audit logging
6. Add missing API endpoints: `/api/auth/refresh`, `/api/auth/logout-all`, `/api/auth/password-reset/request`, `/api/auth/password-reset/confirm`
7. Add note about file-based JSON storage as the default development mode
   Files to Modify: README.md
   Risks: Pure documentation change; no code risk.
   Acceptance Criteria:

- README states React 19
- README lists `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (not `JWT_SECRET`)
- README Docker example uses `node:20-alpine`
- README includes a Security Features section
- README lists refresh, logout-all, and password-reset endpoints
- README mentions file-based storage
  Test Plan:
- Manual review of README.md against acceptance criteria

---

## SPEC-010

Audit-ID: HIGH-06
Title: Replace `npx tsx` with locally installed tsx in Dockerfile
Problem: `CMD ["npx", "tsx", "server/index.ts"]` in `Dockerfile` line 43 uses `npx` to resolve tsx at runtime, introducing supply-chain risk and cold-start overhead. The TypeScript source must be bundled in the image (larger attack surface).
Implementation Plan:

1. Open `Dockerfile`
2. Replace `CMD ["npx", "tsx", "server/index.ts"]` with `CMD ["./node_modules/.bin/tsx", "server/index.ts"]`
   Files to Modify: Dockerfile
   Risks: Requires `tsx` to be a non-devDependency (or present in `node_modules` after production install). Verify it is listed in `dependencies`, not only `devDependencies`.
   Acceptance Criteria:

- Docker image starts without invoking `npx`
- `tsx` is resolved from `node_modules/.bin/tsx`
  Test Plan:
- `docker build -t devnest-test .`
- `docker run --env-file .env devnest-test` — server must start without error

---

## SPEC-011

Audit-ID: HIGH-07
Title: Restrict null-origin CORS to non-production environments
Problem: `if (!origin) { return callback(null, true); }` in `server/index.ts` allows all requests without an `Origin` header unconditionally. In production this includes sandboxed iframes that send `Origin: null` and certain redirect-based attack scenarios.
Implementation Plan:

1. Open `server/index.ts`
2. Locate the CORS origin callback
3. Wrap the `!origin` allow branch: only allow null origin when `env.NODE_ENV !== "production"`; otherwise log a warning and return a CORS error
   Files to Modify: server/index.ts
   Risks: In production, `curl` and Postman requests without an Origin header will be blocked. This is the intended behaviour for production security.
   Acceptance Criteria:

- In production mode, a request with no `Origin` header is rejected with a CORS error
- In development mode, a request with no `Origin` header is allowed
- Requests from allowed origins still succeed in production
  Test Plan:
- `npm test`
- Manual with `NODE_ENV=production`: `curl -X GET /api/health` (no Origin); expect CORS rejection
- Manual with `NODE_ENV=development`: same curl; expect 200

---

## SPEC-012

Audit-ID: MED-01
Title: Remove broken `getCSRFToken()` method from SessionManager
Problem: `getCSRFToken()` in `server/auth/session-manager.ts` (lines 272–277) generates a new random token on every call instead of returning the stored token. It will never match the stored hash, making it functionally broken and misleading to contributors about how CSRF tokens work in this system.
Implementation Plan:

1. Open `server/auth/session-manager.ts`
2. Delete the `getCSRFToken()` method entirely (the dead code block)
   Files to Modify: server/auth/session-manager.ts
   Risks: If any code path calls `getCSRFToken()`, removing it will cause a TypeScript compile error — this would reveal an existing bug. Verify no callers exist before removing.
   Acceptance Criteria:

- `getCSRFToken()` method no longer exists in `SessionManager`
- No TypeScript compile errors after removal
- Existing CSRF validation flow still works end-to-end
  Test Plan:
- `npm test`
- `npx tsc --noEmit` — expect zero errors

---

## SPEC-013

Audit-ID: MED-02
Title: Reduce information disclosure in health endpoints
Problem: `GET /health/ready` returns raw memory usage numbers (used, total, percentage), providing heap profiling and resource exhaustion timing data useful for attackers. The admin stats endpoint also exposes `nodeVersion`. Both are unnecessary information disclosures.
Implementation Plan:

1. Open `server/health.ts`
2. In `handleReadinessCheck()`, replace detailed memory object with a string status: `memory: memoryCheck.percentage > 90 ? "high" : "ok"`
3. Open `server/api/admin-routes.ts`
4. In the `GET /api/admin/stats` handler, remove `nodeVersion: process.version`
   Files to Modify: server/health.ts, server/api/admin-routes.ts
   Risks: Monitoring integrations relying on numeric memory values from `/health/ready` will need to be updated.
   Acceptance Criteria:

- `/health/ready` response does not include numeric memory figures
- `/api/admin/stats` response does not include `nodeVersion`
- Health check still returns correct overall status (healthy/unhealthy)
  Test Plan:
- `npm test`
- Manual: `GET /health/ready`; assert no `used`/`total`/`percentage` memory fields
- Manual: `GET /api/admin/stats`; assert no `nodeVersion` field

---

## SPEC-014

Audit-ID: MED-04
Title: Add pagination to admin user list endpoint
Problem: `GET /api/admin/users` returns all users in a single response. With thousands of users this causes memory spikes, slow API responses, and large payloads.
Implementation Plan:

1. Open `server/api/admin-routes.ts`
2. In the `GET /api/admin/users` handler, read `limit` and `offset` from `req.query`
3. Clamp `limit` to max 200, default 50; clamp `offset` to min 0, default 0
4. Slice the user array accordingly and return `{ users, total, limit, offset }`
   Files to Modify: server/api/admin-routes.ts
   Risks: Any frontend or test expecting a flat array response will break. Response shape changes from `User[]` to `{ users: User[], total: number, limit: number, offset: number }`.
   Acceptance Criteria:

- `GET /api/admin/users` without params returns at most 50 users
- `GET /api/admin/users?limit=10&offset=20` returns users 20–29
- `limit` is capped at 200
- Response includes `total`, `limit`, `offset` fields
  Test Plan:
- `npm test`
- Unit test: seed 100 users; call with default params; expect 50 returned + total=100
- Unit test: call with limit=10, offset=5; expect users[5..14]

---

## SPEC-015

Audit-ID: MED-05
Title: Make crossOriginEmbedderPolicy environment-aware
Problem: `crossOriginEmbedderPolicy: false` is set unconditionally in `server/index.ts`. This was likely done for development compatibility but should be enabled in production to support `SharedArrayBuffer` isolation and modern browser security features.
Implementation Plan:

1. Open `server/index.ts`
2. Locate the Helmet configuration line with `crossOriginEmbedderPolicy: false`
3. Replace with `crossOriginEmbedderPolicy: env.NODE_ENV === "production"`
   Files to Modify: server/index.ts
   Risks: In production, enabling COEP may break cross-origin resource loading (fonts, images, third-party scripts) unless those resources also set CORP headers. Test thoroughly in a staging environment.
   Acceptance Criteria:

- `crossOriginEmbedderPolicy` header is set in production
- `crossOriginEmbedderPolicy` is not set (or false) in development
  Test Plan:
- `npm test`
- Manual with `NODE_ENV=production`: check response headers; expect `Cross-Origin-Embedder-Policy: require-corp`

---

## SPEC-016

Audit-ID: MED-06
Title: Add Node.js version specification files
Problem: No `.nvmrc` or `engines` field exists. CI uses Node 20 but contributors have no way to know this. Wrong Node version causes subtle build/runtime issues.
Implementation Plan:

1. Create `.nvmrc` in repo root with content `20`
2. Open `package.json`
3. Add `"engines": { "node": ">=20.0.0", "npm": ">=10.0.0" }`
   Files to Modify: package.json, .nvmrc (create)
   Risks: None — purely additive. npm will warn (but not fail) if the engines field is not met.
   Acceptance Criteria:

- `.nvmrc` exists at repo root containing `20`
- `package.json` contains `engines.node` >= 20.0.0
- `package.json` contains `engines.npm` >= 10.0.0
  Test Plan:
- `cat .nvmrc` — expect `20`
- `node -e "const p=require('./package.json'); console.log(p.engines)"` — expect version fields

---

## SPEC-017

Audit-ID: MED-08
Title: Remove REPL_ID env var from schema
Problem: `REPL_ID: z.string().optional()` in `server/env.ts` is a Replit platform artifact that is confusing and unnecessary for a public educational codebase.
Implementation Plan:

1. Open `server/env.ts`
2. Delete the `REPL_ID: z.string().optional()` line
   Files to Modify: server/env.ts
   Risks: None — the field is optional so removing it causes no runtime error. Replit users who set this env var will simply have it ignored.
   Acceptance Criteria:

- `REPL_ID` is not present in the env schema
- Server starts without error
  Test Plan:
- `npm test`
- `npx tsc --noEmit`

---

## SPEC-018

Audit-ID: FILE-01
Title: Create CONTRIBUTING.md
Problem: No contributor guide exists. External contributors have no guidance on setup, branching, commit format, PR requirements, or code style. Required for open-source readiness.
Implementation Plan:

1. Create `CONTRIBUTING.md` at repo root
2. Include: prerequisites (Node 20, npm 10+), one-command setup, branching strategy, Conventional Commits format, PR requirements, test command, code style (TypeScript strict, named exports, functional components), link to SECURITY.md
   Files to Modify: CONTRIBUTING.md (create)
   Risks: None.
   Acceptance Criteria:

- `CONTRIBUTING.md` exists at repo root
- Contains setup instructions referencing Node 20
- Contains commit message format (Conventional Commits)
- Links to SECURITY.md
  Test Plan:
- Manual review of file content against acceptance criteria

---

## SPEC-019

Audit-ID: FILE-02
Title: Create SECURITY.md
Problem: No security disclosure policy exists. Required for open-source projects. Without it, researchers have no sanctioned channel for reporting vulnerabilities, leading to public disclosure.
Implementation Plan:

1. Create `SECURITY.md` at repo root
2. Include: supported versions table, instructions to NOT open public issues, private reporting contact, 48-hour response commitment, responsible disclosure commitment
   Files to Modify: SECURITY.md (create)
   Risks: None.
   Acceptance Criteria:

- `SECURITY.md` exists at repo root
- Contains supported versions table
- Explicitly instructs reporters NOT to open public GitHub issues
- Provides a reporting contact/method
  Test Plan:
- Manual review of file content

---

## SPEC-020

Audit-ID: FILE-03
Title: Create CODE_OF_CONDUCT.md
Problem: No code of conduct exists. Required for open-source community health. Without it, there is no framework for handling disruptive or harmful contributor behaviour.
Implementation Plan:

1. Create `CODE_OF_CONDUCT.md` at repo root using Contributor Covenant v2.1
2. Customize the enforcement contact email placeholder
   Files to Modify: CODE_OF_CONDUCT.md (create)
   Risks: None.
   Acceptance Criteria:

- `CODE_OF_CONDUCT.md` exists at repo root
- Based on Contributor Covenant v2.1
- Contains a non-placeholder enforcement contact
  Test Plan:
- Manual review of file content

---

## SPEC-021

Audit-ID: FILE-04
Title: Create CHANGELOG.md
Problem: No changelog exists. Contributors and users cannot track what changed between versions.
Implementation Plan:

1. Create `CHANGELOG.md` at repo root following Keep a Changelog format
2. Include an `[Unreleased]` section and a `[1.0.0]` entry documenting the initial feature set
   Files to Modify: CHANGELOG.md (create)
   Risks: None.
   Acceptance Criteria:

- `CHANGELOG.md` exists at repo root
- Follows Keep a Changelog format
- Contains `[Unreleased]` section
- Contains `[1.0.0]` entry
  Test Plan:
- Manual review of file content

---

## SPEC-022

Audit-ID: FILE-05
Title: Create GitHub issue templates
Problem: No issue templates exist. Without them, bug reports and feature requests lack structured information, increasing triage effort.
Implementation Plan:

1. Create `.github/ISSUE_TEMPLATE/bug_report.yml` with fields: description, steps to reproduce, expected behavior, environment dropdown
2. Create `.github/ISSUE_TEMPLATE/feature_request.yml` with fields: problem statement, proposed solution, checklist
   Files to Modify: .github/ISSUE_TEMPLATE/bug_report.yml (create), .github/ISSUE_TEMPLATE/feature_request.yml (create)
   Risks: None.
   Acceptance Criteria:

- Both YAML template files exist in `.github/ISSUE_TEMPLATE/`
- `bug_report.yml` includes description, reproduction steps, expected behavior, environment fields
- `feature_request.yml` includes problem, solution, and checklist fields
  Test Plan:
- Manual review; open a test issue on GitHub to verify template renders

---

## SPEC-023

Audit-ID: FILE-06
Title: Create Pull Request template
Problem: No PR template exists. Without it, pull request descriptions are inconsistent and often lack test plans or context.
Implementation Plan:

1. Create `.github/PULL_REQUEST_TEMPLATE.md` with sections: Summary, Changes Made, Test Plan, Checklist (tests pass, TypeScript no errors, no secrets committed, linked issue)
   Files to Modify: .github/PULL_REQUEST_TEMPLATE.md (create)
   Risks: None.
   Acceptance Criteria:

- `.github/PULL_REQUEST_TEMPLATE.md` exists
- Contains Summary, Test Plan, and Checklist sections
  Test Plan:
- Manual review; open a test PR to verify template is pre-populated
