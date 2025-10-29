/**
 * React Hooks for Observability Integration
 *
 * Comprehensive hooks for logging, tracing, and metrics in React components
 */

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useLogger } from "./use-logger";
import { tracer, tracingUtils, Span, SpanKind } from "../lib/tracing";
import { metrics, metricsUtils } from "../lib/metrics";
import { logger } from "../lib/logger";

// Enhanced logging hook with tracing integration
export function useObservabilityLogger(componentName: string) {
  const baseLogger = useLogger(componentName);

  return useMemo(
    () => ({
      ...baseLogger,

      // Log with automatic trace correlation
      debug: (message: string, metadata?: Record<string, any>) => {
        baseLogger.debug(message, metadata);
      },

      info: (message: string, metadata?: Record<string, any>) => {
        baseLogger.info(message, metadata);
      },

      warn: (message: string, metadata?: Record<string, any>) => {
        baseLogger.warn(message, metadata);
      },

      error: (
        message: string,
        error?: Error,
        metadata?: Record<string, any>,
      ) => {
        // Track error metrics
        metricsUtils.trackError(
          error?.name || "UnknownError",
          componentName,
          "medium",
        );

        baseLogger.error(message, error, metadata);
      },

      // Log user action with tracing and metrics
      logUserActionWithObservability: (
        action: string,
        metadata?: Record<string, any>,
      ) => {
        const span = tracingUtils.traceUserAction(action, {
          component: componentName,
          ...metadata,
        });

        metricsUtils.trackUserAction(action, {
          component: componentName,
          ...Object.fromEntries(
            Object.entries(metadata || {}).map(([k, v]) => [k, String(v)]),
          ),
        });

        baseLogger.logUserAction(action, metadata);
        span.finish();
      },
    }),
    [baseLogger, componentName],
  );
}

// Tracing hook for component lifecycle
export function useTracing(componentName: string, props?: Record<string, any>) {
  const mountSpan = useRef<Span | null>(null);
  const renderCount = useRef(0);

  // Component mount tracing
  useEffect(() => {
    mountSpan.current = tracingUtils.traceComponent(componentName, "mount");

    if (props) {
      mountSpan.current.setTags({
        "component.props.count": Object.keys(props).length,
        "component.props.keys": Object.keys(props).join(","),
      });
    }

    logger.debug(
      "Component mounted with tracing",
      {
        component: componentName,
        traceId: mountSpan.current.getTraceId(),
        spanId: mountSpan.current.getSpanId(),
      },
      componentName,
    );

    return () => {
      if (mountSpan.current) {
        const unmountSpan = tracingUtils.traceComponent(
          componentName,
          "unmount",
        );
        unmountSpan.setTag("component.render_count", renderCount.current);
        unmountSpan.finish();

        mountSpan.current.finish();

        logger.debug(
          "Component unmounted",
          {
            component: componentName,
            renderCount: renderCount.current,
          },
          componentName,
        );
      }
    };
  }, [componentName]);

  // Render tracing
  const traceRender = useCallback(() => {
    renderCount.current++;

    const renderTimer = metricsUtils.createTimer("component.render.duration", {
      component: componentName,
    });

    return renderTimer;
  }, [componentName]);

  // Create child span for operations
  const createChildSpan = useCallback(
    (
      operationName: string,
      options: {
        tags?: Record<string, any>;
        kind?: SpanKind;
      } = {},
    ) => {
      return tracer.startSpan(`${componentName}.${operationName}`, {
        childOf: mountSpan.current || undefined,
        component: componentName,
        tags: options.tags,
        kind: options.kind,
      });
    },
    [componentName],
  );

  return {
    traceRender,
    createChildSpan,
    getCurrentSpan: () => mountSpan.current,
  };
}

// Metrics hook for performance tracking
export function useMetrics(componentName: string) {
  const renderTimer = useRef<(() => void) | null>(null);

  // Start render timing
  const startRenderTiming = useCallback(() => {
    renderTimer.current = metricsUtils.createTimer(
      "component.render.duration",
      {
        component: componentName,
      },
    );
  }, [componentName]);

  // End render timing
  const endRenderTiming = useCallback(() => {
    if (renderTimer.current) {
      renderTimer.current();
      renderTimer.current = null;
    }
  }, []);

  // Custom metric recording
  const recordMetric = useCallback(
    (name: string, value: number, tags: Record<string, string> = {}) => {
      metrics.setGauge(name, value, {
        component: componentName,
        ...tags,
      });
    },
    [componentName],
  );

  // Counter increment
  const incrementCounter = useCallback(
    (name: string, tags: Record<string, string> = {}) => {
      metrics.incrementCounter(name, {
        component: componentName,
        ...tags,
      });
    },
    [componentName],
  );

  // Timer creation
  const createTimer = useCallback(
    (name: string, tags: Record<string, string> = {}) => {
      return metricsUtils.createTimer(name, {
        component: componentName,
        ...tags,
      });
    },
    [componentName],
  );

  return {
    startRenderTiming,
    endRenderTiming,
    recordMetric,
    incrementCounter,
    createTimer,
  };
}

