/**
 * Comprehensive Logging System for React + TypeScript Applications
 *
 * Features:
 * - Structured logging with JSON output
 * - Multiple log levels (debug, info, warn, error, fatal)
 * - Pluggable transports (console, external services)
 * - Contextual metadata (user, session, request ID, trace ID)
 * - PII/sensitive data sanitization
 * - Performance-optimized with lazy evaluation
 * - Integration with error boundaries and React Query
 * - Environment-based log level configuration
 * - Distributed tracing support
 */

import { nanoid } from "nanoid";

// Log levels with numeric values for filtering
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

/**
 * Parse log level from string
 */
function parseLogLevel(level: string | undefined): LogLevel {
  if (!level) {
    return LogLevel.DEBUG;
  }

  const levelMap: Record<string, LogLevel> = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
    fatal: LogLevel.FATAL,
  };

  return levelMap[level.toLowerCase()] ?? LogLevel.DEBUG;
}

/**
 * Get log level from environment variable
 */
function getLogLevelFromEnv(): LogLevel {
  // Check for Vite environment variable
  const viteLogLevel = import.meta.env?.VITE_LOG_LEVEL as string | undefined;

  if (viteLogLevel) {
    return parseLogLevel(viteLogLevel);
  }

  // Default based on environment mode
  const isDevelopment = import.meta.env?.MODE === "development";
  return isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
}

// Core log entry structure
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  message: string;
  component?: string;
  module?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string; // Added for distributed tracing
  environment: string;
  userAgent?: string;
  url?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

// Transport interface for pluggable log destinations
export interface LogTransport {
  name: string;
  log(entry: LogEntry): Promise<void> | void;
  shouldLog?(level: LogLevel): boolean;
}

// Console transport for development
class ConsoleTransport implements LogTransport {
  name = "console";

  log(entry: LogEntry): void {
    const {
      timestamp,
      levelName,
      message,
      component,
      module,
      metadata,
      error,
    } = entry;

    const prefix = `[${timestamp}] ${levelName.toUpperCase()}`;
    const context = component || module ? ` (${component || module})` : "";
    const logMessage = `${prefix}${context}: ${message}`;

    // Use appropriate console method based on level
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, { metadata, error });
        break;
      case LogLevel.INFO:
        console.info(logMessage, { metadata, error });
        break;
      case LogLevel.WARN:
        console.warn(logMessage, { metadata, error });
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage, { metadata, error });
        if (error?.stack) {
          console.error(error.stack);
        }
        break;
      default:
        console.log(logMessage, { metadata, error });
    }
  }

  shouldLog(level: LogLevel): boolean {
    // Use environment-based log level
    const minLevel = getLogLevelFromEnv();
    return level >= minLevel;
  }
}

// External service transport (Sentry, LogRocket, Datadog, etc.)
class ExternalTransport implements LogTransport {
  name = "external";
  private serviceName: string;
  private apiEndpoint?: string;
  private apiKey?: string;

  constructor(
    serviceName: string,
    config?: { apiEndpoint?: string; apiKey?: string },
  ) {
    this.serviceName = serviceName;
    this.apiEndpoint = config?.apiEndpoint;
    this.apiKey = config?.apiKey;
  }

  async log(entry: LogEntry): Promise<void> {
    try {
      // Example integration patterns for different services
      switch (this.serviceName) {
        case "sentry":
          this.logToSentry(entry);
          break;
        case "datadog":
          await this.logToDatadog(entry);
          break;
        case "custom":
          await this.logToCustomEndpoint(entry);
          break;
        default:
          console.warn(`Unknown external logging service: ${this.serviceName}`);
      }
    } catch (error) {
      // Never let logging failures break the application
      console.error(`Failed to log to ${this.serviceName}:`, error);
    }
  }

  private logToSentry(entry: LogEntry): void {
    // Example Sentry integration
    if (typeof window !== "undefined" && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;

      if (entry.error) {
        Sentry.captureException(new Error(entry.error.message), {
          level: this.mapLevelToSentry(entry.level),
          contexts: {
            log_entry: {
              component: entry.component,
              module: entry.module,
              metadata: entry.metadata,
            },
          },
          user: entry.userId ? { id: entry.userId } : undefined,
        });
      } else {
        Sentry.captureMessage(entry.message, {
          level: this.mapLevelToSentry(entry.level),
          contexts: {
            log_entry: {
              component: entry.component,
              module: entry.module,
              metadata: entry.metadata,
            },
          },
          user: entry.userId ? { id: entry.userId } : undefined,
        });
      }
    }
  }

