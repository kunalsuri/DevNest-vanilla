/**
 * Centralized Error Code Registry
 *
 * Provides type-safe error codes and standardized error metadata
 * across the entire application.
 */

// Error codes organized by category
export enum ErrorCode {
  // Network Errors (1xxx series)
  NETWORK_ERROR = "NETWORK_ERROR",
  API_REQUEST_FAILED = "API_REQUEST_FAILED",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  CONNECTION_FAILED = "CONNECTION_FAILED",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Validation Errors (2xxx series)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",
  INVALID_EMAIL = "INVALID_EMAIL",
  INVALID_PASSWORD = "INVALID_PASSWORD",

  // Authentication Errors (3xxx series)
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Resource Errors (4xxx series)
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE",
  RESOURCE_CONFLICT = "RESOURCE_CONFLICT",
  RESOURCE_LOCKED = "RESOURCE_LOCKED",

  // Business Logic Errors (5xxx series)
  OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED",
  INVALID_STATE = "INVALID_STATE",
  PREREQUISITE_FAILED = "PREREQUISITE_FAILED",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",

  // System Errors (9xxx series)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// Severity levels for errors
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Error metadata interface
export interface ErrorMetadata {
  statusCode: number;
  userMessage: string;
  severity: ErrorSeverity;
  retryable: boolean;
  documentationUrl?: string;
}

// Comprehensive error metadata registry
export const ERROR_METADATA: Record<ErrorCode, ErrorMetadata> = {
  // Network Errors
  [ErrorCode.NETWORK_ERROR]: {
    statusCode: 0,
    userMessage:
      "Network connection failed. Please check your internet connection and try again.",
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
  },
  [ErrorCode.API_REQUEST_FAILED]: {
    statusCode: 500,
    userMessage: "The request failed. Please try again later.",
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
  },
  [ErrorCode.TIMEOUT_ERROR]: {
    statusCode: 408,
    userMessage: "The request timed out. Please try again.",
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
  },
  [ErrorCode.CONNECTION_FAILED]: {
    statusCode: 0,
    userMessage: "Unable to connect to the server. Please try again later.",
    severity: ErrorSeverity.HIGH,
    retryable: true,
  },
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    statusCode: 429,
    userMessage: "Too many requests. Please wait a moment and try again.",
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
  },

  // Validation Errors
  [ErrorCode.VALIDATION_ERROR]: {
    statusCode: 400,
    userMessage:
      "The provided information is invalid. Please check your input.",
    severity: ErrorSeverity.LOW,
    retryable: false,
  },
  [ErrorCode.INVALID_INPUT]: {
    statusCode: 400,
    userMessage: "Invalid input provided. Please correct and try again.",
    severity: ErrorSeverity.LOW,
    retryable: false,
  },
  [ErrorCode.MISSING_REQUIRED_FIELD]: {
    statusCode: 400,
    userMessage:
      "Required field is missing. Please fill in all required fields.",
    severity: ErrorSeverity.LOW,
    retryable: false,
  },
  [ErrorCode.INVALID_FORMAT]: {
    statusCode: 400,
    userMessage: "Invalid format. Please check the format and try again.",
    severity: ErrorSeverity.LOW,
    retryable: false,
  },
  [ErrorCode.INVALID_EMAIL]: {
    statusCode: 400,
    userMessage: "Invalid email address. Please provide a valid email.",
    severity: ErrorSeverity.LOW,
    retryable: false,
  },
  [ErrorCode.INVALID_PASSWORD]: {
    statusCode: 400,
    userMessage: "Invalid password. Please check your password requirements.",
    severity: ErrorSeverity.LOW,
    retryable: false,
  },

  // Authentication Errors
  [ErrorCode.UNAUTHORIZED]: {
    statusCode: 401,
    userMessage: "You are not authorized. Please log in and try again.",
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
  },
  [ErrorCode.FORBIDDEN]: {
    statusCode: 403,
    userMessage: "You don't have permission to perform this action.",
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
  },
  [ErrorCode.TOKEN_EXPIRED]: {
    statusCode: 401,
    userMessage: "Your session has expired. Please log in again.",
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
  },
  [ErrorCode.TOKEN_INVALID]: {
    statusCode: 401,
    userMessage: "Invalid authentication token. Please log in again.",
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
  },
  [ErrorCode.SESSION_EXPIRED]: {
    statusCode: 401,
    userMessage: "Your session has expired. Please log in again.",
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
  },
  [ErrorCode.INVALID_CREDENTIALS]: {
    statusCode: 401,
    userMessage: "Invalid username or password. Please try again.",
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
  },
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: {
    statusCode: 403,
    userMessage: "You don't have sufficient permissions for this action.",
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
  },

