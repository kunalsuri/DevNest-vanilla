# Configuration

DevNest is configured entirely through environment variables. Copy `.env.example` to `.env`
and adjust. **Change every secret before deploying outside your local machine.**

## Server

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | Set to `production` for production builds |
| `PORT` | `5000` | HTTP port for the combined API + client server |

## Database (optional)

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | _(unset)_ | PostgreSQL connection string. If unset, DevNest uses file-based JSON storage in `data/`. |

When using PostgreSQL, run `npm run db:push` to apply the Drizzle schema.

## Authentication & sessions

| Variable | Purpose |
| --- | --- |
| `JWT_ACCESS_SECRET` | Access-token signing key (**min 32 chars**) |
| `JWT_REFRESH_SECRET` | Refresh-token signing key (**min 32 chars**) |
| `SESSION_SECRET` | CSRF hash secret (**min 32 chars**) |

## Security

| Variable | Default | Purpose |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | `http://localhost:5000,http://localhost:3000,http://127.0.0.1:5000` | Comma-separated CORS allow-list |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate-limit window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |

## Logging

| Variable | Default | Purpose |
| --- | --- | --- |
| `LOG_LEVEL` | `debug` (dev) / `info` (prod) | Server log level: `debug`, `info`, `warn`, `error`, `fatal` |
| `VITE_LOG_LEVEL` | `debug` (dev) / `warn` (prod) | Client log level |

## Monitoring (Sentry)

| Variable | Purpose |
| --- | --- |
| `SENTRY_DSN` | Server-side Sentry DSN (get one at https://sentry.io) |
| `VITE_SENTRY_DSN` | Client-side Sentry DSN |

## Production checklist

- [ ] `NODE_ENV=production`
- [ ] All three secrets replaced with strong, unique 32+ char values
- [ ] `ALLOWED_ORIGINS` restricted to your real domains
- [ ] `DATABASE_URL` set (recommended for scale) and `npm run db:push` run
- [ ] `SENTRY_DSN` configured if you want error monitoring
