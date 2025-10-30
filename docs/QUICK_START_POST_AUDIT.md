# 🚀 Quick Start Guide - Post-Audit Actions

## Priority Actions (Do First!)

### 🔴 CRITICAL - Fix Security Vulnerabilities

```bash
cd /Users/ks248120/Documents/GitHub/DevNest-vanilla

# Update vulnerable packages
npm update esbuild vite @vitejs/plugin-react
npm update drizzle-kit
npm audit fix

# Verify no high/critical vulnerabilities remain
npm audit --audit-level=moderate
```

### 🔴 CRITICAL - Database Migration

1. **Set up PostgreSQL**

   ```bash
   # Local development
   docker run --name devnest-db -e POSTGRES_PASSWORD=devpass -p 5432:5432 -d postgres:16

   # Or use cloud provider
   # - Neon.tech (recommended for dev)
   # - Supabase
   # - Railway
   ```

2. **Update .env**

   ```env
   DATABASE_URL=postgresql://postgres:devpass@localhost:5432/devnest
   ```

3. **Run migrations**

   ```bash
   npm run db:push
   ```

4. **Replace FileStorage with PostgresStorage**
   - Update `server/storage.ts`
   - Use Drizzle ORM queries
   - Test all endpoints

---

## 🟡 HIGH PRIORITY - Week 1

### Add Docker Support

**Create `Dockerfile`:**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

**Create `docker-compose.yml`:**

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:devpass@db:5432/devnest
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: devnest
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

**Test:**

```bash
docker-compose up --build
```

### Enable Production Monitoring

1. **Get Sentry DSN** from https://sentry.io
2. **Update `.env.production`:**

   ```env
   SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/7890123
   VITE_SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/7890123
   ```

3. **Test error tracking:**
   ```bash
   # Trigger test error
   curl http://localhost:5000/api/test-error
   # Check Sentry dashboard
   ```

---

## 🟢 MEDIUM PRIORITY - Week 2-3

### Add E2E Testing

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install

# Create test file: __tests__/e2e/auth.spec.ts
```

**Example E2E test:**

```typescript
import { test, expect } from "@playwright/test";

test("user can register and login", async ({ page }) => {
  await page.goto("http://localhost:5000/auth");

  // Register
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "Test123!@#");
  await page.click('button[type="submit"]');

  // Verify dashboard
  await expect(page).toHaveURL(/.*dashboard/);
});
```

**Add script to `package.json`:**

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### Upgrade Major Dependencies

```bash
# Vite 7 (major)
npm install -D vite@latest @vitejs/plugin-react@latest

# Tailwind 4 (major - breaking changes)
npm install -D tailwindcss@latest

# React 19 (when stable - wait for ecosystem)
# npm install react@latest react-dom@latest

# Test after each upgrade
npm run build
npm test
```

---

## 📝 Configuration Improvements

### Strengthen Password Policy

**Update `server/middleware/validation.ts`:**

```typescript
body("password")
  .isLength({ min: 12, max: 128 }) // Changed from 6 to 12
  .withMessage("Password must be at least 12 characters")
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
  .withMessage(
    "Password must contain uppercase, lowercase, number, and special character",
  );
```

### Add Rate Limiting Per User

**Update `server/index.ts`:**

```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  keyGenerator: (req) => {
    // Rate limit by userId if authenticated, else by IP
    return req.jwtUser?.userId || req.ip || 'unknown';
  },
  message: 'Too many login attempts, please try again later.',
});

app.post('/api/auth/login', authLimiter, ...);
```

### Add Health Check Monitoring

**Sign up for uptime monitoring:**

- UptimeRobot (free)
- BetterUptime ($20/mo)
- Pingdom

**Monitor endpoints:**

- `https://yourdomain.com/health`
- `https://yourdomain.com/health/ready`

---

## 🔧 Development Workflow Improvements

### Add Pre-push Hook

**Update `.husky/pre-push` (create if missing):**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run tests before push
npm run test:ci
```

### Add Commit Message Linting

```bash
npm install -D @commitlint/cli @commitlint/config-conventional

# Create commitlint.config.js
echo "module.exports = { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js

# Add hook
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit $1'
```

**Commit format:**

```
feat: add user profile editing
fix: resolve JWT expiration bug
docs: update API documentation
test: add E2E tests for auth flow
```

---

## 📊 Monitoring Dashboard Setup

### Option 1: Free Stack

**Grafana Cloud (Free Tier):**

1. Sign up at grafana.com
2. Install agent:
   ```bash
   npm install prom-client
   ```
3. Export metrics from Express
4. View dashboards in Grafana

### Option 2: All-in-One

**BetterStack (Recommended):**

- Logs: $20/mo
- Uptime: $20/mo
- Incident management included
- Simple setup, great UX

### Option 3: Self-Hosted

**Docker Compose Stack:**

```yaml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"

  loki:
    image: grafana/loki
    ports:
      - "3100:3100"
```

---

## 🎯 Performance Optimization Checklist

- [ ] Enable Vite build compression
- [ ] Add Redis for session storage
- [ ] Implement response caching (Cache-Control headers)
- [ ] Use CDN for static assets
- [ ] Enable HTTP/2
- [ ] Lazy load heavy components
- [ ] Use React.memo for expensive renders
- [ ] Add database indexes
- [ ] Enable PostgreSQL connection pooling
- [ ] Monitor bundle size (keep < 200KB gzipped)

---

## 📚 Helpful Commands

```bash
# Development
npm run dev              # Start dev server
npm run check            # TypeScript check
npm run lint             # ESLint
npm run format           # Prettier

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:ui          # Vitest UI
npm run test:coverage    # Coverage report
npm run test:e2e         # E2E tests

# Production
npm run build            # Build for production
npm start                # Start production server
npm run validate         # Full validation

# Database
npm run db:push          # Push schema changes
npm run create-admin     # Create admin user

# Docker
docker-compose up        # Start all services
docker-compose down      # Stop all services
docker-compose logs -f   # View logs
```

---

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

### Build Errors After Update

```bash
# Clean cache
rm -rf node_modules dist .vite
npm install
npm run build
```

### Tests Failing

```bash
# Update snapshots
npm test -- -u

# Run specific test
npm test -- auth.test.ts

# Debug mode
npm test -- --inspect-brk
```

---

## 📞 Support Resources

- **Full Audit Report:** `docs/TECHNICAL_AUDIT_REPORT.md`
- **Summary:** `docs/AUDIT_SUMMARY.md`
- **Project README:** `README.md`

**Need help?** Review the audit report for detailed explanations and best practices.

---

**Last Updated:** October 29, 2025  
**Next Review:** Review progress after implementing Week 1 priorities
