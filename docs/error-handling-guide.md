# Error Handling Guide

**Last Updated:** October 31, 2025  
**Version:** 2.0

This guide provides comprehensive patterns and best practices for error handling in the DevNest application.

---

## Table of Contents

1. [Overview](#overview)
2. [Error Code System](#error-code-system)
3. [Error Handling Patterns](#error-handling-patterns)
4. [React Component Error Handling](#react-component-error-handling)
5. [API Error Handling](#api-error-handling)
6. [Server-Side Error Handling](#server-side-error-handling)
7. [User-Friendly Error Messages](#user-friendly-error-messages)
8. [Best Practices](#best-practices)

---

## Overview

DevNest uses a **centralized error code system** with standardized error types, severity levels, and user-friendly messages. This ensures consistency across the application and improves debugging.

### Key Principles

1. **Type-safe error codes** - Use enums, not magic strings
2. **Consistent error structure** - All errors follow the same interface
3. **User-friendly messages** - Separate technical messages from user-facing ones
4. **Automatic logging** - Errors are logged with full context
5. **Retry logic** - Errors indicate whether they're retryable

---

## Error Code System

### Error Code Categories

Errors are organized by category for easy identification:

| Category       | Code Range | Examples                               |
| -------------- | ---------- | -------------------------------------- |
| Network        | 1xxx       | NETWORK_ERROR, API_REQUEST_FAILED      |
| Validation     | 2xxx       | VALIDATION_ERROR, INVALID_INPUT        |
| Authentication | 3xxx       | UNAUTHORIZED, TOKEN_EXPIRED            |
| Resource       | 4xxx       | RESOURCE_NOT_FOUND, DUPLICATE_RESOURCE |
| Business Logic | 5xxx       | OPERATION_NOT_ALLOWED, QUOTA_EXCEEDED  |
| System         | 9xxx       | INTERNAL_ERROR, DATABASE_ERROR         |

### AppError Interface

All application errors implement the `AppError` interface:

```typescript
interface AppError extends Error {
  code: ErrorCode; // Standardized error code
  statusCode: number; // HTTP status code
  severity: ErrorSeverity; // low, medium, high, critical
  userMessage: string; // User-friendly message
  retryable: boolean; // Can this be retried?
  context?: Record<string, any>; // Additional context
  timestamp: string; // When the error occurred
  traceId?: string; // Distributed tracing ID
}
```

### Creating Errors

```typescript
import {
  createAppError,
  createNetworkError,
  createValidationError,
  createApiError,
  ErrorCode,
} from "@/shared/error-codes";

// General application error
const error = createAppError(
  "User not found in database",
  ErrorCode.RESOURCE_NOT_FOUND,
  { userId: "123" },
  traceId, // optional
);

// Network error
const netError = createNetworkError(
  "/api/users",
  500,
  "Internal Server Error",
  traceId,
);

// Validation error
const validError = createValidationError(
  "email",
  "Invalid email format",
  traceId,
);

// API error
const apiError = createApiError(
  "POST",
  "/api/users",
  400,
  "Bad Request",
  { validation: "Email already exists" },
  traceId,
);
```

### Checking Error Types

```typescript
import {
  isAppError,
  isRetryableError,
  getUserMessage,
} from "@/shared/error-codes";

try {
  await riskyOperation();
} catch (error) {
  if (isAppError(error)) {
    console.log(error.code); // ErrorCode.NETWORK_ERROR
    console.log(error.severity); // ErrorSeverity.HIGH
    console.log(error.userMessage); // User-friendly message
  }

  // Check if retryable
  if (isRetryableError(error)) {
    await retry(riskyOperation);
  }

  // Get user message
  const message = getUserMessage(error);
  toast({ description: message });
}
```

---

## Error Handling Patterns

### Pattern 1: Try-Catch with Logging

```typescript
import { logger } from "@/lib/logger";
import { createAppError, ErrorCode } from "@/shared/error-codes";

async function fetchUserData(userId: string) {
  try {
    const response = await fetch(`/api/users/${userId}`);

    if (!response.ok) {
      throw createAppError(
        `Failed to fetch user ${userId}`,
        ErrorCode.API_REQUEST_FAILED,
        { userId, status: response.status },
      );
    }

    return await response.json();
  } catch (error) {
    logger.error(
      "Failed to fetch user data",
      error as Error,
      { userId },
      "UserService",
    );
    throw error; // Re-throw after logging
  }
}
```

### Pattern 2: Error Handler Hook (React)

```typescript
import { useErrorHandler } from "@/hooks/use-error-handler";

function MyComponent() {
  const { handleError, wrapAsync } = useErrorHandler({
    showToast: true,
    logError: true,
  });

  // Automatic error handling
  const saveData = wrapAsync(async () => {
    const result = await apiRequest("POST", "/api/data", formData);
    return result;
  }, "MyComponent.saveData");

  // Manual error handling
  const handleManualError = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      handleError(error as Error, "MyComponent.handleManualError");
    }
  };

  return <button onClick={saveData}>Save</button>;
}
```

### Pattern 3: Error Boundary (React)

```typescript
import { ErrorBoundary } from "@/components/error-boundary";

function App() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button onClick={reset}>Try again</button>
        </div>
      )}
      onError={(error, errorInfo) => {
        // Custom logging or reporting
        console.log("Caught by boundary:", error);
      }}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

### Pattern 4: React Query Error Handling

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { useErrorHandler } from "@/hooks/use-error-handler";

function UserList() {
  const { handleError } = useErrorHandler();

  const { data, error, isError } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    onError: (error) => {
      handleError(error as Error, "UserList.fetchUsers");
    },
  });

  const mutation = useMutation({
    mutationFn: createUser,
    onError: (error) => {
      handleError(error as Error, "UserList.createUser");
    },
    onSuccess: () => {
      toast({ title: "User created successfully" });
    },
  });

  if (isError) {
    return <div>Error: {getUserMessage(error)}</div>;
  }

  return <div>{/* ... */}</div>;
}
```

---

## React Component Error Handling

### Using useErrorHandler Hook

The `useErrorHandler` hook provides consistent error handling:

```typescript
import { useErrorHandler } from "@/hooks/use-error-handler";

function FormComponent() {
  const { handleError, handleAsyncError, wrapAsync } = useErrorHandler({
    showToast: true,    // Show error toast (default: true)
    logError: true,     // Log error to logger (default: true)
    onError: (error) => {
      // Custom error handling
      analytics.trackError(error);
    },
  });

  // Option 1: Wrap async functions
  const handleSubmit = wrapAsync(async (data) => {
    await saveForm(data);
  }, "FormComponent.handleSubmit");

  // Option 2: Use handleAsyncError
  const handleSave = async () => {
    await handleAsyncError(async () => {
      await saveData();
    }, "FormComponent.handleSave");
  };

  // Option 3: Manual error handling
  const handleDelete = async () => {
    try {
      await deleteItem();
    } catch (error) {
      handleError(error as Error, "FormComponent.handleDelete");
    }
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

### Error Boundaries

Place error boundaries at strategic locations:

```typescript
// App-level error boundary
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Feature-level error boundaries
<ErrorBoundary fallback={<FeatureFallback />}>
  <ComplexFeature />
</ErrorBoundary>

// Component-level error boundaries
<ErrorBoundary fallback={<div>Component failed to load</div>}>
  <UnstableComponent />
</ErrorBoundary>
```

---

## API Error Handling

### Using apiRequest Helper

The `apiRequest` function automatically handles:

- Request/response logging
- Trace ID propagation
- Error transformation
- Retry logic

```typescript
import { apiRequest } from "@/lib/queryClient";
import { ErrorCode } from "@/shared/error-codes";

async function createUser(userData: UserData) {
  try {
    const response = await apiRequest("POST", "/api/users", userData);
    return await response.json();
  } catch (error) {
    // Error is already logged and transformed
    if (isAppError(error) && error.code === ErrorCode.VALIDATION_ERROR) {
      // Handle validation errors specifically
      showValidationErrors(error.context);
    }
    throw error;
  }
}
```

### Fetch with Manual Error Handling

```typescript
async function fetchWithErrorHandling(url: string) {
  const traceId = logger.generateTraceId();

  try {
    const response = await fetch(url, {
      headers: {
        "X-Trace-Id": traceId,
      },
    });

    if (!response.ok) {
      throw createApiError(
        "GET",
        url,
        response.status,
        response.statusText,
        await response.json(),
        traceId,
      );
    }

    return await response.json();
  } catch (error) {
    logger.error(
      "Fetch failed",
      error as Error,
      { url, traceId },
      "FetchService",
    );
    throw error;
  }
}
```

### React Query Configuration

Global error handling for React Query:

```typescript
import { QueryClient } from "@tanstack/react-query";
import { logger } from "@/lib/logger";
import { isRetryableError } from "@/shared/error-codes";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry client errors (4xx)
        if (!isRetryableError(error)) {
          return false;
        }
        // Retry up to 3 times for retryable errors
        return failureCount < 3;
      },
      onError: (error) => {
        logger.error(
          "Query failed",
          error as Error,
          { queryKey: "unknown" },
          "ReactQuery",
        );
      },
    },
    mutations: {
      onError: (error) => {
        logger.error("Mutation failed", error as Error, {}, "ReactQuery");
      },
    },
  },
});
```

---

## Server-Side Error Handling

### Express Error Middleware

```typescript
import { Request, Response, NextFunction } from "express";
import { logError } from "./logger";

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log the error with trace context
  req.logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Determine status code
  const statusCode = (err as any).statusCode || 500;

  // Send error response
  res.status(statusCode).json({
    error: {
      message: err.message,
      code: (err as any).code || "INTERNAL_ERROR",
      traceId: req.traceId,
    },
  });
});
```

### Route Handler Error Handling

```typescript
import { Request, Response } from "express";
import { createAppError, ErrorCode } from "../shared/error-codes";

app.get("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.params.id);

    if (!user) {
      throw createAppError(
        `User ${req.params.id} not found`,
        ErrorCode.RESOURCE_NOT_FOUND,
        { userId: req.params.id },
        req.traceId,
      );
    }

    res.json({ user });
  } catch (error) {
    req.logger.error("Failed to get user", {
      error: (error as Error).message,
      userId: req.params.id,
    });

    const statusCode = (error as any).statusCode || 500;
    res.status(statusCode).json({
      error: {
        message: (error as Error).message,
        code: (error as any).code || "INTERNAL_ERROR",
        traceId: req.traceId,
      },
    });
  }
});
```

### Async Error Handler Wrapper

```typescript
// Utility to wrap async route handlers
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
app.get(
  "/api/users",
  asyncHandler(async (req, res) => {
    const users = await getUsers();
    res.json({ users });
  }),
);
```

---

## User-Friendly Error Messages

### Using getUserMessage

```typescript
import { getUserMessage } from "@/shared/error-codes";

