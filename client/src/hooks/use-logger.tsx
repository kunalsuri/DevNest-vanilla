import { useEffect, useCallback, useRef } from "react";
import { logger, LogLevel } from "@/lib/logger";

/**
 * Hook for component-level logging with automatic context management
 */
export function useLogger(componentName: string) {
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      logger.logComponentMount(componentName);
      mounted.current = true;
    }

    return () => {
      logger.logComponentUnmount(componentName);
    };
  }, [componentName]);

  const logWithComponent = useCallback(
    (
      level: "debug" | "info" | "warn" | "error" | "fatal",
      message: string,
      metadata?: Record<string, any>,
      error?: Error,
    ) => {
      switch (level) {
        case "debug":
          logger.debug(message, metadata, componentName);
          break;
        case "info":
          logger.info(message, metadata, componentName);
          break;
        case "warn":
          logger.warn(message, metadata, componentName);
          break;
        case "error":
          logger.error(message, error, metadata, componentName);
          break;
        case "fatal":
          logger.fatal(message, error, metadata, componentName);
          break;
      }
    },
    [componentName],
  );

  return {
    debug: (message: string, metadata?: Record<string, any>) =>
      logWithComponent("debug", message, metadata),
    info: (message: string, metadata?: Record<string, any>) =>
      logWithComponent("info", message, metadata),
    warn: (message: string, metadata?: Record<string, any>) =>
      logWithComponent("warn", message, metadata),
    error: (message: string, error?: Error, metadata?: Record<string, any>) =>
      logWithComponent("error", message, metadata, error),
    fatal: (message: string, error?: Error, metadata?: Record<string, any>) =>
      logWithComponent("fatal", message, metadata, error),
    logUserAction: (action: string, metadata?: Record<string, any>) =>
      logger.logUserAction(action, { component: componentName, ...metadata }),
  };
}

/**
 * Hook for API call logging with automatic request/response tracking
 */
export function useApiLogger() {
  const logApiCall = useCallback(async function <T>(
    method: string,
    url: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    const requestId = logger.generateRequestId();
    const startTime = performance.now();

    logger.logApiRequest(method, url, { requestId, ...metadata });

    try {
      const result = await apiCall();
      const duration = Math.round(performance.now() - startTime);

      logger.logApiResponse(method, url, 200, duration, {
        requestId,
        success: true,
        ...metadata,
      });

      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);

      logger.logApiError(method, url, error as Error, {
        requestId,
        duration,
        ...metadata,
      });

      throw error;
    }
  }, []);

  return { logApiCall };
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceLogger() {
  const measurePerformance = useCallback(function <T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>,
  ): T {
    const startTime = performance.now();

    try {
      const result = fn();
      const duration = Math.round(performance.now() - startTime);

      logger.logPerformance(name, duration, metadata);

      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);

      logger.error(
        `Performance measurement failed: ${name}`,
        error as Error,
        {
          duration,
          ...metadata,
        },
        "performance",
      );

      throw error;
    }
  }, []);

  const measureAsyncPerformance = useCallback(async function <T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await fn();
      const duration = Math.round(performance.now() - startTime);

      logger.logPerformance(name, duration, metadata);

      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);

      logger.error(
        `Async performance measurement failed: ${name}`,
        error as Error,
        {
          duration,
          ...metadata,
        },
        "performance",
      );

      throw error;
    }
  }, []);

  return { measurePerformance, measureAsyncPerformance };
}

/**
 * Hook for user session logging
 */
export function useSessionLogger() {
  useEffect(() => {
    // Generate session ID on mount
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.setSessionId(sessionId);

    logger.info("User session started", { sessionId }, "session");

    // Log page visibility changes
    const handleVisibilityChange = () => {
      logger.logUserAction("page_visibility_change", {
        visible: !document.hidden,
        timestamp: new Date().toISOString(),
      });
    };

    // Log page unload
    const handleBeforeUnload = () => {
      logger.info("User session ending", { sessionId }, "session");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const logPageView = useCallback(
    (pageName: string, metadata?: Record<string, any>) => {
      logger.logUserAction("page_view", {
        page: pageName,
        url: window.location.href,
        referrer: document.referrer,
        ...metadata,
      });
    },
    [],
  );

  const logUserInteraction = useCallback(
    (interaction: string, element?: string, metadata?: Record<string, any>) => {
      logger.logUserAction(`user_${interaction}`, {
        element,
        url: window.location.href,
        ...metadata,
      });
    },
    [],
  );

  return { logPageView, logUserInteraction };
}

/**
 * Hook for form logging
 */
export function useFormLogger(formName: string) {
  const log = useLogger(`Form:${formName}`);

  const logFormStart = useCallback(
    (metadata?: Record<string, any>) => {
      log.info(`Form started: ${formName}`, metadata);
    },
    [log, formName],
  );

  const logFormSubmit = useCallback(
    (metadata?: Record<string, any>) => {
      log.info(`Form submitted: ${formName}`, metadata);
    },
    [log, formName],
  );

  const logFormError = useCallback(
    (error: Error, metadata?: Record<string, any>) => {
      log.error(`Form error: ${formName}`, error, metadata);
    },
    [log, formName],
  );

  const logFieldInteraction = useCallback(
    (
      field: string,
      action: "focus" | "blur" | "change",
      metadata?: Record<string, any>,
    ) => {
      log.debug(`Field ${action}: ${formName}.${field}`, metadata);
    },
    [log, formName],
  );

  return {
    logFormStart,
    logFormSubmit,
    logFormError,
    logFieldInteraction,
  };
}
