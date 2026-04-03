# Migration 2026 — Action Tracking List

This file tracks all planned feature implementations and refactors for the DevNest-vanilla 2026 modernization cycle.
It follows the **Evaluation-Driven Development with Full Traceability** principle.

> **Workflow rule:** Every row must progress through all four gates — Implemented → Tests Created → Tests Passed → Evaluation Notes — before being considered done.
> Update the `Last Updated` column and `Evaluation Notes` after every gate completes.

---

## Tracking Table

| #   | Feature Name                            | Description                                                                                                                                                                                                                                                                                | Priority | Implemented (Yes/No) | Tests Created (Yes/No) | Tests Passed (Yes/No) | Coverage % | Evaluation Notes                                                                                                                             | Last Updated |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | -------------------- | ---------------------- | --------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | Patch Vulnerable Dependencies           | Run `npm audit fix` on all direct dependencies with high/critical CVEs: `express`, `multer`, `express-rate-limit`, `@sentry/node`, `rollup`, `jws`, and transitive chains (`qs`, `path-to-regexp`, `flatted`, `minimatch`, `validator`). Re-run audit and confirm no high/critical remain. | HIGH     | No                   | No                     | No                    | —          | Starting point: 20 vulnerabilities (12 High, 7 Moderate, 1 Low). Target: 0 High/Critical after patch.                                        | 2026-04-03   |
| 2   | Enforce CSRF on All Mutating Endpoints  | Apply `validateCSRF` middleware (already in `server/auth/auth-middleware.ts`) consistently on all `POST/PUT/PATCH/DELETE` authenticated endpoints in `server/profile.ts` and `server/auth/jwt-auth-routes.ts`. Use `protectedRoute` composite middleware where appropriate.                | HIGH     | No                   | No                     | No                    | —          | CSRF middleware exists but is not uniformly applied to profile PUT, DELETE, and preferences PUT endpoints.                                   | 2026-04-03   |
| 3   | Harden Production Secret Validation     | Change `server/env.ts` production check so the process **exits with a non-zero code** if default dev secrets are present in production (un-comment / replace the warning-only block).                                                                                                      | HIGH     | No                   | No                     | No                    | —          | Current code logs warnings but allows booting with insecure defaults — a significant security risk.                                          | 2026-04-03   |
| 4   | Remove Hardcoded Local Filesystem Paths | Remove the hardcoded absolute path `/Users/ks248120/Documents/GitHub/DevNest/logs` in `client/src/App.tsx`. Drive `logDirectory` via `VITE_LOG_DIR` env var with a portable fallback (`logs`).                                                                                             | HIGH     | No                   | No                     | No                    | —          | Hardcoded developer machine path would fail in every non-local environment including CI and production.                                      | 2026-04-03   |
| 5   | Migrate Session Storage to DB/Redis     | Replace file-based `SessionManager` (JSON file) with a proper persistent store (`connect-pg-simple` + PostgreSQL, or Redis). Decouple session lifecycle from process uptime (remove `SERVER_START_TIME` invalidation).                                                                     | HIGH     | No                   | No                     | No                    | —          | File-based sessions are non-concurrent, non-scalable, and invalidate on every restart. Blocks horizontal scaling and zero-downtime deploys.  | 2026-04-03   |
| 6   | Migrate User & Token Storage to DB      | Replace `FileStorage` class in `server/storage.ts` with a `DrizzleStorage` class backed by the existing `shared/schema.ts` Drizzle table definitions. Guard with runtime `DATABASE_URL` check and fall back to `FileStorage` only in local dev.                                            | HIGH     | No                   | No                     | No                    | —          | All user data, password reset tokens, and preferences currently persisted to flat JSON files. Not production-worthy.                         | 2026-04-03   |
| 7   | Wire Route Handlers to Service Layer    | Refactor `server/auth/jwt-auth-routes.ts` and `server/profile.ts` to delegate business logic to the existing `authService` and `userService` instead of duplicating logic in route callbacks.                                                                                              | MEDIUM   | No                   | No                     | No                    | —          | `server/services/` layer exists but is unused by actual routes. Duplication increases maintenance burden and bug surface.                    | 2026-04-03   |
| 8   | Strengthen File Upload Validation       | Add file content signature validation (magic bytes check) to the `multer` file filter in `server/profile.ts`. Also add explicit file extension allowlist (`jpg`, `jpeg`, `png`, `gif`, `webp`) independent of MIME header.                                                                 | MEDIUM   | No                   | No                     | No                    | —          | Current filter only checks `file.mimetype.startsWith('image/')`, which can be spoofed via Content-Type.                                      | 2026-04-03   |
| 9   | Gate CI Security Checks as Blocking     | Update `.github/workflows/ci.yml` to remove `continue-on-error: true` from the `npm audit` job and set `--audit-level=high`. Also enforce ESLint as a blocking step.                                                                                                                       | MEDIUM   | No                   | No                     | No                    | —          | Current CI security scan is advisory only and cannot block merges with known vulnerabilities.                                                | 2026-04-03   |
| 10  | Optimize Hot-Path Logging               | Move response body JSON serialization (`JSON.stringify(capturedJsonResponse)`) in `server/index.ts` to debug level only, and remove it from production builds. Add log-level environment guard.                                                                                            | MEDIUM   | No                   | No                     | No                    | —          | Serializing every API response body on every request is CPU-expensive at scale and may leak PII in logs.                                     | 2026-04-03   |
| 11  | Remove Dead Dependencies                | Remove `connect-pg-simple` and `express-session` from `dependencies` (not used in runtime after JWT migration). Remove `tw-animate-css` if redundant with `tailwindcss-animate`. Audit remaining unused packages.                                                                          | LOW      | No                   | No                     | No                    | —          | Reduces attack surface and install footprint. `express-session` types and connect-pg-simple are currently unused after JWT-only auth design. | 2026-04-03   |
| 12  | Migrate to Tailwind CSS v4              | Upgrade from Tailwind CSS v3 to v4. Replace `postcss.config.js` + `tailwind.config.ts` approach with `@tailwindcss/vite` plugin (already partially in devDependencies). Update `index.css` `@tailwind` directives to v4 syntax.                                                            | LOW      | No                   | No                     | No                    | —          | Tailwind v4 brings significant performance and CSS layer improvements. The `@tailwindcss/vite` plugin is already installed.                  | 2026-04-03   |
| 13  | Upgrade Express to v5                   | Migrate `express` and all related types/middleware to Express v5. Update error handler signatures, remove deprecated `res.json()` monkey-patching, and update routing patterns where needed.                                                                                               | LOW      | No                   | No                     | No                    | —          | Express 5 is stable and the current v4 chain has multiple transitive CVEs. Requires testing all middleware and route patterns.               | 2026-04-03   |
| 14  | Upgrade React to v19                    | Migrate from React 18 to React 19. Evaluate new compiler optimizations, concurrent APIs, and any breaking changes in component patterns or hooks. Update `@types/react` and `@types/react-dom`.                                                                                            | LOW      | No                   | No                     | No                    | —          | React 19 is stable. Some Radix UI components and framer-motion may need compatibility review.                                                | 2026-04-03   |
| 15  | Upgrade Zod to v4                       | Migrate from Zod 3 to Zod 4. Evaluate breaking API changes in schema definitions in `shared/schema.ts`, `server/env.ts`, and validation middleware.                                                                                                                                        | LOW      | No                   | No                     | No                    | —          | Zod 4 brings significant performance improvements (3–10×) and smaller bundles. Requires renaming some APIs and updating `drizzle-zod`.       | 2026-04-03   |
| 16  | Add LLM Integration Scaffolding         | Create the `server/ai/` module boundary with sub-directories: `providers/`, `orchestrators/`, `safety/`, `telemetry/`. Add a provider abstraction interface and a no-op default adapter. No actual LLM implementation yet.                                                                 | LOW      | No                   | No                     | No                    | —          | Establishes the architectural contract for future LLM feature work. Prevents scattered ad-hoc integrations.                                  | 2026-04-03   |
| 17  | Add Async Job Queue Infrastructure      | Integrate a lightweight job queue (e.g., `pg-boss` for PostgreSQL or `bullmq` for Redis) for async background tasks. Connects with DB migration work (item 5, 6) and is prerequisite for LLM streaming features.                                                                           | LOW      | No                   | No                     | No                    | —          | Required for LLM inference tasks that exceed HTTP request timeouts. Foundation for durable task execution.                                   | 2026-04-03   |

---

## Status Definitions

| Status        | Meaning                |
| ------------- | ---------------------- |
| `No`          | Not yet started        |
| `In Progress` | Work has begun         |
| `Yes`         | Completed and verified |

## Priority Definitions

| Priority | Criteria                                                       |
| -------- | -------------------------------------------------------------- |
| `HIGH`   | Security risk, data loss risk, or blocks production deployment |
| `MEDIUM` | Correctness, reliability, or developer experience issue        |
| `LOW`    | Modernization, future scalability, or new capability           |

---

## Progress Summary

| Priority  | Total  | Implemented | Tests Created | Tests Passed |
| --------- | ------ | ----------- | ------------- | ------------ |
| HIGH      | 6      | 0           | 0             | 0            |
| MEDIUM    | 4      | 0           | 0             | 0            |
| LOW       | 7      | 0           | 0             | 0            |
| **Total** | **17** | **0**       | **0**         | **0**        |

> Last progress summary update: **2026-04-03**

---

## Change Log

| Date       | Item # | Gate Completed   | Notes                                                                                |
| ---------- | ------ | ---------------- | ------------------------------------------------------------------------------------ |
| 2026-04-03 | —      | File initialized | Migration tracking file created from codebase audit results. 17 action items logged. |
