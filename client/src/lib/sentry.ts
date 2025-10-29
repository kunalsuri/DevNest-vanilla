import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for client-side error tracking and performance monitoring
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.log("Sentry DSN not configured. Skipping Sentry initialization.");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration(),
      // Replay integration for session recording
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1, // 10% in production
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1, // 100% of sessions with errors
    // Filter sensitive data
    beforeSend(event, hint) {
      // Filter out specific errors if needed
      const error = hint.originalException;

      if (error && typeof error === "object" && "message" in error) {
        const message = String(error.message);
        // Example: filter out network errors
        if (
          message.includes("NetworkError") ||
          message.includes("Failed to fetch")
        ) {
          // Can choose to return null to not send, or modify event
          event.fingerprint = ["network-error"];
        }
      }

      return event;
    },
  });
}

/**
 * Error Boundary component that integrates with Sentry
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
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
 * Set user context
 */
export function setUser(
  user: { id: string; username?: string; email?: string } | null,
) {
  Sentry.setUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Create a Sentry transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startSpan(
    {
      name,
      op,
    },
    (span) => span,
  );
}
