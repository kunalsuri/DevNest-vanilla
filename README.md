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

**New to this codebase?** This is a **SaaS template** built with specification-driven development and AI-first documentation.

### For Human Developers

**Adding new features?**
1. Read [`/ai-meta/README.md`](ai-meta/README.md) — Start with the 🚦 **Start Here** section
2. Follow the **Comprehensive Reading Order** (steps 1-4 are mandatory)
3. Review [`/ai-meta/FEATURE_MAP.md`](ai-meta/FEATURE_MAP.md) to understand existing features
4. Create a spec in `/ai-meta/specs/` before writing code (required)
5. Follow the specification-driven development workflow

**Quick reference:**
- **Feature registry:** [`/ai-meta/FEATURE_MAP.md`](ai-meta/FEATURE_MAP.md) — All 15 features documented
- **Architecture:** [`/ai-meta/architecture/OVERVIEW.md`](ai-meta/architecture/OVERVIEW.md) — System topology
- **Module map:** [`/ai-meta/architecture/MODULE_MAP.md`](ai-meta/architecture/MODULE_MAP.md) — File locations
- **Change policy:** [`/ai-meta/CHANGE_POLICY.md`](ai-meta/CHANGE_POLICY.md) — What you can modify

### For AI Agents

**📝 Start here:**

> Go to [`/ai-meta/README.md`](ai-meta/README.md) and start with the **🚦 Start Here** section. If this is your first time, follow the **Comprehensive Reading Order** (steps 1-4 are mandatory). Complete the checkpoint at the end to verify you're ready.

**Key guidelines:**
- ✅ Always consult [`/ai-meta/FEATURE_MAP.md`](ai-meta/FEATURE_MAP.md) before making changes
- ✅ Read [`/ai-meta/AGENT_GUIDE.md`](ai-meta/AGENT_GUIDE.md) for operating instructions
- ✅ Follow [`/ai-meta/SDD_CONTROL.md`](ai-meta/SDD_CONTROL.md) — No code without approved specs
- ✅ Check [`/ai-meta/CHANGE_POLICY.md`](ai-meta/CHANGE_POLICY.md) for safety boundaries

**Onboarding time:** ~30 minutes for comprehensive understanding

---

## Scripts

| Command                 | Description                     |
| ----------------------- | ------------------------------- |
| `npm run dev`           | Start dev server (hot reload)   |
| `npm run build`         | Production build                |
| `npm start`             | Run production server           |
| `npm run check`         | TypeScript type check           |
| `npm test`              | Run all tests                   |
| `npm run test:coverage` | Tests with coverage report      |
| `npm run lint`          | ESLint                          |
| `npm run format`        | Prettier                        |
| `npm run db:push`       | Push Drizzle schema to database |
| `npm run create-admin`  | Create an admin user            |

## Project Structure

```
ai-meta/             AI-first documentation & specs (READ THIS FIRST!)
  FEATURE_MAP.md    Comprehensive feature registry (15 features)
  AGENT_GUIDE.md    Operating instructions for AI agents
  architecture/     System topology & module mapping
  features/         Feature documentation with safety levels
  specs/            Feature specifications (spec-driven development)
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

We welcome contributions! This project follows **specification-driven development** (SDD).

### Development Workflow

1. **Understand the codebase**
   - Start with [`/ai-meta/README.md`](ai-meta/README.md)
   - Review [`/ai-meta/FEATURE_MAP.md`](ai-meta/FEATURE_MAP.md) for existing features
   - Check [`/ai-meta/architecture/OVERVIEW.md`](ai-meta/architecture/OVERVIEW.md) for system design

2. **Plan your changes**
   - Create a spec in `/ai-meta/specs/<feature-name>/spec.md`
   - Use `/ai-meta/specs/TEMPLATE.md` as a starting point
   - Get spec reviewed and approved before coding

3. **Implement**
   - Follow the spec exactly
   - Update [`/ai-meta/FEATURE_MAP.md`](ai-meta/FEATURE_MAP.md) if adding/modifying features
   - Write tests (unit + integration)
   - Ensure all tests pass: `npm test`

4. **Submit**
   - Fork the repository
   - Create a feature branch: `git checkout -b feature/your-feature-name`
   - Commit with clear messages
   - Open a pull request
   - Link to your spec in the PR description

### Guidelines

- **No code without specs** — See [`/ai-meta/SDD_CONTROL.md`](ai-meta/SDD_CONTROL.md)
- **Follow safety levels** — Check [`/ai-meta/FEATURE_MAP.md`](ai-meta/FEATURE_MAP.md) for feature risk levels
- **Respect boundaries** — Read [`/ai-meta/CHANGE_POLICY.md`](ai-meta/CHANGE_POLICY.md)
- **Maintain documentation** — Update feature map when adding features
- **Test coverage** — Maintain >80% coverage

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## License

[Apache License 2.0](LICENSE)