// Combined observability hook
export function useObservability(
  componentName: string,
  options: {
    trackRenders?: boolean;
    trackProps?: boolean;
    autoTraceLifecycle?: boolean;
  } = {},
) {
  const {
    trackRenders = true,
    trackProps = false,
    autoTraceLifecycle = true,
  } = options;

  const log = useObservabilityLogger(componentName);
  const tracing = useTracing(componentName);
  const metricsHook = useMetrics(componentName);

  const renderCount = useRef(0);
  const lastPropsRef = useRef<any>(null);

  // Auto render tracking
  useEffect(() => {
    if (trackRenders) {
      renderCount.current++;

      const timer = tracing.traceRender();
      metricsHook.recordMetric("component.render.count", renderCount.current);

      // End timer on next tick to capture render time
      requestAnimationFrame(() => {
        timer();
      });
    }
  });

  // Props change tracking
  useEffect(() => {
    if (trackProps && lastPropsRef.current) {
      const changedProps = Object.keys(lastPropsRef.current || {}).filter(
        (key) =>
          lastPropsRef.current &&
          lastPropsRef.current[key] !== lastPropsRef.current[key],
      );

      if (changedProps.length > 0) {
        log.debug("Props changed", {
          changedProps,
          propsCount: changedProps.length,
        });

        metricsHook.incrementCounter("component.props.changed", {
          props_count: changedProps.length.toString(),
        });
      }
    }
  });

  // API call tracing with observability
  const traceApiCall = useCallback(
    async function <T>(
      method: string,
      url: string,
      apiCall: () => Promise<T>,
      metadata: Record<string, any> = {},
    ): Promise<T> {
      const startTime = performance.now();
      let status = 0;

      try {
        const result = await tracingUtils.traceApiCall(
          method,
          url,
          async () => {
            const response = await apiCall();
            status = 200; // Assume success
            return response;
          },
          {
            component: componentName,
            ...metadata,
          },
        );

        const duration = performance.now() - startTime;
        metricsUtils.trackApiCall(method, url, duration, status);

        log.info("API call completed", {
          method,
          url,
          duration,
          status,
        });

        return result;
      } catch (error) {
        status = (error as any).status || 500;
        const duration = performance.now() - startTime;

        metricsUtils.trackApiCall(method, url, duration, status);
        metricsUtils.trackError("ApiError", componentName, "high");

        log.error("API call failed", error as Error, {
          method,
          url,
          duration,
          status,
        });

        throw error;
      }
    },
    [componentName, log],
  );

  // Business logic tracing
  const traceBusinessLogic = useCallback(
    async function <T>(
      operation: string,
      fn: () => Promise<T> | T,
      metadata: Record<string, any> = {},
    ): Promise<T> {
      const timer = metricsHook.createTimer(`business.${operation}.duration`);

      try {
        const result = await tracingUtils.traceBusinessLogic(operation, fn, {
          component: componentName,
          ...metadata,
        });

        timer();
        metricsHook.incrementCounter(`business.${operation}.success`);

        log.info("Business logic completed", {
          operation,
          component: componentName,
        });

        return result;
      } catch (error) {
        timer();
        metricsHook.incrementCounter(`business.${operation}.error`);

        log.error("Business logic failed", error as Error, {
          operation,
          component: componentName,
        });

        throw error;
      }
    },
    [componentName, log, metricsHook],
  );

  // Error boundary integration
  const reportError = useCallback(
    (error: Error, errorInfo?: any) => {
      const span = tracing.createChildSpan("error", {
        tags: {
          "error.name": error.name,
          "error.message": error.message,
          "error.stack": error.stack || "",
        },
      });

      span.setError(error);
      span.finish();

      metricsUtils.trackError(error.name, componentName, "high");

      log.error("Component error occurred", error, {
        errorInfo,
        renderCount: renderCount.current,
      });
    },
    [componentName, log, tracing],
  );

  return {
    log,
    tracing,
    metrics: metricsHook,
    traceApiCall,
    traceBusinessLogic,
    reportError,
    renderCount: renderCount.current,
  };
}

