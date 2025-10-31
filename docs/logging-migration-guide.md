# Logging System Migration Guide

**Last Updated:** October 31, 2025  
**Version:** 2.0

This guide helps you migrate from the legacy `error-logger.ts` system to the new comprehensive logging system.

---

## Table of Contents

1. [Overview](#overview)
2. [Why Migrate?](#why-migrate)
3. [What's Changed](#whats-changed)
4. [Step-by-Step Migration](#step-by-step-migration)
5. [Import Changes](#import-changes)
6. [Method Mapping](#method-mapping)
7. [Code Examples](#code-examples)
8. [Testing After Migration](#testing-after-migration)
9. [Troubleshooting](#troubleshooting)

---

## Overview

We're consolidating from two logging systems to a single comprehensive logger that provides:

- Better type safety
- Distributed tracing support
- Environment-based log levels
- Centralized error codes
- Consistent API across client and server

---

## Why Migrate?

### Problems with Legacy System

1. **Duplicate Systems** - `error-logger.ts` and `logger.ts` causing confusion
2. **No Type Safety** - String-based error codes prone to typos
3. **Inconsistent Usage** - Different patterns across codebase
4. **No Tracing** - Can't correlate client/server logs
5. **Limited Configuration** - Hardcoded log levels

### Benefits of New System

1. ✅ **Single Source of Truth** - One comprehensive logger
2. ✅ **Type-Safe Error Codes** - Enum-based with metadata
3. ✅ **Distributed Tracing** - Correlate logs across services
4. ✅ **Flexible Configuration** - Environment-based log levels
5. ✅ **Better DX** - Consistent API, better autocomplete

---

## What's Changed

### File Changes

| Old File                         | New File                                | Status           |
| -------------------------------- | --------------------------------------- | ---------------- |
| `client/src/lib/error-logger.ts` | `client/src/lib/logger.ts`              | **Use new file** |
| N/A                              | `shared/error-codes.ts`                 | **New file**     |
| N/A                              | `server/middleware/trace-middleware.ts` | **New file**     |

### API Changes

| Old API                                  | New API                                        | Notes                     |
| ---------------------------------------- | ---------------------------------------------- | ------------------------- |
| `errorLogger.logError()`                 | `logger.error()`                               | Different parameter order |
| `errorLogger.logWarning()`               | `logger.warn()`                                | Simplified                |
| `errorLogger.logApiError()`              | `logger.logApiError()`                         | Parameter order changed   |
| `errorLogger.logUserAction()`            | `logger.logUserAction()`                       | Same API                  |
| `createAppError(msg, code, status, ctx)` | `createAppError(msg, ErrorCode, ctx, traceId)` | Type-safe codes           |

---

## Step-by-Step Migration

### Phase 1: Add New Imports (Keep Old Code Working)

```typescript
// Add new imports alongside old ones
import { errorLogger } from "@/lib/error-logger"; // Keep temporarily
import { logger } from "@/lib/logger"; // Add new
import {
  createAppError,
  ErrorCode,
  isAppError,
  getUserMessage,
} from "@/shared/error-codes"; // Add new
```

### Phase 2: Update Error Creation

```typescript
// Old
const error = createAppError("User not found", "RESOURCE_NOT_FOUND", 404, {
  userId,
});

// New
const error = createAppError(
  "User not found",
  ErrorCode.RESOURCE_NOT_FOUND,
  { userId },
  traceId, // optional
);
```

### Phase 3: Update Logging Calls

```typescript
// Old
errorLogger.logError(error, { context: "UserService" });

// New
logger.error(
  "Failed to fetch user",
  error,
  { context: "UserService" },
  "UserService",
);
```

### Phase 4: Remove Old Imports

```typescript
// Remove
// import { errorLogger } from "@/lib/error-logger";
```

### Phase 5: Test Thoroughly

Run your test suite and verify:

- Logs appear in console
- Errors are tracked in Sentry
- No TypeScript errors
- Error boundaries still work

---

## Import Changes

### Error Logger

```typescript
// ❌ Old
import { errorLogger } from "@/lib/error-logger";

// ✅ New
import { logger } from "@/lib/logger";
```

### Error Creation Functions

```typescript
// ❌ Old
import {
  createAppError,
  createNetworkError,
  createValidationError,
} from "@/lib/error-logger";

// ✅ New
import {
  createAppError,
  createNetworkError,
  createValidationError,
  ErrorCode,
  ErrorSeverity,
} from "@/shared/error-codes";
```

### Error Types

```typescript
// ❌ Old
import { AppError } from "@/lib/error-logger";

// ✅ New
import { AppError } from "@/shared/error-codes";
```

### Error Utilities

```typescript
// ✅ New (didn't exist before)
import {
  isAppError,
  getUserMessage,
  isRetryableError,
} from "@/shared/error-codes";
```

---

## Method Mapping

### Error Logging

```typescript
// ❌ Old
errorLogger.logError(error, { context: "UserService" });

// ✅ New
logger.error(
  "Description of what failed",
  error,
  { context: "UserService" },
  "UserService", // component name
);
```

### Warning Logging

```typescript
// ❌ Old
errorLogger.logWarning("Slow API response", { duration: 3000 });

// ✅ New
logger.warn("Slow API response", { duration: 3000 }, "api");
```

### API Error Logging

```typescript
// ❌ Old
errorLogger.logApiError(url, method, status, error);

// ✅ New
logger.logApiError(method, url, error, { status });
```

### User Action Logging

```typescript
// ❌ Old
errorLogger.logUserAction("button_click", { buttonId: "submit" });

// ✅ New
logger.logUserAction("button_click", { buttonId: "submit" });
```

### Query Error Logging

```typescript
// ❌ Old
errorLogger.logQueryError(queryKey, error);

// ✅ New
logger.error("Query failed", error, { queryKey }, "ReactQuery");
```

---

## Code Examples

### Example 1: Simple Error Handling

```typescript
// ❌ Old
import { errorLogger, createAppError } from "@/lib/error-logger";

async function fetchUser(id: string) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) {
      const error = createAppError(
        "User not found",
        "RESOURCE_NOT_FOUND",
        404,
        { userId: id },
      );
      errorLogger.logError(error, { context: "fetchUser" });
      throw error;
    }
    return await res.json();
  } catch (error) {
    errorLogger.logError(error as Error, { context: "fetchUser" });
    throw error;
  }
}

// ✅ New
import { logger } from "@/lib/logger";
import { createAppError, ErrorCode } from "@/shared/error-codes";

async function fetchUser(id: string) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) {
      const error = createAppError(
        "User not found",
        ErrorCode.RESOURCE_NOT_FOUND,
        { userId: id },
      );
      logger.error("Failed to fetch user", error, { userId: id }, "fetchUser");
      throw error;
    }
    return await res.json();
  } catch (error) {
    logger.error(
      "User fetch error",
      error as Error,
      { userId: id },
      "fetchUser",
    );
    throw error;
  }
}
```

### Example 2: React Component Error Handling

```typescript
// ❌ Old
import { errorLogger } from "@/lib/error-logger";

function UserProfile() {
  const handleSave = async () => {
    try {
      await saveProfile(data);
    } catch (error) {
      errorLogger.logError(error as Error, { context: "UserProfile.handleSave" });
      toast({ title: "Error", description: error.message });
    }
  };

  return <button onClick={handleSave}>Save</button>;
}

// ✅ New
import { useErrorHandler } from "@/hooks/use-error-handler";

function UserProfile() {
  const { wrapAsync } = useErrorHandler({
    showToast: true,
    logError: true,
  });

  const handleSave = wrapAsync(async () => {
    await saveProfile(data);
  }, "UserProfile.handleSave");

  return <button onClick={handleSave}>Save</button>;
}
```

### Example 3: API Request Error Handling

```typescript
// ❌ Old
import { errorLogger, createNetworkError } from "@/lib/error-logger";

async function apiCall(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const error = createNetworkError(url, res.status, res.statusText);
      errorLogger.logApiError(url, "GET", res.status, error);
      throw error;
    }
    return await res.json();
  } catch (error) {
    errorLogger.logError(error as Error, { context: "apiCall" });
    throw error;
  }
}

// ✅ New
import { apiRequest } from "@/lib/queryClient";

async function apiCall(url: string) {
  // apiRequest handles logging, tracing, and error transformation automatically
  const response = await apiRequest("GET", url);
  return await response.json();
}
```

### Example 4: Error Code Checking

```typescript
// ❌ Old
import { createAppError, AppError } from "@/lib/error-logger";

try {
  await operation();
} catch (error) {
  if ((error as AppError).code === "VALIDATION_ERROR") {
    // Handle validation error
  }
}

// ✅ New
import { createAppError, ErrorCode, isAppError } from "@/shared/error-codes";

try {
  await operation();
} catch (error) {
  if (isAppError(error) && error.code === ErrorCode.VALIDATION_ERROR) {
    // Handle validation error with type safety
  }
}
```

### Example 5: User-Friendly Error Messages

```typescript
// ❌ Old
import { createAppError } from "@/lib/error-logger";

const error = createAppError("Database error", "DB_ERROR", 500, {});
toast({ description: error.message }); // Technical message

// ✅ New
import {
  createAppError,
  ErrorCode,
  getUserMessage,
} from "@/shared/error-codes";

const error = createAppError("Database error", ErrorCode.DATABASE_ERROR, {});
toast({ description: getUserMessage(error) }); // User-friendly message
```

---

## Testing After Migration

### 1. Console Logging

Verify logs appear in console:

```bash
# Development mode
npm run dev

# Check console for logs with:
# - Timestamps
# - Log levels (DEBUG, INFO, WARN, ERROR, FATAL)
# - Component names
# - Trace IDs
```

### 2. Error Tracking

Verify Sentry integration:

```typescript
// Trigger an error
throw createAppError("Test error", ErrorCode.INTERNAL_ERROR);

// Check Sentry dashboard for:
// - Error appears
// - Trace ID is included
# - User context is attached
// - Error metadata is captured
```

### 3. Unit Tests

Run test suite:

```bash
npm test

# Verify:
# - All tests pass
# - No TypeScript errors
# - Logger methods are called correctly
```

### 4. Integration Tests

```bash
npm run test:integration

# Verify:
# - API errors are logged
# - Trace IDs are propagated
# - Error responses are correct
```

### 5. Visual Verification

```typescript
// Check error boundary works
function TestComponent() {
  throw new Error("Test error boundary");
}

// Check toast notifications work
function TestToast() {
  const { handleError } = useErrorHandler();
  handleError(new Error("Test toast"), "TestToast");
}
```

---

## Troubleshooting

### Issue: TypeScript Errors After Migration

**Problem:** `Cannot find module '@/shared/error-codes'`

**Solution:**

```bash
# Restart TypeScript server in VS Code
Cmd+Shift+P -> "TypeScript: Restart TS Server"

# Or restart dev server
npm run dev
```

### Issue: Logs Not Appearing

**Problem:** No logs in console after migration

**Solution:**

```typescript
// Check log level environment variable
console.log(import.meta.env.VITE_LOG_LEVEL);

// Temporarily set to debug
// In .env.local
VITE_LOG_LEVEL = debug;
```

### Issue: Sentry Not Receiving Errors

**Problem:** Errors not appearing in Sentry dashboard

**Solution:**

```bash
# Check Sentry DSN is configured
echo $VITE_SENTRY_DSN

# Verify Sentry is initialized
# Check client/src/lib/sentry.ts
```

### Issue: Trace IDs Not Propagating

**Problem:** Client and server logs have different trace IDs

**Solution:**

```typescript
// Verify trace middleware is added on server
import { traceMiddleware } from "./middleware/trace-middleware";
app.use(traceMiddleware);

// Verify apiRequest is used for API calls (not raw fetch)
import { apiRequest } from "@/lib/queryClient";
const response = await apiRequest("GET", url);
```

### Issue: Error Messages Not User-Friendly

**Problem:** Technical error messages shown to users

**Solution:**

```typescript
// Use getUserMessage helper
import { getUserMessage } from "@/shared/error-codes";

toast({
  description: getUserMessage(error), // Not error.message
});
```

---

## Migration Checklist

Use this checklist to track your migration progress:

### Imports

- [ ] Replace `error-logger` imports with `logger`
- [ ] Add `error-codes` imports
- [ ] Update error type imports
- [ ] Add error utility imports

### Error Creation

- [ ] Update `createAppError` calls to use `ErrorCode` enum
- [ ] Add trace IDs to error creation
- [ ] Update error code strings to enum values

### Logging Calls

- [ ] Replace `errorLogger.logError()` with `logger.error()`
- [ ] Replace `errorLogger.logWarning()` with `logger.warn()`
- [ ] Update `logApiError()` parameter order
- [ ] Add component names to log calls

### Error Handling

- [ ] Use `useErrorHandler` hook in React components
- [ ] Use `getUserMessage()` for user-facing messages
- [ ] Use `isAppError()` for type checking
- [ ] Update error boundaries if needed

### Testing

- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Verify console logging
- [ ] Verify Sentry integration
- [ ] Test error boundaries
- [ ] Test toast notifications

### Cleanup

- [ ] Remove unused `error-logger` imports
- [ ] Remove old error code strings
- [ ] Update documentation
- [ ] Review code for consistency

---

## Support

Need help with migration?

1. **Review Examples** - Check `/client/src/examples/` for usage patterns
2. **Check Tests** - See `/tests/unit/client/lib/` for test examples
3. **Read Guides**
   - [Logging Guide](./logging-guide.md)
   - [Error Handling Guide](./error-handling-guide.md)
4. **Ask Questions** - Reach out to the platform team

---

## Timeline

| Phase       | Duration | Tasks                                      |
| ----------- | -------- | ------------------------------------------ |
| **Phase 1** | Week 1   | Add new imports, keep old code working     |
| **Phase 2** | Week 2-3 | Migrate high-traffic routes and components |
| **Phase 3** | Week 4-5 | Migrate remaining code                     |
| **Phase 4** | Week 6   | Remove deprecated code, final testing      |

---

## Next Steps

After completing the migration:

1. ✅ Remove `@deprecated` notices from code
2. ✅ Delete `error-logger.ts` file
3. ✅ Update onboarding documentation
4. ✅ Share migration experience with team
5. ✅ Celebrate! 🎉

---

**Version:** 2.0  
**Last Updated:** October 31, 2025
