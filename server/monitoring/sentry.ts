import * as Sentry from "@sentry/node";
import type { Express, Request, Response, NextFunction } from "express";
import { env } from "../env";

/**
 * Initialize Sentry for server-side error tracking and performance monitoring
 */
export function initSentry(_app: Express): void {
  // Only initialize Sentry in production or if DSN is provided
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.log("Sentry DSN not configured. Skipping Sentry initialization.");
    return;
  }

  Sentry.init({
    dsn,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1, // 10% in production, 100% in dev
    profilesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1,
    integrations: [
      // Enable HTTP call tracing
      Sentry.httpIntegration(),
      // Enable Express tracing
      Sentry.expressIntegration(),
    ],
    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }

      // Remove password fields from request body
      if (event.request?.data && typeof event.request.data === "object") {
        const data = event.request.data as Record<string, unknown>;
        if ("password" in data) {
          data.password = "[FILTERED]";
        }
        if ("currentPassword" in data) {
          data.currentPassword = "[FILTERED]";
        }
        if ("newPassword" in data) {
          data.newPassword = "[FILTERED]";
        }
      }

      return event;
    },
  });

  console.log("Sentry initialized successfully");
}

/**
 * Setup Sentry error handler - must be used before other error handlers
 */
export function setupSentryErrorHandler(app: Express): void {
  Sentry.setupExpressErrorHandler(app);
}

/**
 * Custom error handler that integrates with Sentry
 */
export function createSentryAwareErrorHandler() {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    // Capture error in Sentry with additional context
    const jwtReq = req as Request & {
      jwtUser?: { userId: string; username: string };
    };

    Sentry.withScope((scope) => {
      scope.setUser({
        id: jwtReq.jwtUser?.userId?.toString(),
        username: jwtReq.jwtUser?.username,
      });

      scope.setContext("request", {
        method: req.method,
        url: req.url,
        query: req.query,
        body: req.body,
        ip: req.ip,
      });

      Sentry.captureException(err);
    });

    // Continue to next error handler
    next(err);
  };
} /**
 * Capture custom events or messages
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
) {
  Sentry.captureMessage(message, level);
}

/**
 * Capture exceptions manually
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>,
) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext("custom", context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}