// Hook for tracking form interactions with observability
export function useFormObservability(formName: string) {
  const { log, tracing, metrics } = useObservability(`Form.${formName}`);

  const formStartTime = useRef<number>(Date.now());
  const fieldInteractions = useRef<Record<string, number>>({});

  useEffect(() => {
    const span = tracing.createChildSpan("form.start", {
      tags: { form_name: formName },
    });

    log.info("Form started", { formName });
    metrics.incrementCounter("form.started");

    return () => {
      span.finish();
    };
  }, [formName, log, metrics, tracing]);

  const trackFieldInteraction = useCallback(
    (
      fieldName: string,
      interactionType: "focus" | "blur" | "change",
      metadata: Record<string, any> = {},
    ) => {
      fieldInteractions.current[fieldName] =
        (fieldInteractions.current[fieldName] || 0) + 1;

      const span = tracing.createChildSpan(`form.field.${interactionType}`, {
        tags: {
          form_name: formName,
          field_name: fieldName,
          interaction_type: interactionType,
        },
      });

      metrics.incrementCounter("form.field.interactions", {
        form_name: formName,
        field_name: fieldName,
        interaction_type: interactionType,
      });

      log.debug("Field interaction", {
        formName,
        fieldName,
        interactionType,
        interactionCount: fieldInteractions.current[fieldName],
        ...metadata,
      });

      span.finish();
    },
    [formName, log, metrics, tracing],
  );

  const trackFormSubmission = useCallback(
    (success: boolean, metadata: Record<string, any> = {}) => {
      const duration = Date.now() - formStartTime.current;
      const totalInteractions = Object.values(fieldInteractions.current).reduce(
        (sum, count) => sum + count,
        0,
      );

      const span = tracing.createChildSpan("form.submit", {
        tags: {
          form_name: formName,
          success: success.toString(),
          duration: duration.toString(),
          total_interactions: totalInteractions.toString(),
        },
      });

      metrics.recordMetric("form.completion.duration", duration, {
        form_name: formName,
      });
      metrics.recordMetric("form.field.interactions.total", totalInteractions, {
        form_name: formName,
      });
      metrics.incrementCounter("form.submissions", {
        form_name: formName,
        status: success ? "success" : "error",
      });

      log.info("Form submission", {
        formName,
        success,
        duration,
        totalInteractions,
        fieldInteractions: fieldInteractions.current,
        ...metadata,
      });

      span.finish();
    },
    [formName, log, metrics, tracing],
  );

  const trackFormError = useCallback(
    (error: Error, metadata: Record<string, any> = {}) => {
      const span = tracing.createChildSpan("form.error", {
        tags: {
          form_name: formName,
          error_name: error.name,
          error_message: error.message,
        },
      });

      span.setError(error);

      metrics.incrementCounter("form.errors", {
        form_name: formName,
        error_type: error.name,
      });

      log.error("Form error", error, {
        formName,
        fieldInteractions: fieldInteractions.current,
        ...metadata,
      });

      span.finish();
    },
    [formName, log, metrics, tracing],
  );

  return {
    trackFieldInteraction,
    trackFormSubmission,
    trackFormError,
    getFormMetrics: () => ({
      duration: Date.now() - formStartTime.current,
      fieldInteractions: { ...fieldInteractions.current },
      totalInteractions: Object.values(fieldInteractions.current).reduce(
        (sum, count) => sum + count,
        0,
      ),
    }),
  };
}

// Hook for tracking page/route changes with observability
export function usePageObservability(pageName: string) {
  const { log, tracing, metrics } = useObservability(`Page.${pageName}`);

  const pageLoadTime = useRef<number>(Date.now());
  const pageSpan = useRef<Span | null>(null);

  useEffect(() => {
    pageLoadTime.current = Date.now();
    pageSpan.current = tracing.createChildSpan("page.load", {
      tags: {
        page_name: pageName,
        url: window.location.href,
        referrer: document.referrer || "direct",
      },
    });

    metrics.incrementCounter("page.views", {
      page_name: pageName,
    });

    log.info("Page loaded", {
      pageName,
      url: window.location.href,
      referrer: document.referrer,
    });

    // Track page performance metrics
    metricsUtils.trackWebVitals();
    metricsUtils.trackMemoryUsage();

    return () => {
      if (pageSpan.current) {
        const duration = Date.now() - pageLoadTime.current;

        pageSpan.current.setTag("page.duration", duration);
        pageSpan.current.finish();

        metrics.recordMetric("page.time_on_page", duration, {
          page_name: pageName,
        });

        log.info("Page unloaded", {
          pageName,
          timeOnPage: duration,
        });
      }
    };
  }, [pageName, log, metrics, tracing]);

  const trackPageInteraction = useCallback(
    (interaction: string, metadata: Record<string, any> = {}) => {
      const span = tracing.createChildSpan(`page.interaction.${interaction}`, {
        tags: {
          page_name: pageName,
          interaction,
        },
      });

      metrics.incrementCounter("page.interactions", {
        page_name: pageName,
        interaction,
      });

      log.debug("Page interaction", {
        pageName,
        interaction,
        ...metadata,
      });

      span.finish();
    },
    [pageName, log, metrics, tracing],
  );

  return {
    trackPageInteraction,
    getPageMetrics: () => ({
      timeOnPage: Date.now() - pageLoadTime.current,
      pageName,
      url: window.location.href,
    }),
  };
}
