/**
 * Health Check Endpoints
 * Provides monitoring endpoints for application health and readiness
 */

import { Request, Response } from "express";

// Safe logger function that doesn't throw in test environments
const safeLog = (
  level: "info" | "warn" | "error",
  message: string,
  meta?: any,
) => {
  try {
    const logger = require("./logger").default;
    logger[level](message, meta);
  } catch {
    // Silently fail in test environments where logger might not be available
    if (process.env.NODE_ENV !== "test") {
      console[level === "info" ? "log" : level](message, meta);
    }
  }
};

// Safe session manager getter
const getSessionManager = () => {
  try {
    return require("./auth/session-manager").sessionManager;
  } catch {
    return null;
  }
};

interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: number;
  checks?: {
    sessionManager?: boolean;
    memory?: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  error?: string;
}

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
/**
 * Basic health check endpoint
 * Returns 200 if the application is running
 */
export async function handleHealthCheck(
  _req: Request,
  res: Response,
): Promise<void> {
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  res.status(200).json(health);
}

/**
 * Readiness check endpoint
 * Verifies all critical dependencies are available
 * Useful for Kubernetes readiness probes and load balancers
 */
export async function handleReadinessCheck(
  _req: Request,
  res: Response,
): Promise<void> {
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {},
  };

  try {
    // Check session manager availability
    const sessionCheck = checkSessionManager();
    if (health.checks) {
      health.checks.sessionManager = sessionCheck;
    }

    // Check memory usage
    const memoryCheck = checkMemory();
    if (health.checks) {
      health.checks.memory = memoryCheck;
    }

    // If any check fails, mark as unhealthy
    if (!sessionCheck || memoryCheck.percentage > 90) {
      health.status = "unhealthy";
      res.status(503).json(health);
      safeLog("warn", "Readiness check failed", { health });
      return;
    }

    res.status(200).json(health);
  } catch (error) {
    health.status = "unhealthy";
    health.error =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(503).json(health);
    safeLog("error", "Readiness check error", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Check session manager availability
 */
function checkSessionManager(): boolean {
  try {
    // Check if session manager is initialized
    const sm = getSessionManager();
    return sm !== undefined && sm !== null;
  } catch (error) {
    safeLog("error", "Session manager health check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Check memory usage
 */
function checkMemory(): {
  used: number;
  total: number;
  percentage: number;
} {
  const usage = process.memoryUsage();
  const totalMemory = usage.heapTotal;
  const usedMemory = usage.heapUsed;
  const percentage = Math.round((usedMemory / totalMemory) * 100);

  return {
    used: Math.round(usedMemory / 1024 / 1024), // MB
    total: Math.round(totalMemory / 1024 / 1024), // MB
    percentage,
  };
}
