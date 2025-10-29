/**
 * Real-world Integration Examples for DevNest Logging System
 *
 * This file demonstrates how to integrate the comprehensive logging system
 * into actual React components and services.
 */

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  useLogger,
  useApiLogger,
  usePerformanceLogger,
  useFormLogger,
  useSessionLogger,
} from "@/hooks/use-logger";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";

// Example 1: Dashboard Component with Comprehensive Logging
export function EnhancedDashboard() {
  const log = useLogger("EnhancedDashboard");
  const { logPageView } = useSessionLogger();
  const { measureAsyncPerformance } = usePerformanceLogger();

  useEffect(() => {
    // Track page view for analytics
    logPageView("dashboard", {
      source: "direct_navigation",
      timestamp: new Date().toISOString(),
    });

    // Log component initialization with user context
    log.info("Dashboard initialized", {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const loadDashboardData = async () => {
    return measureAsyncPerformance(
      "dashboard_data_load",
      async () => {
        // Simulate data loading with multiple API calls
        const [userData, analytics, notifications] = await Promise.all([
          fetch("/api/user/profile").then((r) => r.json()),
          fetch("/api/analytics/summary").then((r) => r.json()),
          fetch("/api/notifications").then((r) => r.json()),
        ]);

        return { userData, analytics, notifications };
      },
      {
        userId: "current-user-id",
        dataTypes: ["profile", "analytics", "notifications"],
      },
    );
  };

  const handleQuickAction = (action: string) => {
    log.logUserAction(`dashboard_quick_${action}`, {
      buttonLocation: "header",
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="dashboard">
      <h1>Enhanced Dashboard</h1>
      <Button onClick={() => handleQuickAction("create_workspace")}>
        Create Workspace
      </Button>
    </div>
  );
}

// Example 2: API Service with Comprehensive Error Handling
export function useUserService() {
  const { logApiCall } = useApiLogger();
  const log = useLogger("UserService");

  const updateUserProfile = useMutation({
    mutationFn: async (userData: any) => {
      return logApiCall(
        "PUT",
        "/api/user/profile",
        async () => {
          const response = await fetch("/api/user/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            const error = new Error(
              `Profile update failed: ${response.status}`,
            );
            (error as any).status = response.status;
            throw error;
          }

          return response.json();
        },
        {
          userId: userData.id,
          fieldsUpdated: Object.keys(userData),
          profileSize: JSON.stringify(userData).length,
        },
      );
    },
    onSuccess: (data, variables) => {
      log.info("User profile updated successfully", {
        userId: variables.id,
        fieldsUpdated: Object.keys(variables),
        responseSize: JSON.stringify(data).length,
      });
    },
    onError: (error: any, variables) => {
      log.error("User profile update failed", error, {
        userId: variables.id,
        attemptedFields: Object.keys(variables),
        errorStatus: error.status,
        retryable: error.status >= 500,
      });
    },
  });

  return { updateUserProfile };
}

// Example 3: Form with Detailed Interaction Logging
export function UserProfileForm() {
  const formLog = useFormLogger("UserProfileForm");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      bio: "",
    },
  });

  useEffect(() => {
    formLog.logFormStart({
      formVersion: "2.1.0",
      prefilledFields: Object.keys(form.getValues()).filter((key) =>
        form.getValues(key as any),
      ),
    });
  }, []);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      formLog.logFormSubmit({
        fieldsCompleted: Object.keys(data).filter((key) => data[key]),
        formCompletionTime: Date.now() - (form as any).startTime,
        characterCount: Object.values(data).join("").length,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      formLog.logFormSuccess({
        submissionDuration: 1000,
        success: true,
      });
    } catch (error) {
      formLog.logFormError(error as Error, {
        fieldsAttempted: Object.keys(data),
        formState: "submission_failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldInteraction = (
    field: string,
    action: "focus" | "blur" | "change",
  ) => {
    formLog.logFieldInteraction(field, action, {
      fieldValue: form.getValues(field as any)?.length || 0,
      formProgress: Object.values(form.getValues()).filter(Boolean).length / 4,
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...form.register("firstName")}
        placeholder="First Name"
        onFocus={() => handleFieldInteraction("firstName", "focus")}
        onBlur={() => handleFieldInteraction("firstName", "blur")}
        onChange={(e) => {
          form.setValue("firstName", e.target.value);
          handleFieldInteraction("firstName", "change");
        }}
      />

      <Input
        {...form.register("lastName")}
        placeholder="Last Name"
        onFocus={() => handleFieldInteraction("lastName", "focus")}
        onBlur={() => handleFieldInteraction("lastName", "blur")}
      />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}

// Example 4: Real-time Feature with Performance Monitoring
export function RealtimeNotifications() {
  const log = useLogger("RealtimeNotifications");
  const { measurePerformance } = usePerformanceLogger();
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");

  useEffect(() => {
    let ws: WebSocket;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connect = () => {
      setConnectionStatus("connecting");
      log.info("Attempting WebSocket connection", {
        attempt: reconnectAttempts + 1,
        maxAttempts: maxReconnectAttempts,
      });

      ws = new WebSocket(process.env.VITE_WS_URL || "ws://localhost:3001");

      ws.onopen = () => {
        measurePerformance(
          "websocket_connection",
          () => {
            setConnectionStatus("connected");
            reconnectAttempts = 0;
          },
          {
            connectionAttempt: reconnectAttempts + 1,
            protocol: ws.protocol,
          },
        );

        log.info("WebSocket connected", {
          reconnectAttempts,
          readyState: ws.readyState,
          protocol: ws.protocol,
        });
      };

      ws.onmessage = (event) => {
        measurePerformance("message_processing", () => {
          try {
            const data = JSON.parse(event.data);
            log.debug("WebSocket message received", {
              messageType: data.type,
              messageSize: event.data.length,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            log.error("Failed to parse WebSocket message", error as Error, {
              rawMessage: event.data,
              messageLength: event.data.length,
            });
          }
        });
      };

      ws.onerror = (error) => {
        log.error("WebSocket error", error as any, {
          readyState: ws.readyState,
          reconnectAttempts,
        });
      };

      ws.onclose = (event) => {
        setConnectionStatus("disconnected");

        log.warn("WebSocket disconnected", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          reconnectAttempts,
        });

        // Exponential backoff reconnection
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts) * 1000;
          setTimeout(() => {
            reconnectAttempts++;
            connect();
          }, delay);

          log.info("Scheduling reconnection", {
            delay,
            attempt: reconnectAttempts + 1,
          });
        } else {
          log.error("Max reconnection attempts reached", null, {
            maxAttempts: maxReconnectAttempts,
            finalCode: event.code,
          });
        }
      };
    };

    connect();

    return () => {
      if (ws) {
        log.info("Closing WebSocket connection", {
          readyState: ws.readyState,
          wasConnected: connectionStatus === "connected",
        });
        ws.close(1000, "Component unmounting");
      }
    };
  }, []);

  return (
    <div className="notifications">
      <div className={`status ${connectionStatus}`}>
        Connection: {connectionStatus}
      </div>
    </div>
  );
}

// Example 5: Error Boundary with Custom Logging
export function FeatureErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="error-fallback">
          <h2>Something went wrong in this feature</h2>
          <p>This error has been logged and reported to our team.</p>
        </div>
      }
      onError={(error, errorInfo) => {
        // Custom error logging for specific features
        logger.fatal("Feature error boundary triggered", error, {
          feature: "user-profile",
          componentStack: errorInfo.componentStack,
          errorBoundaryType: "feature-level",
          userId: "current-user-id",
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        });

        // Send to external error tracking service
        if (window.gtag) {
          window.gtag("event", "exception", {
            description: error.message,
            fatal: true,
          });
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Example 6: Service Worker Registration with Logging
export function initializeServiceWorker() {
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        logger.info("Service Worker registered", {
          scope: registration.scope,
          updateViaCache: registration.updateViaCache,
          registrationTime: new Date().toISOString(),
        });

        registration.addEventListener("updatefound", () => {
          logger.info("Service Worker update found", {
            newWorkerState: registration.installing?.state,
          });
        });
      } catch (error) {
        logger.error("Service Worker registration failed", error as Error, {
          navigatorServiceWorker: "serviceWorker" in navigator,
          environment: process.env.NODE_ENV,
        });
      }
    });
  }
}

// Example 7: Global Application Initialization
export function initializeLogging() {
  // Set user context after authentication
  const setUserContext = (user: any) => {
    logger.setUserId(user.id);
    logger.info("User context set", {
      userId: user.id,
      userRole: user.role,
      sessionStart: new Date().toISOString(),
    });
  };

  // Performance monitoring for critical paths
  const monitorCriticalPath = async (
    pathName: string,
    operation: () => Promise<any>,
  ) => {
    const startTime = performance.now();

    try {
      const result = await operation();
      const duration = performance.now() - startTime;

      logger.logPerformance(pathName, duration, {
        success: true,
        resultSize: JSON.stringify(result).length,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      logger.error(`Critical path failed: ${pathName}`, error as Error, {
        duration,
        criticalPath: true,
      });

      throw error;
    }
  };

  return {
    setUserContext,
    monitorCriticalPath,
  };
}

export default {
  EnhancedDashboard,
  useUserService,
  UserProfileForm,
  RealtimeNotifications,
  FeatureErrorBoundary,
  initializeServiceWorker,
  initializeLogging,
};
