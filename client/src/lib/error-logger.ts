// Error types for better error handling
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
}

export interface ErrorLogEntry {
  timestamp: string;
  level: "error" | "warn" | "info";
  message: string;
  error?: AppError;
  context?: Record<string, any>;
  userId?: string;
  url?: string;
  userAgent?: string;
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === "development";

  // Log error with context
  logError(error: AppError | Error, context?: Record<string, any>): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: "error",
      message: error.message,
      error: error as AppError,
      context,
      url: window?.location?.href,
      userAgent: navigator?.userAgent,
    };

    // Console logging for development
    if (this.isDevelopment) {
      console.group(`🚨 Error: ${error.message}`);
      console.error("Error:", error);
      if (context) {
        console.log("Context:", context);
      }
      console.groupEnd();
    }

    // Send to external logging service in production
    this.sendToLoggingService(logEntry);
  }

  // Log warning
  logWarning(message: string, context?: Record<string, any>): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      context,
      url: window?.location?.href,
    };

    if (this.isDevelopment) {
      console.warn(`⚠️ Warning: ${message}`, context);
    }

    this.sendToLoggingService(logEntry);
  }

  // Log API errors specifically
  logApiError(url: string, method: string, status: number, error: Error): void {
    this.logError(error, {
      type: "API_ERROR",
      url,
      method,
      status,
    });
  }

  // Log React Query errors
  logQueryError(queryKey: unknown[], error: Error): void {
    this.logError(error, {
      type: "QUERY_ERROR",
      queryKey,
    });
  }

  // Log user actions for debugging
  logUserAction(action: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.log(`👤 User Action: ${action}`, context);
    }
  }

  private sendToLoggingService(logEntry: ErrorLogEntry): void {
    // In production, send to external service
    // Examples: Sentry, LogRocket, DataDog, etc.

    if (!this.isDevelopment) {
      // Example implementation:
      // fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry),
      //   credentials: 'include',
      // }).catch(err => {
      //   // Fail silently to avoid infinite error loops
      //   console.error('Failed to send log:', err);
      // });
    }
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Helper functions for common error scenarios
export function createAppError(
  message: string,
  code?: string,
  statusCode?: number,
  context?: Record<string, any>,
): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.statusCode = statusCode;
  error.context = context;
  return error;
}

// Network error helper
export function createNetworkError(
  url: string,
  status: number,
  statusText: string,
): AppError {
  return createAppError(
    `Network request failed: ${status} ${statusText}`,
    "NETWORK_ERROR",
    status,
    { url, status, statusText },
  );
}

// Validation error helper
export function createValidationError(
  field: string,
  message: string,
): AppError {
  return createAppError(
    `Validation failed for ${field}: ${message}`,
    "VALIDATION_ERROR",
    400,
    { field },
  );
}
