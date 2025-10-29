/**
 * Example usage of the logging system in React components
 */

import { useEffect, useState } from "react";
import {
  useLogger,
  useApiLogger,
  usePerformanceLogger,
  useFormLogger,
} from "@/hooks/use-logger";
import { logger } from "@/lib/logger";

// Example 1: Basic component logging
export function UserProfile({ userId }: { userId: string }) {
  const log = useLogger("UserProfile");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    log.info("UserProfile component mounted", { userId });

    const fetchProfile = async () => {
      try {
        log.debug("Fetching user profile", { userId });
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();

        setProfile(data);
        log.info("User profile loaded successfully", {
          userId,
          profileId: data.id,
        });
      } catch (error) {
        log.error("Failed to fetch user profile", error as Error, { userId });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, log]);

  const handleProfileUpdate = (newData: any) => {
    log.logUserAction("profile_update_started", {
      userId,
      fieldsChanged: Object.keys(newData),
    });

    // Update logic here...
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Profile UI */}
      <button onClick={() => handleProfileUpdate({ name: "New Name" })}>
        Update Profile
      </button>
    </div>
  );
}

// Example 2: API logging with performance monitoring
export function DataFetcher() {
  const log = useLogger("DataFetcher");
  const { logApiCall } = useApiLogger();
  const { measureAsyncPerformance } = usePerformanceLogger();
  const [data, setData] = useState(null);

  const fetchData = async () => {
    // Measure performance of the entire operation
    await measureAsyncPerformance(
      "fetch_dashboard_data",
      async () => {
        // Log API call with automatic request/response tracking
        const result = await logApiCall(
          "GET",
          "/api/dashboard/data",
          async () => {
            return fetch("/api/dashboard/data").then((res) => res.json());
          },
          {
            component: "DataFetcher",
            cached: false,
          },
        );

        setData(result);
        log.info("Dashboard data loaded", {
          recordCount: result.length,
          loadTime: Date.now(),
        });
      },
      {
        dataSize: data ? JSON.stringify(data).length : 0,
        cached: false,
      },
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  return <div>{/* Data display */}</div>;
}

// Example 3: Form logging
export function ContactForm() {
  const formLog = useFormLogger("ContactForm");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  useEffect(() => {
    formLog.logFormStart({ formVersion: "2.1" });
  }, [formLog]);

  const handleFieldChange = (field: string, value: string) => {
    formLog.logFieldInteraction(field, "change", {
      valueLength: value.length,
      hasValue: !!value,
    });

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      formLog.logFormSubmit({
        success: true,
        responseStatus: response.status,
      });

      // Success handling
    } catch (error) {
      formLog.logFormError(error as Error, {
        formData: {
          hasName: !!formData.name,
          hasEmail: !!formData.email,
          messageLength: formData.message.length,
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => handleFieldChange("name", e.target.value)}
        onFocus={() => formLog.logFieldInteraction("name", "focus")}
        onBlur={() => formLog.logFieldInteraction("name", "blur")}
      />
      {/* Other form fields */}
      <button type="submit">Submit</button>
    </form>
  );
}

// Example 4: Manual logging for complex business logic
export function PaymentProcessor() {
  const log = useLogger("PaymentProcessor");

  const processPayment = async (paymentData: any) => {
    const requestId = logger.generateRequestId();

    log.info("Payment processing started", {
      requestId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      paymentMethod: paymentData.method,
    });

    try {
      // Validate payment data
      if (!paymentData.amount || paymentData.amount <= 0) {
        throw new Error("Invalid payment amount");
      }

      log.debug("Payment validation passed", { requestId });

      // Process with external service
      const result = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (!result.ok) {
        throw new Error(`Payment processing failed: ${result.statusText}`);
      }

      const response = await result.json();

      log.info("Payment processed successfully", {
        requestId,
        transactionId: response.transactionId,
        status: response.status,
        processingTime: response.processingTime,
      });

      return response;
    } catch (error) {
      log.error("Payment processing failed", error as Error, {
        requestId,
        amount: paymentData.amount,
        paymentMethod: paymentData.method,
      });
      throw error;
    }
  };

  return <div>{/* Payment UI */}</div>;
}

// Example 5: Component with user interaction logging
export function InteractiveWidget() {
  const log = useLogger("InteractiveWidget");

  const handleButtonClick = (buttonName: string) => {
    log.logUserAction("button_click", {
      buttonName,
      timestamp: Date.now(),
      page: window.location.pathname,
    });
  };

  const handleFeatureUsage = (
    feature: string,
    metadata?: Record<string, any>,
  ) => {
    log.logUserAction("feature_used", {
      feature,
      sessionDuration: Date.now() - performance.timeOrigin,
      ...metadata,
    });
  };

  return (
    <div>
      <button onClick={() => handleButtonClick("primary_action")}>
        Primary Action
      </button>
      <button
        onClick={() =>
          handleFeatureUsage("advanced_feature", { level: "expert" })
        }
      >
        Advanced Feature
      </button>
    </div>
  );
}

// Example 6: Error boundary with custom logging
import { ErrorBoundary } from "@/components/error-boundary";

export function FeatureWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Custom error handling for this specific feature
        logger.error(
          "Feature-specific error occurred",
          error,
          {
            feature: "FeatureWrapper",
            componentStack: errorInfo.componentStack,
            props: { hasChildren: !!children },
          },
          "FeatureWrapper",
        );

        // Could also send to analytics
        // analytics.track('feature_error', { error: error.message });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Example 7: Integration with external services
export function setupExternalLogging() {
  // Add Sentry transport
  if (process.env.NODE_ENV === "production") {
    const { ExternalTransport } = require("@/lib/logger");

    const sentryTransport = new ExternalTransport("sentry", {
      // Sentry will be configured elsewhere
    });

    logger.addTransport(sentryTransport);

    // Add custom endpoint transport
    const customTransport = new ExternalTransport("custom", {
      apiEndpoint: "/api/logs",
    });

    logger.addTransport(customTransport);
  }

  // Set minimum log level for production
  if (process.env.NODE_ENV === "production") {
    logger.setMinLevel(logger.LogLevel?.WARN || 2);
  }
}

// Example 8: Performance monitoring
export function PerformanceCriticalComponent() {
  const { measurePerformance } = usePerformanceLogger();

  const expensiveCalculation = () => {
    return measurePerformance(
      "expensive_calculation",
      () => {
        // Some expensive operation
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
          result += Math.random();
        }
        return result;
      },
      {
        iterations: 1000000,
        algorithm: "random_sum",
      },
    );
  };

  return <div>{/* Component UI */}</div>;
}
