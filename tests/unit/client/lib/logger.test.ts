/**
 * Unit tests for logger.ts type safety improvements
 * Tests the fixes for Critical Issue #1: Replace any types with proper types
 *
 * These tests verify that:
 * 1. Metadata accepts Record<string, unknown> instead of Record<string, any>
 * 2. Logger methods compile with strict TypeScript type checking
 * 3. Error objects with extended properties are handled correctly
 */

import { describe, it, expect } from "vitest";
import { logger } from "../../../../client/src/lib/logger";

describe("Logger Type Safety Improvements", () => {
  describe("metadata parameter type safety", () => {
    it("should accept Record<string, unknown> metadata in logging methods", () => {
      // These should compile without type errors due to unknown type (not any)
      expect(() => {
        logger.info("Test message", { key: "value" });
        logger.warn("Warning message", { count: 42 });
        logger.error("Error message", new Error("test"), { context: "test" });
        logger.debug("Debug message", { nested: { data: true } });
      }).not.toThrow();
    });

    it("should handle undefined metadata", () => {
      expect(() => {
        logger.info("Message without metadata");
        logger.warn("Warning without metadata");
      }).not.toThrow();
    });

    it("should handle complex metadata structures with type safety", () => {
      const complexMetadata: Record<string, unknown> = {
        request: {
          method: "POST",
          url: "/api/users",
          headers: { "content-type": "application/json" },
        },
        response: {
          status: 200,
          body: { success: true },
        },
        duration: 123,
        nullValue: null,
        undefinedValue: undefined,
      };

      expect(() => {
        logger.info("Complex metadata test", complexMetadata);
      }).not.toThrow();
    });

    it("should accept various unknown types in metadata", () => {
      const metadata: Record<string, unknown> = {
        stringValue: "test",
        numberValue: 42,
        booleanValue: true,
        objectValue: { nested: "data" },
        arrayValue: [1, 2, 3],
        nullValue: null,
        undefinedValue: undefined,
      };

      expect(() => {
        logger.debug("Type safety test", metadata);
      }).not.toThrow();
    });
  });

  describe("API logging methods with typed metadata", () => {
    it("should log API request with properly typed metadata", () => {
      const metadata: Record<string, unknown> = {
        requestId: "req123",
        traceId: "trace456",
        hasData: true,
        dataSize: 1024,
      };

      expect(() => {
        logger.logApiRequest("POST", "/api/users", metadata);
      }).not.toThrow();
    });

    it("should log API response with typed metadata", () => {
      const metadata: Record<string, unknown> = {
        requestId: "req123",
        traceId: "trace456",
        responseSize: "2048",
      };

      expect(() => {
        logger.logApiResponse("POST", "/api/users", 200, 150, metadata);
      }).not.toThrow();
    });

    it("should log API error with Error object and metadata", () => {
      const error = new Error("API Error");
      const metadata: Record<string, unknown> = {
        requestId: "req123",
        traceId: "trace456",
        duration: 100,
        hasData: true,
      };

      expect(() => {
        logger.logApiError("POST", "/api/users", error, metadata);
      }).not.toThrow();
    });
  });

  describe("error logging with extended Error types", () => {
    it("should handle Error objects with code property", () => {
      const errorWithCode = new Error("Test error") as Error & {
        code?: string;
      };
      errorWithCode.code = "ERR_NETWORK";

      expect(() => {
        logger.error("Error with code", errorWithCode, { context: "test" });
      }).not.toThrow();
    });

    it("should handle standard Error objects without code", () => {
      const standardError = new Error("Standard error");

      expect(() => {
        logger.error("Standard error", standardError, { context: "test" });
      }).not.toThrow();
    });

    it("should handle Error objects in metadata", () => {
      const originalError = new Error("Original error");

      expect(() => {
        logger.error("Wrapper error", new Error("Wrapper"), {
          originalError,
          additionalContext: "test",
        });
      }).not.toThrow();
    });
  });

  describe("trace and request ID generation", () => {
    it("should generate valid requestId", () => {
      const requestId = logger.generateRequestId();

      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe("string");
      expect(requestId.length).toBeGreaterThan(0);
    });

    it("should generate valid traceId", () => {
      const traceId = logger.generateTraceId();

      expect(traceId).toBeDefined();
      expect(typeof traceId).toBe("string");
      expect(traceId.length).toBeGreaterThan(0);
    });

    it("should generate unique IDs", () => {
      const id1 = logger.generateRequestId();
      const id2 = logger.generateRequestId();

      expect(id1).not.toBe(id2);
    });
  });
});
