/**
 * Comprehensive Tracing System for React + TypeScript Applications
 *
 * Features:
 * - OpenTelemetry-compatible tracing
 * - Component lifecycle instrumentation
 * - API call tracing with parent-child relationships
 * - Performance timing and metadata
 * - Custom span creation and management
 * - Integration with logging and metrics systems
 */

import { nanoid } from "nanoid";
import { logger } from "./logger";

// Trace and span interfaces
export interface TraceContext {
  traceId: string;
  parentSpanId?: string;
  baggage?: Record<string, any>;
}

export interface SpanData {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: SpanStatus;
  tags: Record<string, any>;
  logs: SpanLog[];
  component?: string;
  kind: SpanKind;
}

export interface SpanLog {
  timestamp: number;
  fields: Record<string, any>;
}

export enum SpanStatus {
  OK = "ok",
  ERROR = "error",
  TIMEOUT = "timeout",
  CANCELLED = "cancelled",
}

export enum SpanKind {
  CLIENT = "client",
  SERVER = "server",
  PRODUCER = "producer",
  CONSUMER = "consumer",
  INTERNAL = "internal",
}

// Active trace context (similar to OpenTelemetry's context)
const activeTraceContext: TraceContext | null = null;
const spanStack: Span[] = [];

// Span class for managing individual traces
export class Span {
  private data: SpanData;
  private children: Span[] = [];
  private finished = false;

  constructor(
    operationName: string,
    traceContext?: TraceContext,
    kind: SpanKind = SpanKind.INTERNAL,
  ) {
    const traceId = traceContext?.traceId || nanoid();
    const parentSpanId =
      traceContext?.parentSpanId ||
      spanStack[spanStack.length - 1]?.getSpanId();

    this.data = {
      spanId: nanoid(),
      traceId,
      parentSpanId,
      operationName,
      startTime: performance.now(),
      status: SpanStatus.OK,
      tags: {},
      logs: [],
      kind,
    };

    // Set baggage from parent context
    if (traceContext?.baggage) {
      this.data.tags = { ...this.data.tags, ...traceContext.baggage };
    }

    spanStack.push(this);

    logger.debug(
      "Span started",
      {
        spanId: this.data.spanId,
        traceId: this.data.traceId,
        operationName,
        parentSpanId,
      },
      "Tracing",
    );
  }

  // Get span ID
  getSpanId(): string {
    return this.data.spanId;
  }

  // Get trace ID
  getTraceId(): string {
    return this.data.traceId;
  }

  // Get current trace context
  getContext(): TraceContext {
    return {
      traceId: this.data.traceId,
      parentSpanId: this.data.spanId,
      baggage: this.data.tags,
    };
  }

  // Add tags to span
  setTag(key: string, value: any): Span {
    this.data.tags[key] = value;
    return this;
  }

  // Add multiple tags
  setTags(tags: Record<string, any>): Span {
    Object.assign(this.data.tags, tags);
    return this;
  }

  // Log structured data to span
  log(fields: Record<string, any>): Span {
    this.data.logs.push({
      timestamp: performance.now(),
      fields,
    });
    return this;
  }

  // Set span status
  setStatus(status: SpanStatus): Span {
    this.data.status = status;
    return this;
  }

  // Mark span as error with optional error object
  setError(error?: Error): Span {
    this.data.status = SpanStatus.ERROR;
    if (error) {
      this.setTags({
        "error.name": error.name,
        "error.message": error.message,
        "error.stack": error.stack,
      });
      this.log({
        level: "error",
        message: error.message,
        stack: error.stack,
      });
    }
    return this;
  }

  // Set component information
  setComponent(component: string): Span {
    this.data.component = component;
    this.setTag("component", component);
    return this;
  }

  // Finish span and calculate duration
  finish(): void {
    if (this.finished) {
      return;
    }

    this.data.endTime = performance.now();
    this.data.duration = this.data.endTime - this.data.startTime;
    this.finished = true;

    // Remove from span stack
    const index = spanStack.indexOf(this);
    if (index > -1) {
      spanStack.splice(index, 1);
    }

    // Send to tracing transports
    tracer.reportSpan(this.data);

    logger.debug(
      "Span finished",
      {
        spanId: this.data.spanId,
        traceId: this.data.traceId,
        duration: this.data.duration,
        status: this.data.status,
      },
      "Tracing",
    );
  }

  // Get span data (for reporting)
  getData(): SpanData {
    return { ...this.data };
  }
}

