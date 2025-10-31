/**
 * Tests for centralized error code system
 */

import { describe, it, expect } from "vitest";
import {
  ErrorCode,
  ErrorSeverity,
  ERROR_METADATA,
  createAppError,
  createNetworkError,
  createValidationError,
  createApiError,
  isAppError,
  getUserMessage,
  isRetryableError,
} from "@shared/error-codes";

describe("Error Codes", () => {
  describe("createAppError", () => {
    it("creates error with correct properties", () => {
      const error = createAppError(
        "Test error message",
        ErrorCode.INTERNAL_ERROR,
        { userId: "123" },
        "trace-123",
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Test error message");
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.context).toEqual({ userId: "123" });
      expect(error.traceId).toBe("trace-123");
      expect(error.retryable).toBe(true);
      expect(error.timestamp).toBeDefined();
      expect(error.userMessage).toBe(
        "An internal error occurred. Please try again later.",
      );
    });

    it("uses default error code when not provided", () => {
      const error = createAppError("Test error");

      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(error.statusCode).toBe(500);
    });

    it("works without optional parameters", () => {
      const error = createAppError("Simple error", ErrorCode.VALIDATION_ERROR);

      expect(error.context).toBeUndefined();
      expect(error.traceId).toBeUndefined();
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });
  });

  describe("createNetworkError", () => {
    it("creates network error with correct properties", () => {
      const error = createNetworkError(
        "/api/users",
        500,
        "Internal Server Error",
        "trace-456",
      );

      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.statusCode).toBe(0); // Network errors use 0
      expect(error.context).toEqual({
        url: "/api/users",
        status: 500,
        statusText: "Internal Server Error",
      });
      expect(error.traceId).toBe("trace-456");
      expect(error.retryable).toBe(true);
    });

    it("includes status in error message", () => {
      const error = createNetworkError("/api/users", 404, "Not Found");

      expect(error.message).toContain("Network request failed");
      expect(error.message).toContain("Not Found");
    });
  });

  describe("createValidationError", () => {
    it("creates validation error with correct properties", () => {
      const error = createValidationError(
        "email",
        "Invalid format",
        "trace-789",
      );

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.context).toEqual({
        field: "email",
        validationMessage: "Invalid format",
      });
      expect(error.retryable).toBe(false);
    });

    it("includes field and message in error message", () => {
      const error = createValidationError("password", "Too short");

      expect(error.message).toContain("password");
      expect(error.message).toContain("Too short");
    });
  });

  describe("createApiError", () => {
    it("creates API error with correct properties", () => {
      const responseBody = { error: "Validation failed" };
      const error = createApiError(
        "POST",
        "/api/users",
        400,
        "Bad Request",
        responseBody,
        "trace-abc",
      );

      expect(error.code).toBe(ErrorCode.API_REQUEST_FAILED);
      expect(error.statusCode).toBe(500); // API errors use 500 by default
      expect(error.context).toEqual({
        method: "POST",
        url: "/api/users",
        status: 400,
        statusText: "Bad Request",
        responseBody,
      });
      expect(error.traceId).toBe("trace-abc");
    });

    it("includes method and URL in error message", () => {
      const error = createApiError("GET", "/api/data", 500, "Server Error");

      expect(error.message).toContain("GET");
      expect(error.message).toContain("/api/data");
    });
  });

  describe("isAppError", () => {
    it("returns true for AppError", () => {
      const error = createAppError("Test", ErrorCode.INTERNAL_ERROR);

      expect(isAppError(error)).toBe(true);
    });

    it("returns false for regular Error", () => {
      const error = new Error("Regular error");

      expect(isAppError(error)).toBe(false);
    });

    it("returns false for non-error objects", () => {
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError({})).toBe(false);
      expect(isAppError("string")).toBe(false);
    });

    it("returns false for objects missing required properties", () => {
      const partial = {
        code: ErrorCode.INTERNAL_ERROR,
        // missing other required properties
      };

      expect(isAppError(partial)).toBe(false);
    });
  });

  describe("getUserMessage", () => {
    it("returns userMessage for AppError", () => {
      const error = createAppError("Technical message", ErrorCode.UNAUTHORIZED);

      const message = getUserMessage(error);

      expect(message).toBe(
        "You are not authorized. Please log in and try again.",
      );
      expect(message).not.toBe("Technical message");
    });

    it("returns error message for regular Error", () => {
      const error = new Error("Regular error message");

      expect(getUserMessage(error)).toBe("Regular error message");
    });

    it("returns default message for non-error values", () => {
      expect(getUserMessage(null)).toBe(
        "An unexpected error occurred. Please try again.",
      );
      expect(getUserMessage(undefined)).toBe(
        "An unexpected error occurred. Please try again.",
      );
      expect(getUserMessage("string")).toBe(
        "An unexpected error occurred. Please try again.",
      );
    });
  });

  describe("isRetryableError", () => {
    it("returns true for retryable AppError", () => {
      const error = createAppError("Test", ErrorCode.NETWORK_ERROR);

      expect(isRetryableError(error)).toBe(true);
    });

    it("returns false for non-retryable AppError", () => {
      const error = createAppError("Test", ErrorCode.VALIDATION_ERROR);

      expect(isRetryableError(error)).toBe(false);
    });

    it("returns true for errors with 'network' in message", () => {
      const error = new Error("Network connection failed");

      expect(isRetryableError(error)).toBe(true);
    });

    it("returns false for regular errors", () => {
      const error = new Error("Generic error");

      expect(isRetryableError(error)).toBe(false);
    });

    it("returns false for non-error values", () => {
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
      expect(isRetryableError("string")).toBe(false);
    });
  });

  describe("ERROR_METADATA", () => {
    it("has metadata for all error codes", () => {
      const errorCodes = Object.values(ErrorCode);

      errorCodes.forEach((code) => {
        expect(ERROR_METADATA[code]).toBeDefined();
        expect(ERROR_METADATA[code].statusCode).toBeTypeOf("number");
        expect(ERROR_METADATA[code].userMessage).toBeTypeOf("string");
        expect(ERROR_METADATA[code].severity).toBeDefined();
        expect(ERROR_METADATA[code].retryable).toBeTypeOf("boolean");
      });
    });

    it("uses consistent status codes for categories", () => {
      // Network errors should use 0 or error codes
      expect(ERROR_METADATA[ErrorCode.NETWORK_ERROR].statusCode).toBe(0);

      // Validation errors should use 400
      expect(ERROR_METADATA[ErrorCode.VALIDATION_ERROR].statusCode).toBe(400);

      // Auth errors should use 401 or 403
      expect([401, 403]).toContain(
        ERROR_METADATA[ErrorCode.UNAUTHORIZED].statusCode,
      );

      // System errors should use 500
      expect(ERROR_METADATA[ErrorCode.INTERNAL_ERROR].statusCode).toBe(500);
    });

    it("has non-empty user messages", () => {
      Object.values(ERROR_METADATA).forEach((metadata) => {
        expect(metadata.userMessage.length).toBeGreaterThan(0);
        expect(metadata.userMessage).not.toBe("");
      });
    });
  });

  describe("Error severity levels", () => {
    it("assigns appropriate severity to errors", () => {
      // Critical errors
      expect(ERROR_METADATA[ErrorCode.DATABASE_ERROR].severity).toBe(
        ErrorSeverity.CRITICAL,
      );
      expect(ERROR_METADATA[ErrorCode.CONFIGURATION_ERROR].severity).toBe(
        ErrorSeverity.CRITICAL,
      );

      // High severity errors
      expect(ERROR_METADATA[ErrorCode.INTERNAL_ERROR].severity).toBe(
        ErrorSeverity.HIGH,
      );
      expect(ERROR_METADATA[ErrorCode.SERVICE_UNAVAILABLE].severity).toBe(
        ErrorSeverity.HIGH,
      );

      // Medium severity errors
      expect(ERROR_METADATA[ErrorCode.NETWORK_ERROR].severity).toBe(
        ErrorSeverity.MEDIUM,
      );
      expect(ERROR_METADATA[ErrorCode.UNAUTHORIZED].severity).toBe(
        ErrorSeverity.MEDIUM,
      );

      // Low severity errors
      expect(ERROR_METADATA[ErrorCode.VALIDATION_ERROR].severity).toBe(
        ErrorSeverity.LOW,
      );
      expect(ERROR_METADATA[ErrorCode.RESOURCE_NOT_FOUND].severity).toBe(
        ErrorSeverity.LOW,
      );
    });
  });

  describe("Retryable errors", () => {
    it("marks network errors as retryable", () => {
      expect(ERROR_METADATA[ErrorCode.NETWORK_ERROR].retryable).toBe(true);
      expect(ERROR_METADATA[ErrorCode.TIMEOUT_ERROR].retryable).toBe(true);
      expect(ERROR_METADATA[ErrorCode.CONNECTION_FAILED].retryable).toBe(true);
    });

    it("marks validation errors as non-retryable", () => {
      expect(ERROR_METADATA[ErrorCode.VALIDATION_ERROR].retryable).toBe(false);
      expect(ERROR_METADATA[ErrorCode.INVALID_INPUT].retryable).toBe(false);
    });

    it("marks auth errors as non-retryable", () => {
      expect(ERROR_METADATA[ErrorCode.UNAUTHORIZED].retryable).toBe(false);
      expect(ERROR_METADATA[ErrorCode.FORBIDDEN].retryable).toBe(false);
      expect(ERROR_METADATA[ErrorCode.INVALID_CREDENTIALS].retryable).toBe(
        false,
      );
    });

    it("marks system errors as retryable", () => {
      expect(ERROR_METADATA[ErrorCode.INTERNAL_ERROR].retryable).toBe(true);
      expect(ERROR_METADATA[ErrorCode.SERVICE_UNAVAILABLE].retryable).toBe(
        true,
      );
    });
  });
});