  private async logToDatadog(entry: LogEntry): Promise<void> {
    // Example DataDog logs API integration
    if (!this.apiEndpoint || !this.apiKey) {
      return;
    }

    const payload = {
      ddsource: "browser",
      ddtags: `env:${entry.environment},component:${entry.component || "unknown"}`,
      hostname: window.location.hostname,
      message: entry.message,
      level: entry.levelName.toLowerCase(),
      timestamp: entry.timestamp,
      service: "devnest-frontend",
      ...entry.metadata,
    };

    await fetch(this.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "DD-API-KEY": this.apiKey,
      },
      body: JSON.stringify(payload),
    });
  }

  private async logToCustomEndpoint(entry: LogEntry): Promise<void> {
    if (!this.apiEndpoint) {
      return;
    }

    await fetch(this.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify(entry),
      credentials: "include",
    });
  }

  private mapLevelToSentry(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return "debug";
      case LogLevel.INFO:
        return "info";
      case LogLevel.WARN:
        return "warning";
      case LogLevel.ERROR:
        return "error";
      case LogLevel.FATAL:
        return "fatal";
      default:
        return "info";
    }
  }

  shouldLog(level: LogLevel): boolean {
    // For external services, only log warnings and above to reduce noise
    return level >= LogLevel.WARN;
  }
}

// Batch transport for performance optimization
class BatchTransport implements LogTransport {
  name = "batch";
  private transport: LogTransport;
  private batch: LogEntry[] = [];
  private batchSize: number;
  private flushInterval: number;
  private timer?: NodeJS.Timeout;

  constructor(transport: LogTransport, batchSize = 10, flushInterval = 5000) {
    this.transport = transport;
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.startTimer();
  }

  log(entry: LogEntry): void {
    this.batch.push(entry);

    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      if (this.batch.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0) {
      return;
    }

    const batchToProcess = [...this.batch];
    this.batch = [];

    try {
      await Promise.all(
        batchToProcess.map((entry) => this.transport.log(entry)),
      );
    } catch (error) {
      console.error("Failed to flush log batch:", error);
      // Re-add failed entries to batch for retry
      this.batch.unshift(...batchToProcess);
    }
  }

  shouldLog = (level: LogLevel): boolean => {
    return this.transport.shouldLog ? this.transport.shouldLog(level) : true;
  };

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.flush();
  }
}

// Context manager for maintaining request/session context
class LogContext {
  private static instance: LogContext;
  private context: Record<string, any> = {};

  static getInstance(): LogContext {
    if (!LogContext.instance) {
      LogContext.instance = new LogContext();
    }
    return LogContext.instance;
  }

  setContext(key: string, value: any): void {
    this.context[key] = value;
  }

  getContext(): Record<string, any> {
    return { ...this.context };
  }

  clearContext(): void {
    this.context = {};
  }

  // Generate a unique request ID for tracing
  generateRequestId(): string {
    const requestId = nanoid();
    this.setContext("requestId", requestId);
    return requestId;
  }

  // Generate a unique trace ID for distributed tracing
  generateTraceId(): string {
    const traceId = nanoid();
    this.setContext("traceId", traceId);
    return traceId;
  }

  // Set trace ID from external source (e.g., HTTP headers)
  setTraceId(traceId: string): void {
    this.setContext("traceId", traceId);
  }
}

// PII sanitization utility
class DataSanitizer {
  private static sensitiveKeys = [
    "password",
    "token",
    "apiKey",
    "secret",
    "auth",
    "authorization",
    "ssn",
    "socialSecurity",
    "creditCard",
    "cc",
    "cvv",
    "pin",
    "email",
    "phone",
    "phoneNumber",
    "address",
    "zipCode",
    "postalCode",
  ];

  static sanitize(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === "string") {
      return this.sanitizeString(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    if (typeof data === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (
          this.sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))
        ) {
          sanitized[key] = "[REDACTED]";
        } else {
          sanitized[key] = this.sanitize(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  private static sanitizeString(str: string): string {
    // Redact common patterns (emails, phone numbers, etc.)
    return str
      .replace(
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        "[EMAIL_REDACTED]",
      )
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, "[PHONE_REDACTED]")
      .replace(
        /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        "[CARD_REDACTED]",
      );
  }
}

// Main Logger class
class Logger {
  private static instance: Logger;
  private transports: LogTransport[] = [];
  private readonly context = LogContext.getInstance();
  private minLevel: LogLevel;

  private constructor() {
    // Initialize with environment-based log level
    this.minLevel = getLogLevelFromEnv();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
      // Add default console transport
      Logger.instance.addTransport(new ConsoleTransport());
    }
    return Logger.instance;
  }

  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  removeTransport(transportName: string): void {
    this.transports = this.transports.filter((t) => t.name !== transportName);
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private createEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    error?: Error,
    component?: string,
    module?: string,
  ): LogEntry {
    const context = this.context.getContext();

    return {
      timestamp: new Date().toISOString(),
      level,
      levelName: LogLevel[level].toLowerCase(),
      message,
      component,
      module,
      userId: context.userId,
      sessionId: context.sessionId,
      requestId: context.requestId,
      traceId: context.traceId, // Added for distributed tracing
      environment: import.meta.env.MODE || "development",
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      url:
        typeof globalThis.window !== "undefined"
          ? globalThis.window.location.href
          : undefined,
      metadata: metadata ? DataSanitizer.sanitize(metadata) : undefined,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: (error as any).code,
          }
        : undefined,
    };
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    error?: Error,
    component?: string,
    module?: string,
  ): void {
    // Check if we should log this level
    if (level < this.minLevel) {
      return;
    }

    const entry = this.createEntry(
      level,
      message,
      metadata,
      error,
      component,
      module,
    );

    // Send to all transports asynchronously
    this.transports.forEach((transport) => {
      try {
        if (!transport.shouldLog || transport.shouldLog(level)) {
          const result = transport.log(entry);
          // Handle async transports
          if (result instanceof Promise) {
            result.catch((err) => {
              console.error(`Transport ${transport.name} failed:`, err);
            });
          }
        }
      } catch (err) {
        console.error(`Transport ${transport.name} failed:`, err);
      }
    });
  }

