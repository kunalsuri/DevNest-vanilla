/**
 * Express Middleware for Trace ID Propagation
 *
 * Extracts trace IDs and request IDs from incoming HTTP requests
 * and attaches them to the request object for use in logging and monitoring.
 */

import { Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";
import { createTracedLogger } from "../logger";

// Extend Express Request type to include trace context
declare global {
  namespace Express {
    interface Request {
      traceId: string;
      requestId: string;
      logger: ReturnType<typeof createTracedLogger>;
    }
  }
}

/**
 * Middleware to extract or generate trace ID and request ID
 * Attaches a contextual logger to the request object
 */
export function traceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Extract trace ID from headers or generate new one
  const traceId =
    (req.headers["x-trace-id"] as string) ||
    (req.headers["traceid"] as string) ||
    nanoid();

  // Extract request ID from headers or generate new one
  const requestId =
    (req.headers["x-request-id"] as string) ||
    (req.headers["requestid"] as string) ||
    nanoid();

  // Attach to request object
  req.traceId = traceId;
  req.requestId = requestId;

  // Create contextual logger with trace information
  req.logger = createTracedLogger(traceId, requestId, {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Add trace ID to response headers for client correlation
  res.setHeader("X-Trace-Id", traceId);
  res.setHeader("X-Request-Id", requestId);

  // Log incoming request
  req.logger.info(`Incoming request: ${req.method} ${req.path}`, {
    query: req.query,
    userAgent: req.headers["user-agent"],
  });

  // Track request timing
  const startTime = Date.now();

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? "warn" : "info";

    req.logger.log(level, `Request completed: ${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration,
      contentLength: res.get("content-length"),
    });
  });

  next();
}

/**
 * Helper function to get trace context from request
 */
export function getTraceContext(req: Request): {
  traceId: string;
  requestId: string;
} {
  return {
    traceId: req.traceId,
    requestId: req.requestId,
  };
}
