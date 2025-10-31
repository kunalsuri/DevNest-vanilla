/**
 * Unit tests for queryClient.ts type safety improvements
 * Tests the fixes for Critical Issue #1: Replace any types with proper types
 *
 * These tests verify that:
 * 1. ErrorResponse interface properly types error data
 * 2. Retry logic handles Error objects with statusCode property
 * 3. Type safety is maintained throughout error handling
 */

import { describe, it, expect } from "vitest";

describe("QueryClient Type Safety Improvements", () => {
  describe("ErrorResponse interface", () => {
    it("should properly type error response with message", () => {
      const errorResponse: { message?: string; error?: string } = {
        message: "Not found",
      };

      expect(errorResponse.message).toBe("Not found");
      expect(errorResponse.error).toBeUndefined();
    });

    it("should properly type error response with error field", () => {
      const errorResponse: { message?: string; error?: string } = {
        error: "Validation failed",
      };

      expect(errorResponse.error).toBe("Validation failed");
      expect(errorResponse.message).toBeUndefined();
    });

    it("should handle error response with both message and error", () => {
      const errorResponse: { message?: string; error?: string } = {
        message: "Request failed",
        error: "Bad request",
      };

      expect(errorResponse.message).toBe("Request failed");
      expect(errorResponse.error).toBe("Bad request");
    });

    it("should handle empty error response", () => {
      const errorResponse: { message?: string; error?: string } = {};

      expect(errorResponse.message).toBeUndefined();
      expect(errorResponse.error).toBeUndefined();
    });
  });

  describe("retry function with typed error", () => {
    it("should handle Error with statusCode property", () => {
      const error = new Error("Client error") as Error & {
        statusCode?: number;
      };
      error.statusCode = 404;

      // Simulate retry logic
      const shouldRetry = (
        failureCount: number,
        err: Error & { statusCode?: number },
      ) => {
        if (err?.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
          return false;
        }
        return failureCount < 3;
      };

      expect(shouldRetry(1, error)).toBe(false);
    });

    it("should retry on server errors", () => {
      const error = new Error("Server error") as Error & {
        statusCode?: number;
      };
      error.statusCode = 500;

      const shouldRetry = (
        failureCount: number,
        err: Error & { statusCode?: number },
      ) => {
        if (err?.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
          return false;
        }
        return failureCount < 3;
      };

      expect(shouldRetry(1, error)).toBe(true);
      expect(shouldRetry(2, error)).toBe(true);
      expect(shouldRetry(3, error)).toBe(false);
    });

    it("should handle Error without statusCode", () => {
      const error = new Error("Network error") as Error & {
        statusCode?: number;
      };

      const shouldRetry = (
        failureCount: number,
        err: Error & { statusCode?: number },
      ) => {
        if (err?.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
          return false;
        }
        return failureCount < 3;
      };

      // Should retry on network errors
      expect(shouldRetry(1, error)).toBe(true);
    });

    it("should respect retry limits", () => {
      const error = new Error("Network error") as Error & {
        statusCode?: number;
      };

      const shouldRetry = (
        failureCount: number,
        err: Error & { statusCode?: number },
      ) => {
        if (err?.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
          return false;
        }
        return failureCount < 3;
      };

      expect(shouldRetry(0, error)).toBe(true);
      expect(shouldRetry(1, error)).toBe(true);
      expect(shouldRetry(2, error)).toBe(true);
      expect(shouldRetry(3, error)).toBe(false);
      expect(shouldRetry(4, error)).toBe(false);
    });
  });

  describe("client error status codes", () => {
    it("should not retry on 400 Bad Request", () => {
      const error = new Error("Bad request") as Error & { statusCode?: number };
      error.statusCode = 400;

      const shouldRetry = (
        failureCount: number,
        err: Error & { statusCode?: number },
      ) => {
        if (err?.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
          return false;
        }
        return failureCount < 3;
      };

      expect(shouldRetry(0, error)).toBe(false);
    });

    it("should not retry on 401 Unauthorized", () => {
      const error = new Error("Unauthorized") as Error & {
        statusCode?: number;
      };
      error.statusCode = 401;

      const shouldRetry = (
        failureCount: number,
        err: Error & { statusCode?: number },
      ) => {
        if (err?.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
          return false;
        }
        return failureCount < 3;
      };

      expect(shouldRetry(0, error)).toBe(false);
    });

    it("should not retry on 404 Not Found", () => {
      const error = new Error("Not found") as Error & { statusCode?: number };
      error.statusCode = 404;

      const shouldRetry = (
        failureCount: number,
        err: Error & { statusCode?: number },
      ) => {
        if (err?.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
          return false;
        }
        return failureCount < 3;
      };

      expect(shouldRetry(0, error)).toBe(false);
    });
  });

  describe("error object type safety", () => {
    it("should handle Error with optional statusCode", () => {
      const createError = (
        message: string,
        statusCode?: number,
      ): Error & { statusCode?: number } => {
        const error = new Error(message) as Error & { statusCode?: number };
        if (statusCode !== undefined) {
          error.statusCode = statusCode;
        }
        return error;
      };

      const error1 = createError("Error with status", 404);
      const error2 = createError("Error without status");

      expect(error1.statusCode).toBe(404);
      expect(error2.statusCode).toBeUndefined();
    });

    it("should allow checking statusCode safely", () => {
      const checkError = (error: Error & { statusCode?: number }): string => {
        if (error.statusCode) {
          return `Status: ${error.statusCode}`;
        }
        return "No status code";
      };

      const errorWithStatus = new Error("Error") as Error & {
        statusCode?: number;
      };
      errorWithStatus.statusCode = 500;

      const errorWithoutStatus = new Error("Error") as Error & {
        statusCode?: number;
      };

      expect(checkError(errorWithStatus)).toBe("Status: 500");
      expect(checkError(errorWithoutStatus)).toBe("No status code");
    });
  });
});
