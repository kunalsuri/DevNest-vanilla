/**
 * Example Usage of the Comprehensive Observability System
 *
 * This file demonstrates how to use logging, tracing, and metrics
 * in React components, custom hooks, and API services.
 */

import React, { useState, useEffect } from "react";
import {
  useObservability,
  useFormObservability,
  usePageObservability,
} from "@/hooks/use-observability";
import { tracer, tracingUtils } from "@/lib/tracing";
import { metrics, metricsUtils } from "@/lib/metrics";
import { logger } from "@/lib/logger";

// Example 1: Component with comprehensive observability
export function UserDashboard({ userId }: { userId: string }) {
  const observability = useObservability("UserDashboard", {
    trackRenders: true,
    trackProps: true,
    autoTraceLifecycle: true,
  });

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Track page-level observability
  const pageObservability = usePageObservability("UserDashboard");

  useEffect(() => {
    observability.log.info("UserDashboard mounted", { userId });
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      // Trace API call with comprehensive observability
      const data = await observability.traceApiCall(
        "GET",
        `/api/users/${userId}`,
        async () => {
          const response = await fetch(`/api/users/${userId}`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        },
        { userId, source: "UserDashboard" },
      );

      setUserData(data);
      observability.log.info("User data loaded successfully", {
        userId,
        dataFields: Object.keys(data),
      });

      // Track custom business metric
      observability.metrics.recordMetric(
        "user.profile.completeness",
        calculateProfileCompleteness(data),
        { user_type: data.type },
      );
    } catch (error) {
      observability.log.error("Failed to load user data", error as Error, {
        userId,
      });

      // Error is automatically tracked by observability.traceApiCall
      // but we can add additional context
      observability.metrics.incrementCounter("user.load.errors", {
        user_id: userId,
        error_type: (error as Error).name,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: string) => {
    // Track user interaction
    pageObservability.trackPageInteraction(action, { userId });

    // Trace business logic
    await observability.traceBusinessLogic(
      `user_action_${action}`,
      async () => {
        // Simulate business logic
        await new Promise((resolve) => setTimeout(resolve, 100));

        observability.log.info("User action completed", { action, userId });

        // Track business metrics
        observability.metrics.incrementCounter("user.actions.completed", {
          action,
          user_type: (userData as any)?.type || "unknown",
        });
      },
      { action, userId },
    );
  };

  const calculateProfileCompleteness = (data: any): number => {
    const requiredFields = ["name", "email", "avatar", "bio", "location"];
    const completedFields = requiredFields.filter((field) => data[field]);
    return (completedFields.length / requiredFields.length) * 100;
  };

  if (loading) {
    return <div>Loading user data...</div>;
  }

  return (
    <div>
      <h1>User Dashboard</h1>
      <button onClick={() => handleUserAction("profile_update")}>
        Update Profile
      </button>
      <button onClick={() => handleUserAction("settings_view")}>
        View Settings
      </button>
    </div>
  );
}

// Example 2: Form with comprehensive tracking
export function ContactForm() {
  const formObservability = useFormObservability("ContactForm");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleFieldChange = (field: string, value: string) => {
    // Track field interaction
    formObservability.trackFieldInteraction(field, "change", {
      valueLength: value.length,
      hasValue: !!value,
    });

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Simulate form submission
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Submission failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Track successful submission
      formObservability.trackFormSubmission(true, {
        formVersion: "2.1",
        submissionId: result.id,
      });

      alert("Form submitted successfully!");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      // Track form error
      formObservability.trackFormError(error as Error, {
        formData: {
          hasName: !!formData.name,
          hasEmail: !!formData.email,
          messageLength: formData.message.length,
        },
      });

      alert("Failed to submit form. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => handleFieldChange("name", e.target.value)}
        onFocus={() => formObservability.trackFieldInteraction("name", "focus")}
        onBlur={() => formObservability.trackFieldInteraction("name", "blur")}
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => handleFieldChange("email", e.target.value)}
        onFocus={() =>
          formObservability.trackFieldInteraction("email", "focus")
        }
        onBlur={() => formObservability.trackFieldInteraction("email", "blur")}
      />
      <textarea
        placeholder="Message"
        value={formData.message}
        onChange={(e) => handleFieldChange("message", e.target.value)}
        onFocus={() =>
          formObservability.trackFieldInteraction("message", "focus")
        }
        onBlur={() =>
          formObservability.trackFieldInteraction("message", "blur")
        }
      />
      <button type="submit">Submit</button>
    </form>
  );
}

// Example 3: API Service with tracing
export class UserService {
  static async getUser(id: string) {
    return tracingUtils.traceApiCall("GET", `/api/users/${id}`, async () => {
      logger.info("Fetching user data", { userId: id }, "UserService");

      const response = await fetch(`/api/users/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }

      const userData = await response.json();

      // Track user data metrics
      metricsUtils.trackBusinessMetric(
        "user.data.size",
        JSON.stringify(userData).length,
        { user_id: id },
      );

      return userData;
    });
  }

  static async updateUser(id: string, data: any) {
    return tracingUtils.traceApiCall("PUT", `/api/users/${id}`, async () => {
      const span = tracer.getActiveSpan();

      if (span) {
        span.setTags({
          "user.id": id,
          "update.fields": Object.keys(data).join(","),
          "update.field_count": Object.keys(data).length,
        });
      }

      logger.info(
        "Updating user data",
        {
          userId: id,
          fields: Object.keys(data),
        },
        "UserService",
      );

      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.statusText}`);
      }

      const result = await response.json();

      // Track update metrics
      metricsUtils.trackBusinessMetric("user.updates.completed", 1, {
        user_id: id,
        fields_updated: Object.keys(data).length.toString(),
      });

      return result;
    });
  }
}

// Example 4: Custom hook with observability
export function useUserPreferences(userId: string) {
  const observability = useObservability("useUserPreferences");
  const [preferences, setPreferences] = useState<Record<string, any> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const data = await observability.traceApiCall(
        "GET",
        `/api/users/${userId}/preferences`,
        async () => {
          const response = await fetch(`/api/users/${userId}/preferences`);
          return response.json();
        },
        { userId, hook: "useUserPreferences" },
      );

      setPreferences(data);

      // Track preference metrics
      observability.metrics.recordMetric(
        "user.preferences.count",
        Object.keys(data).length,
        { user_id: userId },
      );
    } catch (error) {
      observability.log.error("Failed to load preferences", error as Error, {
        userId,
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: string, value: any) => {
    return observability.traceBusinessLogic(
      "update_preference",
      async () => {
        const response = await fetch(`/api/users/${userId}/preferences`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [key]: value }),
        });

        if (!response.ok) {
          throw new Error("Failed to update preference");
        }

        const newPreferences = { ...(preferences || {}), [key]: value };
        setPreferences(newPreferences);

        observability.log.info("Preference updated", { key, userId });
        observability.metrics.incrementCounter("user.preferences.updated", {
          preference_key: key,
          user_id: userId,
        });

        return newPreferences;
      },
      { key, userId, previousValue: preferences?.[key] },
    );
  };

  return {
    preferences,
    loading,
    updatePreference,
  };
}

// Example 5: Performance monitoring component
export function PerformanceCriticalComponent() {
  const observability = useObservability("PerformanceCriticalComponent");

  const performExpensiveCalculation = () => {
    // Track performance of critical operations
    const timer = observability.metrics.createTimer(
      "expensive.calculation.duration",
    );

    try {
      // Simulate expensive calculation
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.random();
      }

      // Record success metrics
      observability.metrics.incrementCounter("expensive.calculation.success");
      observability.log.debug("Expensive calculation completed", { result });

      return result;
    } catch (error) {
      observability.log.error("Expensive calculation failed", error as Error);
      observability.metrics.incrementCounter("expensive.calculation.error");
      throw error;
    } finally {
      timer();
    }
  };

  useEffect(() => {
    // Track component lifecycle with performance monitoring
    const componentTimer = observability.metrics.createTimer(
      "component.lifecycle.mount",
    );

    observability.log.info("Performance critical component mounted");

    // Simulate some initialization work
    setTimeout(() => {
      componentTimer();
      observability.log.info("Component initialization completed");
    }, 100);

    return () => {
      observability.log.info("Performance critical component unmounted");
    };
  }, []);

  return (
    <div>
      <button onClick={performExpensiveCalculation}>Perform Calculation</button>
    </div>
  );
}

