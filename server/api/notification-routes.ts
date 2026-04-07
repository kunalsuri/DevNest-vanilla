/**
 * Notification API Routes
 *
 * Provides endpoints for reading and managing in-app notifications.
 * All routes require authentication.
 */

import { Express, Request, Response, NextFunction } from "express";
import { authenticate } from "../auth/auth-middleware";
import { notificationService } from "../services/notification-service";
import logger from "../logger";

export function setupNotificationRoutes(app: Express): void {
  /**
   * GET /api/notifications
   * Get all notifications for the current user.
   */
  app.get(
    "/api/notifications",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const notifications = await notificationService.getForUser(
          req.jwtUser!.userId,
        );
        res.json({ notifications });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read. Must be registered BEFORE /:id/read.
   */
  app.patch(
    "/api/notifications/read-all",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await notificationService.markAllRead(req.jwtUser!.userId);
        res.json({ message: "All notifications marked as read" });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read.
   */
  app.patch(
    "/api/notifications/:id/read",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ok = await notificationService.markRead(
          req.params.id as string,
          req.jwtUser!.userId,
        );
        if (!ok) {
          res
            .status(404)
            .json({ message: "Notification not found", code: "NOT_FOUND" });
          return;
        }
        res.json({ message: "Notification marked as read" });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * DELETE /api/notifications/:id
   * Delete a notification.
   */
  app.delete(
    "/api/notifications/:id",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ok = await notificationService.delete(
          req.params.id as string,
          req.jwtUser!.userId,
        );
        if (!ok) {
          res
            .status(404)
            .json({ message: "Notification not found", code: "NOT_FOUND" });
          return;
        }
        res.json({ message: "Notification deleted" });
      } catch (err) {
        next(err);
      }
    },
  );

  logger.info("Notification routes registered");
}