// Tracing transport interface
export interface TracingTransport {
  name: string;
  reportSpan(span: SpanData): Promise<void>;
}

// Console tracing transport for development
export class ConsoleTracingTransport implements TracingTransport {
  name = "console-tracing";

  async reportSpan(span: SpanData): Promise<void> {
    if (import.meta.env.DEV) {
      logger.debug(`🔍 Trace: ${span.operationName}`, {
        spanId: span.spanId,
        traceId: span.traceId,
        duration: `${span.duration?.toFixed(2)}ms`,
        status: span.status,
        tags: span.tags,
        logs: span.logs.length > 0 ? span.logs : undefined,
      });
    }
  }
}

// External tracing transport (OpenTelemetry, Jaeger, etc.)
export class ExternalTracingTransport implements TracingTransport {
  name: string;
  private config: {
    endpoint?: string;
    apiKey?: string;
    serviceName?: string;
    environment?: string;
  };

  constructor(
    name: string,
    config: typeof ExternalTracingTransport.prototype.config,
  ) {
    this.name = name;
    this.config = config;
  }

  async reportSpan(span: SpanData): Promise<void> {
    try {
      if (!this.config.endpoint) {
        return;
      }

      const payload = {
        ...span,
        serviceName: this.config.serviceName || "devnest-frontend",
        environment: this.config.environment || import.meta.env.MODE,
      };

      await fetch(this.config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.apiKey
            ? { Authorization: `Bearer ${this.config.apiKey}` }
            : {}),
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      logger.warn(
        "Failed to send trace to external service",
        {
          error: error instanceof Error ? error.message : String(error),
        },
        "Tracing",
      );
    }
  }
}

// Main tracer class
export class Tracer {
  private transports: Map<string, TracingTransport> = new Map();
  private enabled = true;
  private serviceName = "devnest-frontend";
  private environment = import.meta.env.MODE || "development";

  constructor() {
    // Add default console transport in development
    if (import.meta.env.DEV) {
      this.addTransport(new ConsoleTracingTransport());
    }
  }

  // Add tracing transport
  addTransport(transport: TracingTransport): void {
    this.transports.set(transport.name, transport);
  }

  // Remove tracing transport
  removeTransport(name: string): void {
    this.transports.delete(name);
  }

  // Enable/disable tracing
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Set service information
  setServiceInfo(serviceName: string, environment?: string): void {
    this.serviceName = serviceName;
    if (environment) {
      this.environment = environment;
    }
  }

  // Start new span
  startSpan(
    operationName: string,
    options: {
      childOf?: Span;
      traceContext?: TraceContext;
      kind?: SpanKind;
      component?: string;
      tags?: Record<string, any>;
    } = {},
  ): Span {
    if (!this.enabled) {
      return new NoOpSpan();
    }

    const traceContext = options.childOf?.getContext() || options.traceContext;
    const span = new Span(operationName, traceContext, options.kind);

    if (options.component) {
      span.setComponent(options.component);
    }

    if (options.tags) {
      span.setTags(options.tags);
    }

    return span;
  }

  // Get active span
  getActiveSpan(): Span | null {
    return spanStack[spanStack.length - 1] || null;
  }

  // Get current trace context
  getActiveContext(): TraceContext | null {
    const activeSpan = this.getActiveSpan();
    return activeSpan ? activeSpan.getContext() : null;
  }

  // Report span to all transports
  async reportSpan(span: SpanData): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const promises = Array.from(this.transports.values()).map((transport) =>
      transport
        .reportSpan(span)
        .catch((error) =>
          logger.error(
            "Tracing transport error",
            error,
            { transport: transport.name },
            "Tracing",
          ),
        ),
    );

    await Promise.allSettled(promises);
  }

  // Trace function execution
  trace<T>(
    operationName: string,
    fn: (span: Span) => T,
    options: {
      component?: string;
      tags?: Record<string, any>;
      kind?: SpanKind;
    } = {},
  ): T {
    const span = this.startSpan(operationName, options);

    try {
      const result = fn(span);

      // Handle promises
      if (result instanceof Promise) {
        return result
          .then((value) => {
            span.setTag("result.success", true);
            span.finish();
            return value;
          })
          .catch((error) => {
            span.setError(error);
            span.finish();
            throw error;
          }) as T;
      }

      span.setTag("result.success", true);
      span.finish();
      return result;
    } catch (error) {
      span.setError(error as Error);
      span.finish();
      throw error;
    }
  }

  // Trace async function execution
  async traceAsync<T>(
    operationName: string,
    fn: (span: Span) => Promise<T>,
    options: {
      component?: string;
      tags?: Record<string, any>;
      kind?: SpanKind;
    } = {},
  ): Promise<T> {
    const span = this.startSpan(operationName, options);

    try {
      const result = await fn(span);
      span.setTag("result.success", true);
      span.finish();
      return result;
    } catch (error) {
      span.setError(error as Error);
      span.finish();
      throw error;
    }
  }
}

