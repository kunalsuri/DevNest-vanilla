# Architecture Overview — DevNest-Vanilla

## 1. Runtime Topology

```
Browser (React SPA)
       │
       │  HTTP/HTTPS — port 5000
       ▼
┌──────────────────────────────────────────────┐
│  Express 5 Server  (server/index.ts)         │
│                                              │
│  Security Layer (applied in order):          │
│   1. Sentry (initSentry)                     │
│   2. Helmet (CSP, HSTS, XSS, noSniff)        │
│   3. CORS (origin allowlist from env)        │
│   4. Rate Limiter — /api/* (general)         │
│   5. Rate Limiter — /api/auth/* (strict, 5/15m) │
│   6. Body Parser (JSON + urlencoded, 10mb)   │
│   7. Trace Middleware (X-Trace-Id injection) │
│   8. Data dir blocker (/data/ → 404)         │
│                                              │
│  Route Layer:                                │
│   • /health, /health/ready   (unauthenticated) │
│   • /api-docs                (Swagger UI)    │
│   • /api/auth/*              (JWT auth)      │
│   • /api/profile/*           (authenticated) │
│   • /api/admin/*             (admin-only)    │
│   • /api/notifications/*     (authenticated) │
│   • /api/subscriptions/*     (authenticated) │
│   • /api/feature-flags/*     (admin-only)    │
│   • /api/logs                (authenticated) │
│                                              │
│  Static / SPA fallback:                      │
│   • Dev: Vite HMR proxy (setupVite)          │
│   • Prod: serveStatic (dist/public)          │
└──────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────┐
│  FileStorage         │  ← Default runtime backend
│  (server/storage.ts) │
│                      │
│  data/               │
│   users.json         │
│   password_reset_    │
│     tokens.json      │
│   preferences.json   │
│   sessions.json      │
│   feature-flags.json │
└──────────────────────┘
       │
       │  (optional — set DATABASE_URL + npm run db:push)
       ▼
┌──────────────────────┐
│  PostgreSQL (Neon)   │
│  (NOT active by      │
│   default)           │
└──────────────────────┘
```

---

## 2. Authentication Flow

```
Client                           Server
  │                                │
  │── POST /api/auth/login ────────►│
  │                                │  1. Zod validate body
  │                                │  2. authService.login()
  │                                │     a. getUserByUsername → storage
  │                                │     b. bcrypt.compare(password, hash)
  │                                │     c. Check account lockout (lockedUntil)
  │                                │     d. signAccessToken (15 min)
  │                                │     e. signRefreshToken (7 days)
  │                                │     f. bcrypt.hash(refreshToken) → session
  │                                │     g. bcrypt.hash(csrfToken) → session
  │                                │     h. sessionManager.createSession()
  │◄── 200 { accessToken, csrfToken } ──│
  │    + Set-Cookie: refreshToken (httpOnly)
  │    + Set-Cookie: csrfToken (JS-readable)
  │                                │
  │── GET /api/profile ────────────►│
  │   Authorization: ******   │  1. validateAccessToken middleware
  │   X-CSRF-Token: <csrf>         │     → verifyAccessToken(jwt)
  │                                │     → attach jwtUser to req
  │                                │  2. validateCSRF middleware
  │                                │     → bcrypt.compare against session hash
  │◄── 200 { profile } ────────────│
```

---

## 3. Data Flow — User Preferences

```
Client (PreferencesPage)
  → useQuery/useMutation (TanStack Query)
  → /api/profile/preferences
  → authenticate middleware
  → profile.ts route handler
  → storage.getUserPreferences() / updateUserPreferences()
  → data/preferences.json (Mutex-protected write)
```

---

## 4. Security Boundaries

| Boundary | Enforcement Mechanism |
|---|---|
| Unauthenticated access | `authenticate` middleware (JWT verify + session check) |
| Admin-only routes | `requireAdmin` middleware (role === 'admin') |
| CSRF attacks | `validateCSRF` middleware (token in header, hash in session) |
| Brute-force login | Account lockout (5 failed attempts) + authLimiter (5/15min) |
| Credential exposure | Password fields stripped in all responses (`PublicUser` type) |
| Data dir access | Express route blocks `/data/{*path}` → 404 |
| Secret leakage in logs | `SENSITIVE_FIELDS` list sanitized before `logger.error()` |

---

## 5. Module Boundaries

| Module | Owner Layer | Public Interface |
|---|---|---|
| `shared/schema.ts` | Both | Zod schemas + TypeScript types |
| `server/storage.ts` | Server | `IStorage` interface |
| `server/auth/` | Server | `authenticate`, `requireAdmin`, `validateCSRF` |
| `server/services/` | Server | Imported via `server/services/index.ts` |
| `client/src/lib/queryClient.ts` | Client | `queryClient`, `apiRequest` |
| `client/src/features/*/index.ts` | Client | Barrel exports per feature |

---

## 6. Environment Variables (from `server/env.ts`)

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | Controls CSP, logging verbosity |
| `PORT` | `5000` | Server listen port |
| `JWT_SECRET` | — | Signs access tokens (required) |
| `JWT_REFRESH_SECRET` | — | Signs refresh tokens (required) |
| `JWT_EXPIRES_IN` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `ALLOWED_ORIGINS` | — | CORS allow-list (comma-separated) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `DATABASE_URL` | — | Optional; enables PostgreSQL mode |
| `SENTRY_DSN` | — | Optional; enables error tracking |
