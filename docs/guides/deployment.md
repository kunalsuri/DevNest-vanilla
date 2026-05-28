# Deployment

## Docker

```bash
docker build -t devnest .
docker run --env-file .env -p 5000:5000 devnest
```

The image runs the production server (`npm start`). Provide configuration via `--env-file`
(see [Configuration](configuration.md)). A Docker Compose file is included for local
orchestration:

```bash
docker compose up --build
```

Compose uses the `/health` endpoint as its health check.

## Production build (without Docker)

```bash
npm ci
npm run build
NODE_ENV=production npm start
```

## Before going live

- Set `NODE_ENV=production` and replace all secrets (`JWT_ACCESS_SECRET`,
  `JWT_REFRESH_SECRET`, `SESSION_SECRET`).
- Restrict `ALLOWED_ORIGINS` to your real domains.
- The interactive Swagger UI at `/api-docs` is **disabled in production** by design.
- For persistence at scale, configure `DATABASE_URL` (PostgreSQL) and run `npm run db:push`.
  File-based storage in `data/` is intended for development and small deployments.

## Health & readiness

| Endpoint | Use |
| --- | --- |
| `GET /health` | Liveness probe |
| `GET /health/ready` | Readiness probe |

Neither requires authentication.
