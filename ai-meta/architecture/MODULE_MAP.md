# Module Map — File-to-Logical-Module Mapping

> All paths relative to repository root.

---

## SERVER

### Bootstrap & Config
| File | Module | Role |
|---|---|---|
| `server/index.ts` | Bootstrap | Express app init, security middleware, server listen |
| `server/routes.ts` | Bootstrap | Route registration, session cleanup scheduler |
| `server/env.ts` | Config | Zod-validated environment variable contract |
| `server/server-start-time.ts` | Config | Exported server start timestamp |

### Authentication
| File | Module | Role |
|---|---|---|
| `server/auth/jwt-auth-routes.ts` | Auth | Register, login, logout, refresh, password-reset routes |
| `server/auth/auth-middleware.ts` | Auth | `authenticate`, `requireAdmin`, `validateCSRF`, `protectedRoute` |
| `server/auth/jwt-utils.ts` | Auth | `signAccessToken`, `signRefreshToken`, `verifyAccessToken`, `verifyRefreshToken` |
| `server/auth/session-manager.ts` | Auth | Session CRUD, CSRF validation, cleanup; persists to `data/sessions.json` |

### API Routes
| File | Module | Role |
|---|---|---|
| `server/profile.ts` | Profile API | GET/PUT profile, GET/PUT preferences, avatar upload |
| `server/api/admin-routes.ts` | Admin API | User list, user detail, role change, user deletion |
| `server/api/notification-routes.ts` | Notifications API | CRUD for in-app notifications |
| `server/api/subscription-routes.ts` | Subscriptions API | Plan management endpoints |
| `server/api/feature-flag-routes.ts` | Feature Flags API | Admin toggle of feature flags |
| `server/logging-endpoint.ts` | Logs API | POST /api/logs (browser log sink), GET /api/logs (admin) |
| `server/health.ts` | Health | GET /health (liveness), GET /health/ready (readiness) |

### Services
| File | Module | Role |
|---|---|---|
| `server/services/index.ts` | Services | Barrel — exports all service singletons |
| `server/services/auth-service.ts` | Auth Service | Business logic: register, login, refresh, logout, password reset |
| `server/services/user-service.ts` | User Service | User CRUD, role management |
| `server/services/audit-log-service.ts` | Audit Service | Write audit events to `data/audit.json` |
| `server/services/feature-flag-service.ts` | Feature Flag Service | Load/persist flags, evaluate flag for user |
| `server/services/notification-service.ts` | Notification Service | In-app notification CRUD |
| `server/services/subscription-service.ts` | Subscription Service | Subscription plan state |

### Storage
| File | Module | Role |
|---|---|---|
| `server/storage.ts` | Storage | `IStorage` interface + `FileStorage` implementation (JSON file backend) |

### Middleware
| File | Module | Role |
|---|---|---|
| `server/middleware/trace-middleware.ts` | Middleware | Injects `X-Trace-Id` and `req.traceId` |
| `server/middleware/validation.ts` | Middleware | `express-validator` chains for register/login inputs |

### Observability
| File | Module | Role |
|---|---|---|
| `server/logger.ts` | Logging | Winston logger factory (console + daily rotate file) |
| `server/monitoring/sentry.ts` | Monitoring | Sentry Node SDK init + error handler setup |
| `server/swagger.ts` | Docs | Swagger/OpenAPI setup at `/api-docs` |
| `server/vite.ts` | Dev | Vite dev server proxy (development only) |

---

## CLIENT

### Entry
| File | Module | Role |
|---|---|---|
| `client/index.html` | Entry | HTML shell |
| `client/src/main.tsx` | Entry | React root mount, QueryClient, Sentry init |
| `client/src/App.tsx` | Router | Wouter routes → page components |
| `client/src/index.css` | Styles | Tailwind base + CSS variable tokens |