try {
  await saveData();
} catch (error) {
  // Technical error message
  logger.error("Save failed", error as Error);

  // User-friendly message
  const userMessage = getUserMessage(error);
  toast({
    title: "Error",
    description: userMessage,
    variant: "destructive",
  });
}
```

### Custom Error Messages

Define user-friendly messages in error metadata:

```typescript
// In shared/error-codes.ts
export const ERROR_METADATA: Record<ErrorCode, ErrorMetadata> = {
  [ErrorCode.NETWORK_ERROR]: {
    statusCode: 0,
    userMessage:
      "Network connection failed. Please check your internet connection.",
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
  },
  // ... more error codes
};
```

---

## Best Practices

### 1. Always Use Error Codes

```typescript
// ✅ Good
throw createAppError("User not found", ErrorCode.RESOURCE_NOT_FOUND, {
  userId,
});

// ❌ Bad
throw new Error("User not found");
```

### 2. Include Context

```typescript
// ✅ Good
throw createAppError(
  "Failed to process payment",
  ErrorCode.INTERNAL_ERROR,
  {
    userId,
    amount,
    paymentMethod,
    attemptNumber: 3,
  },
  traceId,
);

// ❌ Bad
throw createAppError("Payment failed", ErrorCode.INTERNAL_ERROR);
```

### 3. Log Before Re-throwing

```typescript
// ✅ Good
try {
  await operation();
} catch (error) {
  logger.error("Operation failed", error as Error, { context });
  throw error; // Re-throw for upstream handling
}

