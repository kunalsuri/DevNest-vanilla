# Getting Started

## Prerequisites

- **Node.js 20+** and **npm 10+**
- PostgreSQL is **optional** — file-based JSON storage works out of the box (data is written
  to the `data/` directory in development).

## Install and run

```bash
git clone https://github.com/kunalsuri/DevNest-vanilla.git
cd DevNest-vanilla
npm install
cp .env.example .env    # edit secrets before any non-local use
npm run dev             # http://localhost:5000
```

The dev server runs the Express API and the Vite-powered React client together on port 5000
(override with `PORT`). See [Configuration](configuration.md) for all environment variables.

## Create an admin user

```bash
npm run create-admin
```

Follow the prompts to set the admin email and password. You can then sign in at
`http://localhost:5000` and reach the admin dashboard.

## Verify the install

- App UI: `http://localhost:5000`
- API docs (non-production): `http://localhost:5000/api-docs`
- Health check: `http://localhost:5000/health`

## Useful scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server (hot reload) |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run check` | TypeScript type check |
| `npm test` | Run tests |
| `npm run create-admin` | Create an admin user |
| `npm run db:push` | Push Drizzle schema to PostgreSQL |

## Next steps

- [Configuration](configuration.md) — set secrets and tune security/logging
- [Deployment](deployment.md) — run in Docker / production
- [API Reference](../api/README.md) — integrate with the REST API