### Pages
| File | Module | Role |
|---|---|---|
| `client/src/pages/landing-page.tsx` | Landing | Public marketing/welcome page |
| `client/src/pages/auth-page.tsx` | Auth | Login / registration form page |
| `client/src/pages/dashboard-page.tsx` | Dashboard | Authenticated main dashboard |
| `client/src/pages/profile-page.tsx` | Profile | User profile view/edit |
| `client/src/pages/preferences-page.tsx` | Preferences | Account settings/preferences |
| `client/src/pages/workspaces-page.tsx` | Workspaces | Workspace management (PARTIAL — UI scaffold) |
| `client/src/pages/help-page.tsx` | Help | Static help/FAQ page |
| `client/src/pages/admin-users-page.tsx` | Admin | Admin user management table |
| `client/src/pages/not-found.tsx` | Routing | 404 fallback page |

### Feature Modules
| Directory | Module | Key Exports |
|---|---|---|
| `client/src/features/auth/` | Auth | `useAuth` hook, auth utils |
| `client/src/features/dashboard/` | Dashboard | Dashboard stats/widgets components |
| `client/src/features/user-profile/` | Profile | `ProfileCard`, profile API hooks, profile types |
| `client/src/features/app-shell/` | App Shell | Sidebar, navbar, layout components, nav config |
| `client/src/features/observability/` | Observability | Client-side metrics, error reporting components/services |

### Lib / Utilities
| File | Module | Role |
|---|---|---|
| `client/src/lib/queryClient.ts` | HTTP | TanStack Query client + `apiRequest` helper |
| `client/src/lib/protected-route.tsx` | Routing | HOC that redirects unauthenticated users |
| `client/src/lib/utils.ts` | Utils | `cn()` class merge, misc helpers |
| `client/src/lib/logger.ts` | Logging | Client-side logger (sends to /api/logs) |
| `client/src/lib/tracing.ts` | Tracing | Client trace context helper |
| `client/src/lib/metrics.ts` | Metrics | Client performance metric collectors |
| `client/src/lib/sentry.ts` | Monitoring | Sentry React SDK init |
| `client/src/lib/error-logger.ts` | Error | Unhandled error capture + report |
| `client/src/lib/server-transport.ts` | Logging | HTTP transport for client logs → server |
| `client/src/lib/file-transport.ts` | Logging | Local file/storage transport |

### Components
| Directory/File | Module | Role |
|---|---|---|
| `client/src/components/ui/` | UI Primitives | shadcn/ui component library (Button, Dialog, Input, …) |
| `client/src/components/theme-provider.tsx` | Theming | `next-themes` provider wrapper |
| `client/src/components/error-boundary.tsx` | Error | React error boundary with Sentry integration |
| `client/src/components/async-states.tsx` | Loading | `<Loading>` and `<Empty>` state components |

---

## SHARED

| File | Module | Role |
|---|---|---|
| `shared/schema.ts` | Schema | Drizzle table defs (type-gen), Zod schemas, TypeScript types |
| `shared/error-codes.ts` | Error Codes | Shared error code constants |

---

## TESTS

| Directory | Scope | Framework |
|---|---|---|
| `tests/unit/server/` | Server unit tests | Vitest |
| `tests/unit/client/` | Client unit tests | Vitest + Testing Library |
| `tests/unit/shared/` | Shared schema tests | Vitest |
| `tests/unit/feature-flag-service.test.ts` | Feature flag service | Vitest |
| `tests/unit/user-service.test.ts` | User service | Vitest |
| `tests/integration/integration.test.ts` | API integration | Vitest + Supertest |
| `tests/integration/smoke.test.ts` | Server smoke | Vitest + Supertest |
| `tests/setup/` | Test setup/mocks | Vitest setup files |

---

## CONFIG / TOOLING

| File | Purpose |
|---|---|
| `tsconfig.json` | TypeScript config — paths alias `@shared/*` → `shared/*` |
| `vite.config.ts` | Vite build + `@shared` alias + Sentry plugin |
| `vitest.config.ts` | Vitest test runner config |
| `drizzle.config.ts` | Drizzle Kit migration config (PostgreSQL mode) |
| `tailwind.config.ts` | Tailwind CSS config |
| `eslint.config.js` | ESLint flat config |
| `.prettierrc` | Prettier formatting rules |
| `docker-compose.yml` | Docker Compose for containerized deployment |
| `Dockerfile` | Multi-stage Docker build |
| `scripts/` | Admin utilities: seed users, create admin, backup/restore data, build server |
