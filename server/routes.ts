import { type Express, static as expressStatic } from "express";
import { createServer, type Server } from "node:http";
import { setupProfile } from "./profile";
import { setupJWTAuthRoutes } from "./auth/jwt-auth-routes";
import { sessionManager } from "./auth/session-manager";
import { handleLogSubmission, handleLogRetrieval } from "./logging-endpoint";
import { handleHealthCheck, handleReadinessCheck } from "./health";
import logger from "./logger";

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure session manager is ready
  await sessionManager.ready();

  // Health check endpoints (no auth required)
  app.get("/health", handleHealthCheck);
  app.get("/health/ready", handleReadinessCheck);

  // Setup API routes
  setupJWTAuthRoutes(app);
  setupProfile(app);

  // Setup logging endpoints for browser log persistence
  app.post("/api/logs", handleLogSubmission);
  app.get("/api/logs", handleLogRetrieval);

  // Serve uploaded profile pictures
  app.use("/uploads", expressStatic("uploads"));

  // Start session cleanup interval
  startSessionCleanup();

  const httpServer = createServer(app);
  return httpServer;
}

/**
 * Start periodic session cleanup
 */
function startSessionCleanup(): void {
  setInterval(
    async () => {
      try {
        await sessionManager.cleanupSessions();
        logger.info("Expired sessions cleaned up");
      } catch (error) {
        logger.error("Error during session cleanup", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    60 * 60 * 1000,
  ); // Every hour
}