// ❌ Bad
try {
  await operation();
} catch (error) {
  throw error; // Not logged
}
```

### 4. Use Appropriate Severity Levels

Errors have severity levels that affect logging and monitoring:

```typescript
// CRITICAL - System failures, data corruption
ErrorSeverity.CRITICAL;

// HIGH - Major functionality broken, security issues
ErrorSeverity.HIGH;

// MEDIUM - Feature degradation, recoverable errors
ErrorSeverity.MEDIUM;

// LOW - Minor issues, validation errors
ErrorSeverity.LOW;
```

### 5. Handle Errors at the Right Level

```typescript
// Handle validation errors in the component
try {
  await saveForm(data);
} catch (error) {
  if (isAppError(error) && error.code === ErrorCode.VALIDATION_ERROR) {
    setFormErrors(error.context);
    return; // Handle here, don't propagate
  }
  throw error; // Let other errors propagate
}
```

### 6. Provide Actionable Error Messages

```typescript
// ✅ Good - tells user what to do
"Session expired. Please log in again.";
"Too many requests. Please wait a moment and try again.";

// ❌ Bad - not actionable
"Error 401";
"Request failed";
```

### 7. Never Swallow Errors Silently

```typescript
// ❌ Bad
try {
  await operation();
} catch (error) {
  // Silent failure
}

// ✅ Good
try {
  await operation();
} catch (error) {
  logger.warn("Operation failed, using fallback", error as Error);
  return fallbackValue;
}
```

### 8. Use Error Boundaries for UI Errors

```typescript
// Catch render errors
<ErrorBoundary fallback={<ErrorFallback />}>
  <ComplexComponent />
</ErrorBoundary>
```

### 9. Test Error Scenarios

```typescript
describe("UserService", () => {
  it("handles network errors correctly", async () => {
    // Mock network failure
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    await expect(fetchUser("123")).rejects.toThrow();

    // Verify error was logged
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("fetch"),
      expect.any(Error),
      expect.objectContaining({ userId: "123" }),
      "UserService",
    );
  });
});
```

---

## See Also

- [Logging Guide](./logging-guide.md)
- [Logging Migration Guide](./logging-migration-guide.md)
- [Error Codes Reference](../shared/error-codes.ts)

---

**Version:** 2.0  
**Last Updated:** October 31, 2025
