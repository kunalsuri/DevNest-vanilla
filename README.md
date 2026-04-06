# DevNest

Full-stack web app — React 19 + Express 5 + TypeScript. JWT auth, user management, admin dashboard, observability, dark mode.

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
