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
client/             React frontend (Vite + Tailwind + shadcn/ui)
server/             Express.js backend
  auth/             JWT auth, CSRF, session management
  api/              Admin routes
  services/         Business logic (auth-service, user-service)
  middleware/        Rate limiting, error handling, logging
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

See [CONTRIBUTING.md](CONTRIBUTING.md). Fork, branch, PR.

## License

[Apache License 2.0](LICENSE)
