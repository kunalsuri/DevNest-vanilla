/**
 * Subscription API Routes (Placeholder)
 *
 * Provides endpoints for reading plan information and user subscriptions.
 * Connect to a real billing provider (Stripe, Paddle, etc.) to extend this.
 */

import { Express, Request, Response, NextFunction } from "express";
import { authenticate } from "../auth/auth-middleware";
import { subscriptionService } from "../services/subscription-service";
import logger from "../logger";

export function setupSubscriptionRoutes(app: Express): void {
  /**
   * GET /api/subscription/plans
   * Returns all available plans. Public endpoint.
   */
  app.get(
    "/api/subscription/plans",
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        res.json({ plans: subscriptionService.getPlans() });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * GET /api/subscription
   * Returns the current user's active subscription.
   * Auto-creates a free subscription if none exists.
   */
  app.get(
    "/api/subscription",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        let sub = await subscriptionService.getSubscription(
          req.jwtUser!.userId,
        );
        if (!sub) {
          sub = await subscriptionService.createFreeSubscription(
            req.jwtUser!.userId,
          );
        }
        const plan = subscriptionService.getPlan(sub.planId);
        res.json({ subscription: sub, plan });
      } catch (err) {
        next(err);
      }
    },
  );

  logger.info("Subscription routes registered");
}