  // Resource Errors
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    statusCode: 404,
    userMessage: "The requested resource was not found.",
    severity: ErrorSeverity.LOW,
    retryable: false,
  },
  [ErrorCode.DUPLICATE_RESOURCE]: {
    statusCode: 409,
    userMessage: "A resource with this identifier already exists.",
    severity: ErrorSeverity.LOW,
    retryable: false,
  },
  [ErrorCode.RESOURCE_CONFLICT]: {
    statusCode: 409,
    userMessage:
      "Resource conflict. The resource has been modified by another user.",
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
  },
  [ErrorCode.RESOURCE_LOCKED]: {
    statusCode: 423,
    userMessage: "This resource is currently locked. Please try again later.",
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
  },

  // Business Logic Errors
  [ErrorCode.OPERATION_NOT_ALLOWED]: {
    statusCode: 405,
    userMessage: "This operation is not allowed.",
    severity: ErrorSeverity.LOW,
    retryable: false,
  },
  [ErrorCode.INVALID_STATE]: {
    statusCode: 400,
    userMessage: "The operation cannot be performed in the current state.",
    severity: ErrorSeverity.LOW,
    retryable: false,
  },
  [ErrorCode.PREREQUISITE_FAILED]: {
    statusCode: 412,
    userMessage: "Prerequisites for this operation are not met.",
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
  },
  [ErrorCode.QUOTA_EXCEEDED]: {
    statusCode: 429,
    userMessage: "You have exceeded your quota. Please upgrade or wait.",
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
  },

  // System Errors
  [ErrorCode.INTERNAL_ERROR]: {
    statusCode: 500,
    userMessage: "An internal error occurred. Please try again later.",
    severity: ErrorSeverity.HIGH,
    retryable: true,
  },
  [ErrorCode.DATABASE_ERROR]: {
    statusCode: 500,
    userMessage: "Database error. Please try again later.",
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    statusCode: 503,
    userMessage: "Service is temporarily unavailable. Please try again later.",
    severity: ErrorSeverity.HIGH,
    retryable: true,
  },
  [ErrorCode.CONFIGURATION_ERROR]: {
    statusCode: 500,
    userMessage: "Configuration error. Please contact support.",
    severity: ErrorSeverity.CRITICAL,
    retryable: false,
  },
  [ErrorCode.UNKNOWN_ERROR]: {
    statusCode: 500,
    userMessage: "An unexpected error occurred. Please try again.",
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
  },
};

// Enhanced AppError interface
export interface AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  userMessage: string;
  retryable: boolean;
  timestamp: string;
  traceId?: string;
}

/**
 * Create a standardized application error with proper metadata
 */
export function createAppError(
  message: string,
  code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
  context?: Record<string, any>,
  traceId?: string,
): AppError {
  const metadata = ERROR_METADATA[code];

  const error = new Error(message) as AppError;
  error.code = code;
  error.statusCode = metadata.statusCode;
  error.severity = metadata.severity;
  error.userMessage = metadata.userMessage;
  error.retryable = metadata.retryable;
  error.context = context;
  error.timestamp = new Date().toISOString();
  error.traceId = traceId;

  return error;
}

/**
 * Create a network error
 */
export function createNetworkError(
  url: string,
  status: number,
  statusText: string,
  traceId?: string,
): AppError {
  return createAppError(
    `Network request failed: ${statusText}`,
    ErrorCode.NETWORK_ERROR,
    {
      url,
      status,
      statusText,
    },
    traceId,
  );
}

/**
 * Create a validation error
 */
export function createValidationError(
  field: string,
  message: string,
  traceId?: string,
): AppError {
  return createAppError(
    `Validation failed for field '${field}': ${message}`,
    ErrorCode.VALIDATION_ERROR,
    {
      field,
      validationMessage: message,
    },
    traceId,
  );
}

/**
 * Create an API error from a response
 */
export function createApiError(
  method: string,
  url: string,
  status: number,
  statusText: string,
  responseBody?: any,
  traceId?: string,
): AppError {
  return createAppError(
    `API request failed: ${method} ${url} - ${statusText}`,
    ErrorCode.API_REQUEST_FAILED,
    {
      method,
      url,
      status,
      statusText,
      responseBody,
    },
    traceId,
  );
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "statusCode" in error &&
    "severity" in error &&
    "userMessage" in error
  );
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.retryable;
  }
  // By default, network errors are retryable (case-insensitive check)
  if (
    error instanceof Error &&
    error.message.toLowerCase().includes("network")
  ) {
    return true;
  }
  return false;
}