// No-op span for when tracing is disabled
class NoOpSpan extends Span {
  constructor() {
    super("noop");
  }

  setTag(): Span {
    return this;
  }
  setTags(): Span {
    return this;
  }
  log(): Span {
    return this;
  }
  setStatus(): Span {
    return this;
  }
  setError(): Span {
    return this;
  }
  setComponent(): Span {
    return this;
  }
  finish(): void {
    // Override to prevent actual finishing logic
  }
}

// Global tracer instance
export const tracer = new Tracer();

// Utility functions for common tracing patterns
export const tracingUtils = {
  // Trace API calls
  traceApiCall: async <T>(
    method: string,
    url: string,
    fn: () => Promise<T>,
    metadata: Record<string, any> = {},
  ): Promise<T> => {
    return tracer.traceAsync(
      `HTTP ${method} ${url}`,
      async (span) => {
        span.setTags({
          "http.method": method,
          "http.url": url,
          "http.user_agent": navigator.userAgent,
          ...metadata,
        });
        span.setComponent("http-client");

        const startTime = Date.now();

        try {
          const result = await fn();
          const duration = Date.now() - startTime;

          span.setTags({
            "http.status_code": 200, // Assume success if no error
            "http.response_time_ms": duration,
          });

          return result;
        } catch (error) {
          span.setTags({
            "http.status_code": (error as any).status || 500,
          });
          throw error;
        }
      },
      { kind: SpanKind.CLIENT },
    );
  },

  // Trace component lifecycle
  traceComponent: (
    componentName: string,
    phase: "mount" | "update" | "unmount",
  ): Span => {
    return tracer.startSpan(`${componentName}.${phase}`, {
      component: componentName,
      tags: {
        "component.name": componentName,
        "component.phase": phase,
      },
    });
  },

  // Trace user interactions
  traceUserAction: (
    action: string,
    metadata: Record<string, any> = {},
  ): Span => {
    return tracer.startSpan(`user.${action}`, {
      component: "user-interaction",
      tags: {
        "user.action": action,
        "user.timestamp": Date.now(),
        ...metadata,
      },
    });
  },

  // Trace business logic
  traceBusinessLogic: async <T>(
    operation: string,
    fn: () => Promise<T> | T,
    metadata: Record<string, any> = {},
  ): Promise<T> => {
    return tracer.traceAsync(
      `business.${operation}`,
      async (span) => {
        span.setTags({
          "business.operation": operation,
          ...metadata,
        });
        span.setComponent("business-logic");

        const result = await fn();
        return result;
      },
      { kind: SpanKind.INTERNAL },
    );
  },
};

// Export trace context utilities
export const traceContext = {
  // Get current trace ID for correlation
  getCurrentTraceId: (): string | null => {
    const context = tracer.getActiveContext();
    return context?.traceId || null;
  },

  // Get current span ID for correlation
  getCurrentSpanId: (): string | null => {
    const span = tracer.getActiveSpan();
    return span?.getSpanId() || null;
  },

  // Create child context
  createChildContext: (baggage?: Record<string, any>): TraceContext | null => {
    const activeContext = tracer.getActiveContext();
    if (!activeContext) {
      return null;
    }

    return {
      traceId: activeContext.traceId,
      parentSpanId: activeContext.parentSpanId,
      baggage: { ...activeContext.baggage, ...baggage },
    };
  },

  // Inject trace context into headers
  injectHeaders: (
    headers: Record<string, string> = {},
  ): Record<string, string> => {
    const context = tracer.getActiveContext();
    if (!context) {
      return headers;
    }

    return {
      ...headers,
      "x-trace-id": context.traceId,
      "x-span-id": context.parentSpanId || "",
    };
  },

  // Extract trace context from headers
  extractFromHeaders: (
    headers: Record<string, string>,
  ): TraceContext | null => {
    const traceId = headers["x-trace-id"];
    const parentSpanId = headers["x-span-id"];

    if (!traceId) {
      return null;
    }

    return {
      traceId,
      parentSpanId: parentSpanId || undefined,
    };
  },
};
