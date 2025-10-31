/**
 * @deprecated This module is deprecated and will be removed in a future version.
 * Please use the comprehensive logger from @/lib/logger.ts and error codes from @/shared/error-codes.ts instead.
 *
 * Migration guide:
 * - errorLogger.logError() -> logger.error()
 * - errorLogger.logWarning() -> logger.warn()
 * - errorLogger.logApiError() -> logger.logApiError()
 * - createAppError() -> import from @/shared/error-codes
 * - createNetworkError() -> import from @/shared/error-codes
 * - createValidationError() -> import from @/shared/error-codes
 */

import { logger } from "./logger";

// Re-export new types and functions for backward compatibility
export type { AppError, ErrorMetadata } from "@shared/error-codes";

export {
  ErrorCode,
  ErrorSeverity,
  createAppError,
  createNetworkError,
  createValidationError,
  isAppError,
  getUserMessage,
  isRetryableError,
} from "@shared/error-codes";

// Legacy AppError interface for backward compatibility
// @deprecated Use AppError from @/shared/error-codes instead
export interface LegacyAppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
}

export interface ErrorLogEntry {
  timestamp: string;
  level: "error" | "warn" | "info";
  message: string;
  error?: LegacyAppError;
  context?: Record<string, any>;
  userId?: string;
  url?: string;
  userAgent?: string;
}

/**
 * @deprecated Use logger from @/lib/logger.ts instead
 */
class ErrorLogger {
  private readonly isDevelopment = import.meta.env?.MODE === "development";

  /**
   * @deprecated Use logger.error() from @/lib/logger.ts instead
   */
  logError(error: LegacyAppError | Error, context?: Record<string, any>): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: "error",
      message: error.message,
      error: error as LegacyAppError,
      context,
      url: globalThis.window?.location?.href,
      userAgent: navigator?.userAgent,
    };

    // Console logging for development
    if (this.isDevelopment) {
      logger.error(`🚨 Error: ${error.message}`, error, context);
    }

    // Send to external logging service in production
    this.sendToLoggingService(logEntry);
  }

  /**
   * @deprecated Use logger.warn() from @/lib/logger.ts instead
   */
  logWarning(message: string, context?: Record<string, any>): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      context,
      url: globalThis.window?.location?.href,
    };

    if (this.isDevelopment) {
      console.warn(`⚠️ Warning: ${message}`, context);
    }

    this.sendToLoggingService(logEntry);
  }

  /**
   * @deprecated Use logger.logApiError() from @/lib/logger.ts instead
   */
  logApiError(url: string, method: string, status: number, error: Error): void {
    this.logError(error, {
      type: "API_ERROR",
      url,
      method,
      status,
    });
  }

  /**
   * @deprecated Use logger.error() from @/lib/logger.ts instead
   */
  logQueryError(queryKey: unknown[], error: Error): void {
    this.logError(error, {
      type: "QUERY_ERROR",
      queryKey,
    });
  }

  /**
   * @deprecated Use logger.logUserAction() from @/lib/logger.ts instead
   */
  logUserAction(action: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      logger.debug(`👤 User Action: ${action}`, context);
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
/**
 * @deprecated Use logger from @/lib/logger.ts instead
 */
export const errorLogger = new ErrorLogger();
