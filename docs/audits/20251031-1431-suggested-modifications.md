# Suggested Modifications — 2025-10-31 14:31 UTC

This document contains detailed code modifications and implementation steps to remediate the security findings identified in the audit report (`20251031-1431-audit-report.md`).

**Status:** Pending Approval  
**Priority:** HIGH — Critical vulnerabilities require immediate attention

---

## Table of Contents

1. [F-001: Exposed Refresh Token Hashes](#f-001-exposed-refresh-token-hashes)
2. [F-002: Hard-coded Password Hashes](#f-002-hard-coded-password-hashes)
3. [F-003: Path Traversal Vulnerabilities](#f-003-path-traversal-vulnerabilities)
4. [F-004: Unsafe Format String Injection](#f-004-unsafe-format-string-injection)
5. [F-005: Missing Input Sanitization](#f-005-missing-input-sanitization)
6. [F-006: Default JWT Secrets](#f-006-default-jwt-secrets)
7. [F-007: Session Tokens in Plain JSON](#f-007-session-tokens-in-plain-json)
8. [F-008: Weak Test Passwords](#f-008-weak-test-passwords)
9. [F-009: No Rate Limiting](#f-009-no-rate-limiting)
10. [F-010: Insufficient CSRF Protection](#f-010-insufficient-csrf-protection)

---

## F-001: Exposed Refresh Token Hashes

### Problem

Refresh token hashes and session data are exposed in git history via `data/sessions.json`. 24 secrets detected by Gitleaks.

### Proposed Fix

#### Step 1: Immediate Session Invalidation

**File:** `server/auth/session-manager.ts`

**Add method:**

```typescript
/**
 * Emergency: Revoke all sessions
 */
async revokeAllSessions(): Promise<void> {
  logger.warn("⚠️ EMERGENCY: Revoking all active sessions");

  this.sessions.forEach(session => {
    session.revokedAt = new Date();
  });

  await this.saveSessions();
  logger.info(`Revoked ${this.sessions.size} sessions`);
}
```

**Create emergency script:**

**File:** `scripts/emergency-revoke-sessions.ts`

```typescript
import { sessionManager } from "../server/auth/session-manager";
import logger from "../server/logger";

async function emergencyRevoke() {
  console.log("🚨 EMERGENCY SESSION REVOCATION");
  console.log("This will invalidate ALL active sessions.");
  console.log("Users will need to log in again.");

  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question(
    "Type 'REVOKE ALL' to confirm: ",
    async (answer: string) => {
      if (answer === "REVOKE ALL") {
        await sessionManager.ready();
        await sessionManager.revokeAllSessions();
        console.log("✅ All sessions revoked successfully");
      } else {
        console.log("❌ Revocation cancelled");
      }
      readline.close();
      process.exit(0);
    },
  );
}

emergencyRevoke();
```

**Run command:**

```bash
tsx scripts/emergency-revoke-sessions.ts
```

#### Step 2: Remove Sensitive Files from Git History

**Commands:**

```bash
# Install BFG Repo-Cleaner
brew install bfg

# Backup repository first
cp -r . ../DevNest-vanilla-backup

# Remove sensitive files
bfg --delete-files sessions.json
bfg --delete-files users.json
bfg --delete-files password_reset_tokens.json
bfg --delete-files preferences.json

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (CAUTION: coordinate with team)
git push origin --force --all
git push origin --force --tags
```

#### Step 3: Update .gitignore

**File:** `.gitignore`

**Add:**

```gitignore
# Sensitive data files
data/sessions.json
data/users.json
data/password_reset_tokens.json
data/preferences.json

# Environment files
.env
.env.local
.env.*.local
.env.production

# Logs
logs/
*.log

# Secrets
secrets/
*.pem
*.key
*.crt
```

#### Step 4: Add Gitleaks Pre-commit Hook

**File:** `.husky/pre-commit`

**Update:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run Gitleaks to detect secrets
echo "🔍 Scanning for secrets with Gitleaks..."
gitleaks protect --staged --verbose

if [ $? -ne 0 ]; then
  echo "❌ Gitleaks detected secrets in your commit!"
  echo "Please remove sensitive data before committing."
  exit 1
fi

echo "✅ No secrets detected"
```

**Make executable:**

```bash
chmod +x .husky/pre-commit
```

#### Step 5: Generate New JWT Secrets

**Commands:**

```bash
# Generate new secrets
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

**File:** `.env.local` (create if doesn't exist)

```env
# CRITICAL: Never commit this file to git
JWT_ACCESS_SECRET=<paste generated value>
JWT_REFRESH_SECRET=<paste generated value>
SESSION_SECRET=<paste generated value>
```

### Validation Test

```bash
# Test that secrets are not in git
git log --all --full-history -- data/sessions.json

# Should return empty or "removed" commits only

# Test Gitleaks passes
gitleaks detect --verbose

# Should return: "✅ No secrets detected"

# Test pre-commit hook
echo "test_secret_key=abc123" > test.txt
git add test.txt
git commit -m "test"

# Should fail with Gitleaks error
```

### Approval Required

**Yes** — Security Lead must approve before execution

---

## F-002: Hard-coded Password Hashes

### Problem

Password hashes stored in `data/users.json` exposed in version control. 3+ bcrypt hashes detected plus plaintext passwords.

### Proposed Fix

#### Step 1: Set Up PostgreSQL Database

**Create database:**

```bash
# Using Docker
docker run --name devnest-postgres \
  -e POSTGRES_PASSWORD=<secure-password> \
  -e POSTGRES_DB=devnest \
  -p 5432:5432 \
  -d postgres:16-alpine

# Or install locally
brew install postgresql@16
brew services start postgresql@16
createdb devnest
```

**Update `.env.local`:**

```env
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/devnest?sslmode=prefer
```

#### Step 2: Initialize Database Schema

**File:** `drizzle.config.ts` (already exists)

**Run migration:**

```bash
npm run db:push
```

**Verify:**

```bash
psql -d devnest -c "\dt"
# Should show: users, sessions, password_reset_tokens, preferences tables
```

#### Step 3: Create Database Storage Adapter

**File:** `server/storage-db.ts` (new file)

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env";
import { IStorage } from "./storage";
import { users, sessions, passwordResetTokens, preferences } from "./db/schema";
import { eq } from "drizzle-orm";
import type { User, InsertUser, AccountPreferences } from "@shared/schema";
import logger from "./logger";

export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    const client = postgres(env.DATABASE_URL!);
    this.db = drizzle(client);
  }

  async ready(): Promise<void> {
    // Test connection
    try {
      await this.db.select().from(users).limit(1);
      logger.info("Database connection established");
    } catch (error) {
      logger.error("Database connection failed", { error });
      throw error;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await this.db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(
    id: string,
    updates: Partial<User>,
  ): Promise<User | undefined> {
    const [updated] = await this.db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    await this.db.update(users).set({ password }).where(eq(users.id, id));
  }

  // Implement remaining IStorage methods...
  // (preferences, password reset tokens, etc.)
}
```

#### Step 4: Create Migration Script

**File:** `scripts/migrate-to-database.ts`

```typescript
import { FileStorage } from "../server/storage";
import { DatabaseStorage } from "../server/storage-db";
import { hashPassword } from "../server/auth/jwt-utils";
import logger from "../server/logger";

async function migrate() {
  logger.info("🚀 Starting migration from files to database");

  const fileStorage = new FileStorage();
  const dbStorage = new DatabaseStorage();

  await fileStorage.ready();
  await dbStorage.ready();

  // Migrate users
  logger.info("Migrating users...");
  const users = await fileStorage.getAllUsers(); // You'll need to implement this

  for (const user of users) {
    // Re-hash passwords for security
    const newPassword = await hashPassword(user.password);

    await dbStorage.createUser({
      ...user,
      password: newPassword,
    });

    logger.info(`Migrated user: ${user.username}`);
  }

  logger.info("✅ Migration complete");
}

migrate().catch(console.error);
```

**Run:**

```bash
tsx scripts/migrate-to-database.ts
```

#### Step 5: Update Application to Use Database

**File:** `server/index.ts`

**Replace:**

```typescript
import { FileStorage } from "./storage";
export const storage = new FileStorage();
```

**With:**

```typescript
import { DatabaseStorage } from "./storage-db";
export const storage = new DatabaseStorage();
```

#### Step 6: Force Password Reset

**File:** `scripts/force-password-reset.ts`

```typescript
import { storage } from "../server/index";
import logger from "../server/logger";

async function forcePasswordReset() {
  await storage.ready();

  // Add 'needsPasswordReset' flag to all users
  const users = await storage.getAllUsers();

  for (const user of users) {
    await storage.updateUser(user.id, {
      needsPasswordReset: true,
    });
  }

  logger.info(`Flagged ${users.length} users for password reset`);
}

forcePasswordReset();
```

#### Step 7: Remove JSON Files

**After migration is verified:**

```bash
# Backup first
mkdir -p backups
cp data/*.json backups/

# Remove from filesystem
rm data/users.json
rm data/sessions.json
rm data/preferences.json
rm data/password_reset_tokens.json
```

### Validation Test

```bash
# Test database connection
psql -d devnest -c "SELECT COUNT(*) FROM users;"

# Should return user count

# Test application
npm run dev

# Try logging in — should work with new database backend

# Verify files are removed from git
git log --all -- data/users.json
# Should show removal commit
```

### Approval Required

**Yes** — Database migration requires approval and backup verification

---

## F-003: Path Traversal Vulnerabilities

### Problem

15 instances of unsanitized user input passed to `path.join()` in `client/src/lib/file-transport.ts`.

### Proposed Fix

#### Step 1: Create Path Sanitization Utility

**File:** `shared/path-sanitizer.ts` (new file)

```typescript
import path from "node:path";

/**
 * Sanitize a file path to prevent directory traversal attacks
 *
 * @param basePath - The base directory that files must stay within
 * @param userPath - User-provided path component
 * @returns Sanitized absolute path
 * @throws Error if path traversal is detected
 */
export function sanitizePath(basePath: string, userPath: string): string {
  // Remove null bytes (can cause issues in C-based file systems)
  const cleaned = userPath.replace(/\0/g, "");

  // Resolve to absolute path
  const resolved = path.resolve(basePath, cleaned);
  const baseResolved = path.resolve(basePath);

  // Ensure resolved path is within base directory
  if (
    !resolved.startsWith(baseResolved + path.sep) &&
    resolved !== baseResolved
  ) {
    throw new Error(`Path traversal detected: ${userPath}`);
  }

  return resolved;
}

/**
 * Sanitize a filename to remove directory traversal sequences
 *
 * @param filename - User-provided filename
 * @returns Sanitized filename (no path separators)
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, "") // Remove ..
    .replace(/[/\\]/g, "") // Remove path separators
    .replace(/[\x00-\x1f\x80-\x9f]/g, "") // Remove control characters
    .replace(/^\.+/, "") // Remove leading dots
    .trim();
}

/**
 * Validate that a path component is in an allowlist
 *
 * @param value - The value to validate
 * @param allowlist - Array of allowed values
 * @throws Error if value not in allowlist
 */
export function validateAllowlist(value: string, allowlist: string[]): void {
  if (!allowlist.includes(value)) {
    throw new Error(
      `Invalid value: ${value}. Must be one of: ${allowlist.join(", ")}`,
    );
  }
}
```

#### Step 2: Update File Transport

**File:** `client/src/lib/file-transport.ts`

**Import at top:**

```typescript
import {
  sanitizePath,
  sanitizeFilename,
  validateAllowlist,
} from "@shared/path-sanitizer";
```

**Update `getFileName` method (around line 105):**

```typescript
private getFileName(entry: LogEntry): string {
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const baseDir = path.resolve(this.config.logDirectory);

  // Sanitize log level
  const levelName = LogLevel[entry.level].toLowerCase();
  const ALLOWED_LOG_LEVELS = ["debug", "info", "warn", "error", "fatal"];
  validateAllowlist(levelName, ALLOWED_LOG_LEVELS);
  const sanitizedLevel = sanitizeFilename(levelName);

  if (this.config.separateByLevel) {
    const filename = this.config.rotateDaily
      ? `${sanitizedLevel}-${date}.log`
      : `${sanitizedLevel}.log`;
    return sanitizePath(baseDir, filename);
  } else {
    const filename = this.config.rotateDaily
      ? `application-${date}.log`
      : `application.log`;
    return sanitizePath(baseDir, filename);
  }
}
```

**Update `writeToFile` method (around line 170):**

```typescript
private async writeToFile(fileName: string, logLine: string): Promise<void> {
  if (typeof window !== "undefined") {
    await this.writeToBrowserStorage(fileName, logLine);
    return;
  }

  try {
    const fs = await import("node:fs/promises");

    // Validate fileName is within log directory
    const baseDir = path.resolve(this.config.logDirectory);
    const sanitized = sanitizePath(baseDir, fileName);

    // Ensure directory exists
    const dir = path.dirname(sanitized);
    await fs.mkdir(dir, { recursive: true });

    // Append to file
    await fs.appendFile(sanitized, logLine, "utf-8");
  } catch (error) {
    console.error("[FileTransport] Failed to write log:", error);
  }
}
```

**Update other path operations (lines 213, 220-221, 232, 241, 296, 342, 382):**

Follow same pattern:

1. Extract user-controlled variable
2. Sanitize with `sanitizeFilename()`
3. Validate with `validateAllowlist()` if applicable
4. Use `sanitizePath()` for final path construction

#### Step 3: Add Unit Tests

**File:** `tests/unit/shared/path-sanitizer.test.ts` (new file)

```typescript
import { describe, it, expect } from "vitest";
import {
  sanitizePath,
  sanitizeFilename,
  validateAllowlist,
} from "@shared/path-sanitizer";
import path from "node:path";

describe("sanitizePath", () => {
  const baseDir = "/var/logs";

  it("should allow valid relative paths", () => {
    const result = sanitizePath(baseDir, "app.log");
    expect(result).toBe(path.join(baseDir, "app.log"));
  });

  it("should prevent directory traversal with ../", () => {
    expect(() => sanitizePath(baseDir, "../../../etc/passwd")).toThrow(
      "Path traversal detected",
    );
  });

  it("should prevent absolute paths outside base", () => {
    expect(() => sanitizePath(baseDir, "/etc/passwd")).toThrow(
      "Path traversal detected",
    );
  });

  it("should remove null bytes", () => {
    const result = sanitizePath(baseDir, "app\0.log");
    expect(result).toBe(path.join(baseDir, "app.log"));
  });

  it("should allow subdirectories within base", () => {
    const result = sanitizePath(baseDir, "2025/10/app.log");
    expect(result).toBe(path.join(baseDir, "2025/10/app.log"));
  });
});

describe("sanitizeFilename", () => {
  it("should remove path separators", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("etcpasswd");
  });

  it("should remove control characters", () => {
    expect(sanitizeFilename("app\x00\x1f.log")).toBe("app.log");
  });

  it("should remove leading dots", () => {
    expect(sanitizeFilename("...hidden")).toBe("hidden");
  });

  it("should preserve valid filenames", () => {
    expect(sanitizeFilename("app-2025-10-31.log")).toBe("app-2025-10-31.log");
  });
});

describe("validateAllowlist", () => {
  const allowlist = ["debug", "info", "warn", "error"];

  it("should pass for valid values", () => {
    expect(() => validateAllowlist("debug", allowlist)).not.toThrow();
  });

  it("should throw for invalid values", () => {
    expect(() => validateAllowlist("invalid", allowlist)).toThrow(
      "Invalid value: invalid",
    );
  });

  it("should be case-sensitive", () => {
    expect(() => validateAllowlist("DEBUG", allowlist)).toThrow(
      "Invalid value: DEBUG",
    );
  });
});
```

**Run tests:**

```bash
npm test -- path-sanitizer.test.ts
```

### Validation Test

```bash
# Run Semgrep again
semgrep --config auto client/src/lib/file-transport.ts

# Should return 0 path traversal warnings

# Run unit tests
npm test

# All tests should pass

# Manual test
npm run dev
# Trigger logging — verify logs are written correctly
```

### Approval Required

**Yes** — Code changes require review

---

## F-004: Unsafe Format String Injection

### Problem

12 instances of string concatenation in logging functions across multiple files.

### Proposed Fix

#### Step 1: Update Logger to Use Structured Format

**File:** `client/src/lib/logger.ts`

**Replace methods (lines 115-131):**

```typescript
// Before:
debug(...args: any[]): void {
  console.debug(...args);
}

// After:
debug(message: string, metadata?: Record<string, unknown>): void {
  this.log(LogLevel.DEBUG, message, metadata);
}

info(message: string, metadata?: Record<string, unknown>): void {
  this.log(LogLevel.INFO, message, metadata);
}

warn(message: string, metadata?: Record<string, unknown>): void {
  this.log(LogLevel.WARN, message, metadata);
}

error(message: string, metadata?: Record<string, unknown>): void {
  this.log(LogLevel.ERROR, message, metadata);
}

fatal(message: string, metadata?: Record<string, unknown>): void {
  this.log(LogLevel.FATAL, message, metadata);
}
```

#### Step 2: Update Error Logger

**File:** `client/src/lib/error-logger.ts`

**Replace line 91:**

```typescript
// Before:
console.error(`[ErrorLogger] ${error.message}`, metadata);

// After:
logger.error("Error occurred", {
  errorMessage: error.message,
  ...metadata,
});
```

#### Step 3: Update File Transport

**File:** `client/src/lib/file-transport.ts`

**Replace lines 252, 398:**

```typescript
// Before:
console.error(`[FileTransport] ${error.message}`);

// After:
logger.error("FileTransport error", {
  error: error.message,
  operation: "writeToFile",
});
```

#### Step 4: Update Script

**File:** `scripts/add-license-headers.js`

**Replace line 48:**

```typescript
// Before:
console.log(`Processing: ${filePath}`);

// After:
console.log("Processing file:", { filePath });
```

### Validation Test

```bash
# Run Semgrep
semgrep --config auto --json | grep "unsafe-formatstring"

# Should return 0 results

# Test logging
npm run dev
# Trigger errors — verify logs are formatted correctly
```

### Approval Required

**No** — Low risk refactoring

---

## F-005: Missing Input Sanitization

### Problem

User input not sanitized before storage, risking XSS and SQL injection.

### Proposed Fix

#### Step 1: Install DOMPurify

```bash
npm install isomorphic-dompurify
npm install --save-dev @types/dompurify
```

#### Step 2: Create Sanitization Middleware

**File:** `server/middleware/sanitize.ts` (new file)

```typescript
import DOMPurify from "isomorphic-dompurify";
import { Request, Response, NextFunction } from "express";

/**
 * Sanitize a string to remove XSS vectors
 */
export function sanitizeString(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Recursively sanitize an object's string values
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj !== null && typeof obj === "object") {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Express middleware to sanitize request body
 */
export function sanitizeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
}
```

#### Step 3: Apply Middleware

**File:** `server/index.ts`

**Add after body parser:**

```typescript
import { sanitizeMiddleware } from "./middleware/sanitize";

app.use(express.json());
app.use(sanitizeMiddleware);
```

#### Step 4: Add Content Security Policy

**File:** `server/index.ts`

**Add after other middleware:**

```typescript
import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Remove unsafe-inline in production
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);
```

### Validation Test

```bash
# Test XSS prevention
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"<script>alert(1)</script>","email":"test@test.com"}'

# Check database — should have sanitized username (no <script>)

# Run OWASP ZAP scan
# Install: brew install --cask owasp-zap
zap-cli quick-scan --self-contained http://localhost:5000
```

### Approval Required

**Yes** — Security middleware changes

---

## F-006: Default JWT Secrets

### Problem

Development mode uses weak default JWT secrets that may be deployed to production.

### Proposed Fix

#### Step 1: Update Environment Schema

**File:** `server/env.ts`

**Replace JWT secret validation (lines 42-48):**

```typescript
JWT_ACCESS_SECRET: z
  .string()
  .min(32, "JWT_ACCESS_SECRET must be at least 32 characters")
  .refine(
    (val) => {
      if (process.env.NODE_ENV === "production") {
        const insecureDefaults = [
          "dev-access-secret",
          "dev-refresh-secret",
          "change-in-production",
        ];
        const isInsecure = insecureDefaults.some((d) => val.toLowerCase().includes(d));
        if (isInsecure) {
          throw new Error(
            "🚨 CRITICAL: Cannot use default JWT secrets in production! " +
            "Generate secure secrets: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
          );
        }
        return true;
      }
      return true;
    },
    { message: "Insecure JWT secret detected in production" }
  ),

JWT_REFRESH_SECRET: z
  .string()
  .min(32, "JWT_REFRESH_SECRET must be at least 32 characters")
  .refine(
    (val) => {
      if (process.env.NODE_ENV === "production") {
        const insecureDefaults = [
          "dev-access-secret",
          "dev-refresh-secret",
          "change-in-production",
        ];
        const isInsecure = insecureDefaults.some((d) => val.toLowerCase().includes(d));
        if (isInsecure) {
          throw new Error("🚨 CRITICAL: Cannot use default JWT secrets in production!");
        }
        return true;
      }
      return true;
    },
    { message: "Insecure JWT secret detected in production" }
  ),
```

#### Step 2: Add Startup Warning

**File:** `server/index.ts`

**Add after environment validation:**

```typescript
// Warn about development secrets
if (env.NODE_ENV === "development") {
  const devSecrets = [
    "dev-access-secret",
    "dev-refresh-secret",
    "change-in-production",
  ];

  const usingDefaults = [
    env.JWT_ACCESS_SECRET,
    env.JWT_REFRESH_SECRET,
    env.SESSION_SECRET,
  ].some((secret) => devSecrets.some((d) => secret.toLowerCase().includes(d)));

  if (usingDefaults) {
    logger.warn("⚠️  WARNING: Using default secrets for development");
    logger.warn("⚠️  NEVER deploy to production without changing secrets!");
    logger.warn(
      "⚠️  Generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"",
    );
  }
}
```

#### Step 3: Add Deployment Checklist

**File:** `README.md`

**Add section:**

````markdown
## 🚀 Production Deployment Checklist

Before deploying to production, ensure:

### Security

- [ ] Generate unique JWT_ACCESS_SECRET (64+ characters, use crypto.randomBytes)
- [ ] Generate unique JWT_REFRESH_SECRET (64+ characters)
- [ ] Generate unique SESSION_SECRET (64+ characters)
- [ ] Set NODE_ENV=production
- [ ] Configure SENTRY_DSN for error tracking
- [ ] Set up HTTPS with valid SSL certificate
- [ ] Configure CORS with specific origins (no wildcards)
- [ ] Enable rate limiting on authentication endpoints
- [ ] Set secure cookie attributes (httpOnly, secure, sameSite)

### Database

- [ ] DATABASE_URL points to production database
- [ ] Database connection uses SSL/TLS
- [ ] Database encrypted at rest
- [ ] Regular backups configured

### Secrets Management

- [ ] All secrets stored in AWS Secrets Manager / Azure Key Vault / HashiCorp Vault
- [ ] No .env files committed to git
- [ ] Gitleaks pre-commit hook enabled

### Monitoring

- [ ] Sentry configured for error tracking
- [ ] Log aggregation set up (ELK, Datadog, etc.)
- [ ] Uptime monitoring enabled
- [ ] Security alerts configured

### Generate Secrets

```bash
# Generate JWT secrets
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```
````

````

### Validation Test

```bash
# Test production validation
export NODE_ENV=production
export JWT_ACCESS_SECRET=dev-access-secret-change-in-production-min-32-chars
npm start

# Should fail with error:
# "🚨 CRITICAL: Cannot use default JWT secrets in production!"

# Test with secure secret
export JWT_ACCESS_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
npm start

# Should start successfully
````

### Approval Required

**No** — Configuration validation improvement

---

## F-009: No Rate Limiting

### Problem

Authentication endpoints lack rate limiting, enabling brute-force attacks.

### Proposed Fix

#### Step 1: Create Rate Limiting Middleware

**File:** `server/middleware/rate-limit.ts` (new file)

```typescript
import rateLimit from "express-rate-limit";

/**
 * Strict rate limiting for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: "Too many authentication attempts",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * General API rate limiting
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: "Too many requests",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

#### Step 2: Apply to Authentication Routes

**File:** `server/auth/jwt-auth-routes.ts`

**Import at top:**

```typescript
import { authLimiter } from "../middleware/rate-limit";
```

**Update route definitions:**

```typescript
// Apply rate limiting to auth endpoints
app.post("/api/auth/login", authLimiter, async (req, res) => {
  // existing login handler
});

app.post("/api/auth/register", authLimiter, async (req, res) => {
  // existing register handler
});

app.post("/api/auth/refresh", authLimiter, async (req, res) => {
  // existing refresh handler
});

app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
  // existing forgot password handler
});
```

#### Step 3: Implement Account Lockout

**Update User schema:**

**File:** `shared/schema.ts`

**Add to User interface:**

```typescript
export interface User {
  // ... existing fields
  failedLoginAttempts?: number;
  lockoutUntil?: Date;
}
```

**Update login handler:**

**File:** `server/auth/jwt-auth-routes.ts`

```typescript
app.post("/api/auth/login", authLimiter, async (req, res) => {
  const { username, password } = req.body;

  const user = await storage.getUserByUsername(username);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Check if account is locked
  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    return res.status(423).json({
      error: "Account temporarily locked due to too many failed attempts",
      retryAfter: user.lockoutUntil.toISOString(),
    });
  }

  const validPassword = await comparePassword(password, user.password);

  if (!validPassword) {
    // Increment failed attempts
    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
    const updates: Partial<User> = { failedLoginAttempts: failedAttempts };

    // Lock account after 5 failed attempts
    if (failedAttempts >= 5) {
      updates.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      logger.warn("Account locked due to failed login attempts", {
        userId: user.id,
        username: user.username,
        failedAttempts,
      });
    }

    await storage.updateUser(user.id, updates);

    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Reset failed attempts on successful login
  if (user.failedLoginAttempts || user.lockoutUntil) {
    await storage.updateUser(user.id, {
      failedLoginAttempts: 0,
      lockoutUntil: undefined,
    });
  }

  // ... rest of successful login logic
});
```

### Validation Test

```bash
# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
  echo ""
done

# After 5 attempts, should return 429 Too Many Requests

# Test account lockout
# After 5 failed attempts with same username:
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"correct"}'

# Should return 423 Locked
```

### Approval Required

**No** — Security enhancement

---

## Implementation Timeline

### Phase 1: Critical (Week 1)

- **F-001:** Revoke sessions, remove secrets from git, rotate JWT secrets (4-8 hours)
- **F-002:** Database migration, force password reset (12-16 hours)
- **F-006:** Production secret validation (2-4 hours)

**Total:** 18-28 hours

### Phase 2: High Priority (Week 2)

- **F-003:** Path sanitization (8-12 hours)
- **F-005:** Input sanitization middleware (6-8 hours)
- **F-007:** Session storage migration (4-6 hours)

**Total:** 18-26 hours

### Phase 3: Medium Priority (Week 3)

- **F-004:** Logging refactor (4-6 hours)
- **F-009:** Rate limiting (4-6 hours)
- **F-010:** CSRF protection (2-4 hours)
- **F-008:** Test data cleanup (1-2 hours)

**Total:** 11-18 hours

### Total Effort: 47-72 hours (1-1.5 engineer-weeks)

---

## Approval & Sign-off

**Created By:** Security Audit AI Agent  
**Date:** 2025-10-31 14:31 UTC  
**Status:** Awaiting Approval  
**Next Review:** After implementation

---

**END OF DOCUMENT**