// Example 6: Global observability setup
export function initializeObservability() {
  // Configure tracing for production
  if (import.meta.env.PROD) {
    const { ExternalTracingTransport } = require("@/lib/tracing");

    tracer.addTransport(
      new ExternalTracingTransport("jaeger", {
        endpoint: "/api/traces",
        serviceName: "devnest-frontend",
        environment: "production",
      }),
    );
  }

  // Configure metrics for production
  if (import.meta.env.PROD) {
    const { PrometheusTransport } = require("@/lib/metrics");

    metrics.addTransport(
      new PrometheusTransport({
        endpoint: "/api/metrics",
      }),
    );
  }

  // Set up global error tracking
  window.addEventListener("error", (event) => {
    const errorSpan = tracer.startSpan("window.error", {
      tags: {
        "error.message": event.message,
        "error.filename": event.filename,
        "error.lineno": event.lineno?.toString() || "",
        "error.colno": event.colno?.toString() || "",
      },
    });

    errorSpan.setError(event.error);

    metricsUtils.trackError("GlobalError", "Window", "high");

    logger.error(
      "Global error caught",
      event.error,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      "GlobalErrorHandler",
    );

    errorSpan.finish();
  });

  // Set up unhandled promise rejection tracking
  window.addEventListener("unhandledrejection", (event) => {
    const errorSpan = tracer.startSpan("unhandled.promise.rejection", {
      tags: {
        "error.reason": String(event.reason),
      },
    });

    if (event.reason instanceof Error) {
      errorSpan.setError(event.reason);
    }

    metricsUtils.trackError("UnhandledPromiseRejection", "Promise", "high");

    logger.error(
      "Unhandled promise rejection",
      event.reason,
      {
        type: typeof event.reason,
      },
      "GlobalErrorHandler",
    );

    errorSpan.finish();
  });

  // Track initial page load metrics
  metricsUtils.trackWebVitals();

  // Set up periodic memory usage tracking
  setInterval(() => {
    metricsUtils.trackMemoryUsage();
  }, 30000); // Every 30 seconds

  logger.info(
    "Observability system initialized",
    {
      environment: import.meta.env.MODE,
      tracingEnabled: tracer !== null,
      metricsEnabled: metrics !== null,
    },
    "ObservabilitySystem",
  );
}

// Example 7: Integration with React Query
export function setupReactQueryObservability(queryClient: any) {
  queryClient.setDefaultOptions({
    queries: {
      onError: (error: any, query: any) => {
        const errorSpan = tracer.startSpan("react-query.error", {
          tags: {
            "query.key": JSON.stringify(query.queryKey),
            "error.name": error.name,
            "error.message": error.message,
          },
        });

        errorSpan.setError(error);

        metricsUtils.trackError("ReactQueryError", "ReactQuery", "medium");

        logger.error(
          "React Query error",
          error,
          {
            queryKey: query.queryKey,
            queryHash: query.queryHash,
          },
          "ReactQuery",
        );

        errorSpan.finish();
      },
      onSuccess: (data: any, query: any) => {
        metricsUtils.trackBusinessMetric("react_query.success", 1, {
          query_key: JSON.stringify(query.queryKey),
        });

        logger.debug(
          "React Query success",
          {
            queryKey: query.queryKey,
            dataSize: JSON.stringify(data).length,
          },
          "ReactQuery",
        );
      },
    },
  });
}
