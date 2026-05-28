# DevNest

[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

A production-ready full-stack monorepo template. Spin up a complete app — React 19 frontend, Express 5 backend, JWT auth with RBAC, admin dashboard, dark mode, observability, and 30+ shadcn/ui components — in minutes.

**What's included:** JWT auth · Role-based access control · Password reset flow · Admin user management · Audit logging · Dark/light theme · Responsive UI · Docker support · File-based storage (PostgreSQL optional)

## Quick Start

```bash
git clone https://github.com/kunalsuri/DevNest-vanilla.git
cd DevNest-vanilla
npm install
cp .env.example .env   # edit secrets before production use
npm run dev             # http://localhost:5000
```

Requires **Node.js 20+** and **npm 10+**. PostgreSQL is optional — file-based JSON storage works out of the box.

---

## 🤖 For Developers & AI Agents

This is a **SaaS template** built with specification-driven development and AI-first documentation.

**Every AI agent starts at [`/AGENTS.md`](AGENTS.md)** — the open-standard constitution
(read by Claude Code, Copilot, Cursor, Codex, Gemini CLI, and more). It defines the prime
directive, the **specs-vs-features** distinction, the spec lifecycle, and safety levels.
Deep reference docs live in **[`/agent/`](agent/README.md)**: load
[`/agent/INDEX.yaml`](agent/INDEX.yaml) first for a compact feature lookup, then open
[`FEATURE_MAP.md`](agent/FEATURE_MAP.md) only for the feature you touch.

No code in `server/`, `client/`, or `shared/` without an approved spec under
[`/agent/specs/`](agent/SDD_CONTROL.md). Scaffold one with `npm run feature:new`.

---

## Scripts

| Command                 | Description                                      |
| ----------------------- | ------------------------------------------------ |
| `npm run dev`           | Start dev server (hot reload)                    |
| `npm run build`         | Production build                                 |
| `npm start`             | Run production server                            |
| `npm run check`         | TypeScript type check                            |
| `npm test`              | Run all tests                                    |
| `npm run test:coverage` | Tests with coverage report                       |
| `npm run lint`          | ESLint                                           |
| `npm run format`        | Prettier                                         |
| `npm run db:push`       | Push Drizzle schema to database                  |
| `npm run create-admin`  | Create an admin user                             |
| `npm run feature:new`   | Scaffold a new feature (spec + registry + tests) |
| `npm run feature:check` | Validate spec/feature-map consistency            |

## Project Structure

```
AGENTS.md           Agent constitution — START HERE (governance, rules, safety)
agent/              AI-first reference docs (READ AFTER AGENTS.md)
  INDEX.yaml        Compact feature registry — load first to route a task
  FEATURE_MAP.md    Deep per-feature docs: APIs, deps, tech debt (15 features)
  AGENT_GUIDE.md    Operating checklist for AI agents
  architecture/     System topology & module mapping
  features/         Per-feature narrative docs (what each feature IS)
  specs/            Change specs — work orders, one per change (what WILL CHANGE)
client/             React frontend (Vite + Tailwind + shadcn/ui)
server/             Express.js backend
  auth/             JWT auth, CSRF, session management
  api/              Admin routes
  services/         Business logic (auth-service, user-service)
  middleware/       Rate limiting, error handling, logging
  monitoring/       Health & observability
shared/             Shared types & Zod schemas
tests/              Unit, integration, and e2e tests
data/               Local JSON file storage (dev mode)
```

## Environment Variables

Copy `.env.example` and set these for production:

| Variable             | Purpose                                 |
| -------------------- | --------------------------------------- |
| `NODE_ENV`           | `production`                            |
| `JWT_ACCESS_SECRET`  | Access token signing key                |
| `JWT_REFRESH_SECRET` | Refresh token signing key               |
| `SESSION_SECRET`     | CSRF hash secret                        |
| `DATABASE_URL`       | PostgreSQL connection string (optional) |

## API Overview

**Auth** — `POST /api/auth/register`, `login`, `logout`, `logout-all`, `refresh`, `GET /api/auth/me`, password reset endpoints.

**Profile** — `GET/PUT /api/profile`, `PUT /api/profile/preferences`, `POST /api/profile/upload-picture`, `DELETE /api/profile`.

**Admin** — `GET/POST /api/admin/users`, `GET/PATCH/DELETE /api/admin/users/:id`, `PATCH .../role`, `GET /api/admin/stats`, `GET /api/admin/audit-log`.

## Security

- Helmet (CSP, HSTS, security headers)
- CSRF tokens on all state-changing requests
- Rate limiting (general + strict auth limiter)
- Append-only JSONL audit log
- bcrypt password hashing (cost 12)
- Account lockout after 10 failed attempts

## Docker

```bash
docker build -t devnest .
docker run --env-file .env -p 5000:5000 devnest
```

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React Query, Framer Motion, Wouter, React Hook Form + Zod

**Backend:** Node.js, Express 5, TypeScript, Winston, JWT, Drizzle ORM, PostgreSQL, Zod

**Tooling:** Vitest, ESLint, Prettier, Husky, Docker

## Contributing

This project follows **specification-driven development** — no code without an approved spec.
The full workflow, safety levels, and boundaries live in [`/agent/`](agent/README.md);
start there. In short: create a spec under `/agent/specs/`, get it approved, implement,
keep tests passing (`npm run test:ci`, >70% coverage), then open a PR linking your spec.

See [CONTRIBUTING.md](CONTRIBUTING.md) for repository mechanics (branching, commit style).

---

## License

[Apache License 2.0](LICENSE)
