# Logging Guide

**Last Updated:** October 31, 2025  
**Version:** 2.0

This guide covers the comprehensive logging system in DevNest, including best practices, usage examples, and configuration options.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Log Levels](#log-levels)
3. [Client-Side Logging](#client-side-logging)
4. [Server-Side Logging](#server-side-logging)
5. [Error Handling](#error-handling)
6. [Distributed Tracing](#distributed-tracing)
7. [Configuration](#configuration)
8. [Best Practices](#best-practices)
9. [Migration from Legacy Logger](#migration-from-legacy-logger)

---

## Quick Start

### Basic Client-Side Logging

```typescript
import { logger } from "@/lib/logger";

// Simple logging
logger.info("User logged in successfully", { userId: "123" }, "AuthComponent");
logger.warn("Slow API response detected", { duration: 3000 });
logger.error("Failed to fetch user data", error, { userId: "123" });

// Debug logging (only in development by default)
logger.debug("Detailed state information", { state }, "UserProfile");
```

### Basic Server-Side Logging

```typescript
import logger from "./logger";

// Simple logging
logger.info("Server started successfully", { port: 5000 });
logger.error("Database connection failed", { error: err.message });
```

---

## Log Levels

The logging system supports five log levels, ordered by severity:

| Level   | Value | Usage                                                                       | Environment Default |
| ------- | ----- | --------------------------------------------------------------------------- | ------------------- |
| `DEBUG` | 0     | Detailed diagnostic information                                             | Development only    |
| `INFO`  | 1     | General informational messages                                              | All environments    |
| `WARN`  | 2     | Warning messages for potentially harmful situations                         | All environments    |
| `ERROR` | 3     | Error events that might still allow the application to continue             | All environments    |
| `FATAL` | 4     | Very severe error events that will presumably lead the application to abort | All environments    |

---

## Client-Side Logging

### Import the Logger

```typescript
import { logger } from "@/lib/logger";
```

### Basic Logging Methods

```typescript
// Debug - verbose diagnostic information
logger.debug("Rendering component with props", { props }, "MyComponent");

// Info - general informational messages
logger.info(
  "User action completed",
  { action: "profile_update" },
  "ProfilePage",
);

// Warn - warning messages
logger.warn("API response time exceeded threshold", { duration: 2500 }, "api");

// Error - error events
logger.error("Failed to save data", error, { formData }, "SaveForm");

// Fatal - critical errors
logger.fatal("Application initialization failed", error, { config }, "App");
```

### Context Management

Track users, sessions, and requests across your application:

```typescript
// Set user context
logger.setUserId("user-123");

// Set session context
logger.setSessionId("session-abc");

// Generate unique request ID
const requestId = logger.generateRequestId();

// Generate trace ID for distributed tracing
const traceId = logger.generateTraceId();

// Clear all context
logger.clearContext();
```

### API Logging

Specialized methods for API request/response logging:

```typescript
// Log API request
logger.logApiRequest("GET", "/api/users", {
  query: { page: 1, limit: 10 },
});

// Log API response
logger.logApiResponse("GET", "/api/users", 200, 234, {
  resultCount: 10,
});

// Log API error
logger.logApiError("POST", "/api/users", error, {
  requestData: userData,
});
```

### Performance Logging

Track performance metrics:

```typescript
const startTime = performance.now();

// ... perform operation ...

const duration = performance.now() - startTime;
logger.logPerformance("renderUserList", duration, {
  itemCount: users.length,
});
```

### User Action Logging

Track user interactions:

```typescript
logger.logUserAction("button_clicked", {
  buttonId: "submit-form",
  formType: "registration",
});
```

### Component Lifecycle Logging

Track component mount/unmount:

```typescript
useEffect(() => {
  logger.logComponentMount("UserDashboard", {
    userId: currentUser?.id,
  });

  return () => {
    logger.logComponentUnmount("UserDashboard");
  };
}, [currentUser?.id]);
```

---

## Server-Side Logging

### Import the Logger

```typescript
import logger from "./logger";
// Or for module-specific logging
import { createModuleLogger } from "./logger";

const dbLogger = createModuleLogger("database");
```

### Basic Logging Methods

```typescript
// Standard Winston levels
logger.debug("SQL query executed", { query, duration });
logger.info("New user registered", { userId, email });
logger.warn("Rate limit approaching threshold", { current, limit });
logger.error("Database query failed", { error: err.message });
logger.fatal("Critical system failure", { error: err });
```

### Helper Functions

```typescript
import { logApiCall, logUserAction, logError } from "./logger";

// Log API endpoint calls
logApiCall("POST", "/api/users", 201, 145, {
  userId: newUser.id,
});

// Log user actions
logUserAction("user_login", "user-123", {
  ip: req.ip,
  userAgent: req.headers["user-agent"],
});

// Log errors with context
logError(error, {
  operation: "database_query",
  table: "users",
});
```

### Module-Specific Loggers

Create contextual loggers for different modules:

```typescript
// Create a logger for the database module
const dbLogger = createModuleLogger("database");

dbLogger.info("Connection pool initialized", { size: 10 });
dbLogger.error("Query timeout", { query, timeout: 5000 });
```

### Request-Scoped Logging with Trace IDs

Use the trace middleware for correlated logging:

```typescript
import { traceMiddleware } from "./middleware/trace-middleware";

// Add to Express app
app.use(traceMiddleware);

// In route handlers, use req.logger
app.get("/api/users", (req, res) => {
  req.logger.info("Fetching users", { query: req.query });

  // Request-scoped logger automatically includes traceId and requestId
  req.logger.error("Failed to fetch users", { error: err.message });
});
```

---

## Error Handling

### Using Error Codes

Import standardized error codes:

```typescript
import {
  createAppError,
  createNetworkError,
  createValidationError,
  ErrorCode,
  isAppError,
  getUserMessage,
} from "@/shared/error-codes";

// Create a standardized error
const error = createAppError(
  "User not found in database",
  ErrorCode.RESOURCE_NOT_FOUND,
  { userId: "123" },
);

// Create a network error
const netError = createNetworkError("/api/users", 500, "Internal Server Error");

// Create a validation error
const validError = createValidationError("email", "Invalid email format");

// Check if an error is an AppError
if (isAppError(error)) {
  console.log(error.code); // ErrorCode enum
  console.log(error.severity); // ErrorSeverity enum
  console.log(error.userMessage); // User-friendly message
  console.log(error.retryable); // boolean
}

// Get user-friendly message
const message = getUserMessage(error);
```

### Using the Error Handler Hook

In React components:

```typescript
import { useErrorHandler } from "@/hooks/use-error-handler";

function MyComponent() {
  const { handleError, wrapAsync } = useErrorHandler({
    showToast: true,
    logError: true,
  });

  // Wrap async functions
  const handleSubmit = wrapAsync(async () => {
    const result = await saveData();
    // Errors are automatically caught, logged, and shown in toast
    return result;
  }, "MyComponent.handleSubmit");

  // Or handle errors manually
  const handleManual = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      handleError(error, "MyComponent.handleManual");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

### Error Boundary Integration

The error boundary automatically logs errors:

```typescript
import { ErrorBoundary } from "@/components/error-boundary";

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Custom error handling
        console.log("Error caught by boundary", error);
      }}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

---

## Distributed Tracing

Trace IDs allow you to correlate logs across client and server.

### Client-Side: Generating Trace IDs

```typescript
import { logger } from "@/lib/logger";

// Generate a new trace ID (automatically added to context)
const traceId = logger.generateTraceId();

// Or set from external source
logger.setTraceId("trace-123-abc");

// Get current trace ID
const currentTraceId = logger.getTraceId();
```

### Automatic Trace Propagation

Trace IDs are automatically added to API requests:

```typescript
// apiRequest() automatically adds X-Trace-Id header
const response = await apiRequest("GET", "/api/users");
```

### Server-Side: Extracting Trace IDs

Using the trace middleware:

```typescript
import { traceMiddleware } from "./middleware/trace-middleware";

app.use(traceMiddleware);

// In route handlers:
app.get("/api/data", (req, res) => {
  // Access trace context
  console.log(req.traceId); // Extracted from headers or generated
  console.log(req.requestId);

  // Use request-scoped logger (includes trace context)
  req.logger.info("Processing request");
});
```

### Manual Trace Context

Create a logger with specific trace context:

```typescript
import { createTracedLogger } from "./logger";

const tracedLogger = createTracedLogger("trace-123", "request-456", {
  userId: "user-789",
});

tracedLogger.info("Custom traced log");
```

---

## Configuration

### Environment Variables

Configure logging behavior via environment variables:

```bash
# Client-side log level (in .env or .env.local)
VITE_LOG_LEVEL=debug    # Options: debug, info, warn, error, fatal

# Server-side log level
LOG_LEVEL=info          # Options: debug, info, warn, error, fatal

# Sentry integration (optional)
VITE_SENTRY_DSN=https://...@sentry.io/...
SENTRY_DSN=https://...@sentry.io/...
```

### Default Behavior

| Environment | Default Client Level | Default Server Level |
| ----------- | -------------------- | -------------------- |
| Development | `debug`              | `debug`              |
| Production  | `warn`               | `info`               |

### Programmatic Configuration

```typescript
import { logger, LogLevel } from "@/lib/logger";

// Set minimum log level
logger.setMinLevel(LogLevel.WARN);

// Add custom transport
import { ExternalTransport } from "@/lib/logger";

const sentryTransport = new ExternalTransport("sentry", {
  apiKey: "your-api-key",
});

logger.addTransport(sentryTransport);

// Remove a transport
logger.removeTransport("console");
```

---

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// ✅ Good
logger.debug("Detailed state", { state }); // Development only
logger.info("User logged in", { userId }); // Important events
logger.warn("Slow response", { duration: 3000 }); // Potential issues
logger.error("Failed to save", error, { data }); // Errors
logger.fatal("App crashed", error); // Critical failures

// ❌ Bad
logger.info("Detailed debugging information"); // Use debug
logger.error("User logged in"); // Not an error
```

### 2. Include Context

```typescript
// ✅ Good
logger.error(
  "Failed to fetch user",
  error,
  { userId: "123", endpoint: "/api/users" },
  "UserService",
);

// ❌ Bad
logger.error("Error"); // No context
```

### 3. Use Structured Metadata

```typescript
// ✅ Good
logger.info("User updated profile", {
  userId: "123",
  fields: ["email", "phone"],
  timestamp: Date.now(),
});

// ❌ Bad
logger.info(`User 123 updated email and phone at ${Date.now()}`);
```

### 4. Don't Log in Loops

```typescript
// ❌ Bad - creates too many logs
users.forEach((user) => {
  logger.debug("Processing user", { user });
});

// ✅ Good - aggregate logging
logger.debug("Processing users", {
  userCount: users.length,
  userIds: users.map((u) => u.id),
});
```

### 5. Sensitive Data is Auto-Sanitized

The logger automatically redacts sensitive data, but be mindful:

```typescript
// These are automatically sanitized:
logger.info("User data", {
  email: "user@example.com", // -> [EMAIL_REDACTED]
  password: "secret123", // -> [REDACTED]
  creditCard: "1234-5678-9012", // -> [CARD_REDACTED]
});
```

### 6. Use Component Names

```typescript
// ✅ Good
logger.info("Component mounted", {}, "UserDashboard");
logger.error("Failed to load", error, {}, "DataTable");

// ❌ Bad
logger.info("Component mounted"); // Which component?
```

### 7. Log Performance Metrics

```typescript
const start = performance.now();
await heavyOperation();
const duration = performance.now() - start;

logger.logPerformance("heavyOperation", duration, {
  itemsProcessed: 1000,
});
```

### 8. Use Error Handler Hook in Components

```typescript
// ✅ Good - consistent error handling
const { wrapAsync } = useErrorHandler();

const handleSave = wrapAsync(async () => {
  await saveData();
}, "SaveForm.handleSave");

// ❌ Bad - inconsistent error handling
const handleSave = async () => {
  try {
    await saveData();
  } catch (err) {
    console.error(err); // Not using logger
  }
};
```

---

## Migration from Legacy Logger

If you're upgrading from the old `error-logger.ts`:

### Import Changes

```typescript
// ❌ Old
import { errorLogger } from "@/lib/error-logger";

// ✅ New
import { logger } from "@/lib/logger";
```

### Method Mapping

```typescript
// ❌ Old
errorLogger.logError(error, { context: "UserService" });
errorLogger.logWarning("Slow response", { duration: 3000 });
errorLogger.logApiError(url, method, status, error);
errorLogger.logUserAction("button_click", { buttonId });

// ✅ New
logger.error("Error description", error, { context: "UserService" });
logger.warn("Slow response", { duration: 3000 });
logger.logApiError(method, url, error, { status });
logger.logUserAction("button_click", { buttonId });
```

### Error Creation

```typescript
// ❌ Old
import { createAppError } from "@/lib/error-logger";
const error = createAppError("Error", "CODE", 500, { context });

// ✅ New
import { createAppError, ErrorCode } from "@/shared/error-codes";
const error = createAppError("Error", ErrorCode.INTERNAL_ERROR, { context });
```

---

## Additional Resources

- [Error Handling Guide](./error-handling-guide.md)
- [Logging Migration Guide](./logging-migration-guide.md)
- [Observability Overview](./observability-overview.md)
- [Error Codes Reference](../shared/error-codes.ts)

---

## Support

For questions or issues:

- Review the codebase examples in `/client/src/examples/`
- Check the test files in `/tests/unit/client/lib/`
- Consult with the platform team

---

**Version History:**

- v2.0 (Oct 31, 2025): Added comprehensive logging system, trace IDs, error codes
- v1.0 (Earlier): Legacy error-logger system
