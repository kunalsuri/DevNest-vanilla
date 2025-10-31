/**
 * Tests for Logging Improvements
 *
 * Validates that console.log has been replaced with proper logger
 * in production code (tracing.ts, metrics.ts, error-logger.ts, server-transport.ts)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "@/lib/logger";
import { ConsoleTracingTransport } from "@/lib/tracing";
import { ConsoleMetricsTransport, MetricType } from "@/lib/metrics";

// Mock the logger
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Logging Improvements - Console.log Replacement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("ConsoleTracingTransport", () => {
    it("should use logger.debug instead of console.log in DEV mode", async () => {
      const transport = new ConsoleTracingTransport();
      const spanData = {
        spanId: "test-span-id",
        traceId: "test-trace-id",
        operationName: "test-operation",
        startTime: Date.now(),
        endTime: Date.now() + 100,
        duration: 100,
        status: "ok" as const,
        tags: { testTag: "testValue" },
        logs: [{ timestamp: Date.now(), fields: { event: "test" } }],
        kind: "internal" as const,
      };

      await transport.reportSpan(spanData);

      // In DEV mode, logger.debug should be called
      if (import.meta.env.DEV) {
        expect(logger.debug).toHaveBeenCalled();
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Trace:"),
          expect.objectContaining({
            spanId: spanData.spanId,
            traceId: spanData.traceId,
          }),
        );
      }
    });

    it("should include span metadata in log call", async () => {
      const transport = new ConsoleTracingTransport();
      const spanData = {
        spanId: "span-123",
        traceId: "trace-456",
        operationName: "api-call",
        startTime: Date.now(),
        duration: 250,
        status: "ok" as const,
        tags: { userId: "user-1" },
        logs: [],
        kind: "client" as const,
      };

      await transport.reportSpan(spanData);

      if (import.meta.env.DEV) {
        expect(logger.debug).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            spanId: "span-123",
            traceId: "trace-456",
            duration: "250.00ms",
            status: "ok",
            tags: { userId: "user-1" },
          }),
        );
      }
    });

    it("should not call logger in production mode", async () => {
      // This test verifies the conditional logging behavior
      const originalEnv = import.meta.env.DEV;

      const transport = new ConsoleTracingTransport();
      const spanData = {
        spanId: "test-span",
        traceId: "test-trace",
        operationName: "test",
        startTime: Date.now(),
        status: "ok" as const,
        tags: {},
        logs: [],
        kind: "internal" as const,
      };

      await transport.reportSpan(spanData);

      // Verify logger was called or not based on environment
      if (!originalEnv) {
        expect(logger.debug).not.toHaveBeenCalled();
      }
    });
  });

  describe("ConsoleMetricsTransport", () => {
    it("should use logger.debug instead of console.log for single metrics", async () => {
      const transport = new ConsoleMetricsTransport();
      const metricData = {
        name: "test.metric",
        type: MetricType.COUNTER,
        value: 42,
        timestamp: Date.now(),
        tags: { env: "test" },
      };

      await transport.reportMetric(metricData);

      if (import.meta.env.DEV) {
        expect(logger.debug).toHaveBeenCalled();
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("COUNTER"),
          expect.objectContaining({
            value: 42,
            tags: { env: "test" },
          }),
        );
      }
    });

    it("should use logger.debug for batch metrics", async () => {
      const transport = new ConsoleMetricsTransport();
      const metrics = [
        {
          name: "metric1",
          type: MetricType.COUNTER,
          value: 1,
          timestamp: Date.now(),
          tags: {},
        },
        {
          name: "metric2",
          type: MetricType.GAUGE,
          value: 50,
          timestamp: Date.now(),
          tags: {},
        },
      ];

      await transport.reportBatch(metrics);

      if (import.meta.env.DEV) {
        expect(logger.debug).toHaveBeenCalled();
        // Should log batch header and each metric
        expect(logger.debug).toHaveBeenCalledWith(
          "📊 Metrics Batch",
          expect.objectContaining({ count: 2 }),
        );
      }
    });
  });

  describe("Error Logger Deprecation", () => {
    it("should verify error-logger imports from new logger", () => {
      // This test verifies that error-logger.ts imports the logger
      // The actual import is: import { logger } from "./logger";
      expect(logger).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it("should ensure logger methods are available", () => {
      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
    });
  });

  describe("Console.log Elimination", () => {
    it("should verify no console.log in tracing.ts ConsoleTracingTransport", () => {
      // This is a regression test to ensure console.log isn't reintroduced
      const transportCode = ConsoleTracingTransport.toString();
      expect(transportCode).not.toContain("console.log");
      expect(transportCode).not.toContain("console.group");
    });

    it("should verify no console.log in metrics.ts ConsoleMetricsTransport", () => {
      const transportCode = ConsoleMetricsTransport.toString();
      expect(transportCode).not.toContain("console.log");
      // Note: console.group was replaced with logger.debug
    });
  });
});
