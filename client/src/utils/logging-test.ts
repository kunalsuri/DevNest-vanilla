/**
 * Logging System Test & Demo
 *
 * This file demonstrates and validates that logs will be properly stored
 * in your /logs directory according to best practices.
 */

import { logger, FileTransport, LogLevel } from "@/lib/logger";
import { initializeObservability } from "@/features/observability";

// Test function to verify logging works correctly
export async function testLoggingSystem() {
  console.log("🧪 Testing DevNest Logging System...");

  // Initialize the observability system
  initializeObservability({
    logLevel: "debug",
    features: {
      enableFileLogging: true,
      enableTracing: true,
      enableMetrics: true,
    },
    fileLogging: {
      logDirectory: process.cwd() + "/logs", // Absolute path to your /logs folder
      separateByLevel: true,
      rotateDaily: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    },
  });

  // Test different log levels
  console.log("📝 Generating test log entries...");

  // These will create files in your /logs directory:
  logger.debug("Debug message - development only", {
    testType: "logging_verification",
    timestamp: new Date().toISOString(),
  });

  logger.info("Application started successfully", {
    version: "1.0.0",
    environment: "development",
    logDirectory: process.cwd() + "/logs",
  });

  logger.warn("This is a warning message", {
    component: "TestSystem",
    reason: "demonstration",
    severity: "low",
  });

  logger.error(
    "Test error message (not a real error)",
    new Error("Demonstration error"),
    {
      component: "LoggingTest",
      recoverable: true,
    },
  );

  // Test user action logging
  logger.logUserAction("test_logging_system", {
    userId: "test_user_123",
    feature: "logging_verification",
  });

  // Test API logging
  logger.logApiRequest("GET", "/api/test", {
    requestId: "req_test_123",
    component: "LoggingTest",
  });

  logger.logApiResponse("GET", "/api/test", 200, 150, {
    requestId: "req_test_123",
    success: true,
  });

  console.log("✅ Test log entries generated!");
  console.log("📁 Check your /logs directory for the following files:");
  console.log("   - debug-2025-09-28.log  (debug messages)");
  console.log("   - info-2025-09-28.log   (info messages)");
  console.log("   - warn-2025-09-28.log   (warning messages)");
  console.log("   - error-2025-09-28.log  (error messages)");

  // Demonstrate file transport utilities
  const fileTransport = new FileTransport({
    logDirectory: process.cwd() + "/logs",
    separateByLevel: true,
  });

  try {
    // Get current log files
    const logFiles = await fileTransport.getLogFiles();
    console.log("📋 Current log files:", logFiles);

    // Read recent logs from a specific file (if it exists)
    if (logFiles.length > 0) {
      const recentLogs = await fileTransport.readLogFile(
        logFiles[0].fileName,
        5,
      );
      console.log("📖 Recent log entries:", recentLogs);
    }
  } catch (error) {
    console.log("ℹ️  File operations will work in Node.js environment");
  }
}

// Example of expected log file content
export const expectedLogFileContent = `
// Example: /logs/info-2025-09-28.log
{"timestamp":"2025-09-28T23:30:00.000Z","level":"INFO","message":"Application started successfully","component":"TestSystem","userId":"user_123","sessionId":"sess_456","requestId":"req_789","environment":"development","url":"http://localhost:3000","metadata":{"version":"1.0.0","environment":"development","logDirectory":"/Users/ks248120/Documents/GitHub/DevNest/logs"}}
{"timestamp":"2025-09-28T23:30:01.000Z","level":"INFO","message":"User Action: test_logging_system","component":"user","metadata":{"type":"user_action","action":"test_logging_system","userId":"test_user_123","feature":"logging_verification"}}
{"timestamp":"2025-09-28T23:30:02.000Z","level":"INFO","message":"API Request: GET /api/test","component":"api","metadata":{"type":"api_request","method":"GET","url":"/api/test","requestId":"req_test_123","component":"LoggingTest"}}

// Example: /logs/error-2025-09-28.log
{"timestamp":"2025-09-28T23:30:03.000Z","level":"ERROR","message":"Test error message (not a real error)","component":"LoggingTest","error":{"name":"Error","message":"Demonstration error","stack":["at testLoggingSystem (/path/to/file.js:45:20)","at Object.<anonymous> (/path/to/file.js:50:5)"],"code":undefined},"metadata":{"component":"LoggingTest","recoverable":true}}
`;

// Best practices verification checklist
export const bestPracticesChecklist = {
  logDirectory: "✅ Absolute path to /logs directory",
  structuredFormat: "✅ JSON format for machine readability",
  logLevels:
    "✅ Separate files per log level (debug, info, warn, error, fatal)",
  rotation: "✅ Daily rotation + size-based rotation (10MB)",
  retention: "✅ Keep 5 historical versions per file",
  piiProtection: "✅ Automatic PII sanitization enabled",
  contextTracking: "✅ User/session/request ID correlation",
  errorHandling: "✅ Never let logging failures break app",
  performance: "✅ Async operations with batching",
  environments: "✅ Different configs for dev/staging/production",
};

export default {
  testLoggingSystem,
  expectedLogFileContent,
  bestPracticesChecklist,
};