  // Public logging methods
  debug(
    message: string,
    metadata?: Record<string, any>,
    component?: string,
  ): void {
    this.log(LogLevel.DEBUG, message, metadata, undefined, component);
  }

  info(
    message: string,
    metadata?: Record<string, any>,
    component?: string,
  ): void {
    this.log(LogLevel.INFO, message, metadata, undefined, component);
  }

  warn(
    message: string,
    metadata?: Record<string, any>,
    component?: string,
  ): void {
    this.log(LogLevel.WARN, message, metadata, undefined, component);
  }

  error(
    message: string,
    error?: Error,
    metadata?: Record<string, any>,
    component?: string,
  ): void {
    this.log(LogLevel.ERROR, message, metadata, error, component);
  }

  fatal(
    message: string,
    error?: Error,
    metadata?: Record<string, any>,
    component?: string,
  ): void {
    this.log(LogLevel.FATAL, message, metadata, error, component);
  }

  // Context management
  setUserId(userId: string): void {
    this.context.setContext("userId", userId);
  }

  setSessionId(sessionId: string): void {
    this.context.setContext("sessionId", sessionId);
  }

  generateRequestId(): string {
    return this.context.generateRequestId();
  }

  generateTraceId(): string {
    return this.context.generateTraceId();
  }

  setTraceId(traceId: string): void {
    this.context.setTraceId(traceId);
  }

  getTraceId(): string | undefined {
    return this.context.getContext().traceId;
  }

  clearContext(): void {
    this.context.clearContext();
  }

  // API logging helpers
  logApiRequest(
    method: string,
    url: string,
    metadata?: Record<string, any>,
  ): void {
    this.info(
      `API Request: ${method} ${url}`,
      {
        type: "api_request",
        method,
        url,
        ...metadata,
      },
      "api",
    );
  }

  logApiResponse(
    method: string,
    url: string,
    status: number,
    duration: number,
    metadata?: Record<string, any>,
  ): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(
      level,
      `API Response: ${method} ${url} ${status} (${duration}ms)`,
      {
        type: "api_response",
        method,
        url,
        status,
        duration,
        ...metadata,
      },
      undefined,
      "api",
    );
  }

  logApiError(
    method: string,
    url: string,
    error: Error,
    metadata?: Record<string, any>,
  ): void {
    this.error(
      `API Error: ${method} ${url}`,
      error,
      {
        type: "api_error",
        method,
        url,
        ...metadata,
      },
      "api",
    );
  }

  // Performance logging
  logPerformance(
    name: string,
    duration: number,
    metadata?: Record<string, any>,
  ): void {
    this.info(
      `Performance: ${name} completed in ${duration}ms`,
      {
        type: "performance",
        name,
        duration,
        ...metadata,
      },
      "performance",
    );
  }

  // User action logging
  logUserAction(action: string, metadata?: Record<string, any>): void {
    this.info(
      `User Action: ${action}`,
      {
        type: "user_action",
        action,
        ...metadata,
      },
      "user",
    );
  }

  // Component lifecycle logging
  logComponentMount(
    componentName: string,
    metadata?: Record<string, any>,
  ): void {
    this.debug(
      `Component mounted: ${componentName}`,
      {
        type: "component_lifecycle",
        event: "mount",
        ...metadata,
      },
      componentName,
    );
  }

  logComponentUnmount(
    componentName: string,
    metadata?: Record<string, any>,
  ): void {
    this.debug(
      `Component unmounted: ${componentName}`,
      {
        type: "component_lifecycle",
        event: "unmount",
        ...metadata,
      },
      componentName,
    );
  }
}

// Singleton logger instance
export const logger = Logger.getInstance();

// Convenience functions for common use cases
export const log = {
  debug: (
    message: string,
    metadata?: Record<string, any>,
    component?: string,
  ) => logger.debug(message, metadata, component),
  info: (message: string, metadata?: Record<string, any>, component?: string) =>
    logger.info(message, metadata, component),
  warn: (message: string, metadata?: Record<string, any>, component?: string) =>
    logger.warn(message, metadata, component),
  error: (
    message: string,
    error?: Error,
    metadata?: Record<string, any>,
    component?: string,
  ) => logger.error(message, error, metadata, component),
  fatal: (
    message: string,
    error?: Error,
    metadata?: Record<string, any>,
    component?: string,
  ) => logger.fatal(message, error, metadata, component),
};

// Types already exported above with interface declarations
export { ConsoleTransport, ExternalTransport, BatchTransport, DataSanitizer };

// File transport for local log persistence
export { FileTransport } from "./file-transport";
export { ServerTransport } from "./server-transport";
