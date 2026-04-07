/**
 * Feature Flags Admin Routes
 *
 * Admin-only HTTP API for runtime management of feature flags.
 * All routes require validateAccessToken + requireAdmin middleware.
 *
 * Endpoints:
 *   GET    /api/admin/feature-flags            – list all flags
 *   GET    /api/admin/feature-flags/:key       – get a single flag
 *   POST   /api/admin/feature-flags            – create / upsert a flag
 *   PUT    /api/admin/feature-flags/:key       – replace a flag
 *   PATCH  /api/admin/feature-flags/:key       – partial update a flag
 *   DELETE /api/admin/feature-flags/:key       – remove a flag
 */

import { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../auth/auth-middleware";
import { featureFlagService } from "../services";
import { auditLogService } from "../services/audit-log-service";
import logger from "../logger";

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------
const featureFlagSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9_-]+$/,
      "Key must be lowercase alphanumeric with underscores/hyphens",
    ),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  enabled: z.boolean(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  enabledForUsers: z.array(z.string()).optional(),
  enabledForRoles: z.array(z.string()).optional(),
  environments: z.array(z.string()).optional(),
});

const featureFlagPatchSchema = featureFlagSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// ---------------------------------------------------------------------------
// Route setup
// ---------------------------------------------------------------------------
export function setupFeatureFlagAdminRoutes(app: Express): void {
  /**
   * GET /api/admin/feature-flags
   * List all feature flags.
   */
  app.get(
    "/api/admin/feature-flags",
    authenticate,
    requireAdmin,
    (_req: Request, res: Response, next: NextFunction) => {
      try {
        const flags = featureFlagService.getAllFlags();
        res.json({ flags, total: flags.length });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * GET /api/admin/feature-flags/:key
   * Get a single feature flag by key.
   */
  app.get(
    "/api/admin/feature-flags/:key",
    authenticate,
    requireAdmin,
    (req: Request, res: Response, next: NextFunction) => {
      try {
        const flag = featureFlagService.getFlag(req.params.key as string);
        if (!flag) {
          res.status(404).json({
            message: "Feature flag not found",
            code: "FLAG_NOT_FOUND",
          });
          return;
        }
        res.json(flag);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * POST /api/admin/feature-flags
   * Create or upsert a feature flag.
   */
  app.post(
    "/api/admin/feature-flags",
    authenticate,
    requireAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = featureFlagSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            message: "Validation error",
            code: "VALIDATION_ERROR",
            errors: parsed.error.issues,
          });
          return;
        }

        const existing = featureFlagService.getFlag(parsed.data.key);
        await featureFlagService.setFlag(parsed.data);

        await auditLogService.log({
          timestamp: new Date().toISOString(),
          userId: req.jwtUser!.userId,
          username: req.jwtUser!.username,
          action: existing
            ? "admin.feature_flag.update"
            : "admin.feature_flag.create",
          ip: req.ip ?? null,
          userAgent: req.headers["user-agent"] ?? null,
          success: true,
          metadata: { key: parsed.data.key, enabled: parsed.data.enabled },
        });

        const status = existing ? 200 : 201;
        res.status(status).json(featureFlagService.getFlag(parsed.data.key));
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * PUT /api/admin/feature-flags/:key
   * Replace a feature flag (full update). Returns 404 if the flag does not exist.
   */
  app.put(
    "/api/admin/feature-flags/:key",
    authenticate,
    requireAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = req.params.key as string;
        if (!featureFlagService.getFlag(key)) {
          res.status(404).json({
            message: "Feature flag not found",
            code: "FLAG_NOT_FOUND",
          });
          return;
        }

        const parsed = featureFlagSchema.safeParse({ ...req.body, key });
        if (!parsed.success) {
          res.status(400).json({
            message: "Validation error",
            code: "VALIDATION_ERROR",
            errors: parsed.error.issues,
          });
          return;
        }

        await featureFlagService.setFlag(parsed.data);

        await auditLogService.log({
          timestamp: new Date().toISOString(),
          userId: req.jwtUser!.userId,
          username: req.jwtUser!.username,
          action: "admin.feature_flag.update",
          ip: req.ip ?? null,
          userAgent: req.headers["user-agent"] ?? null,
          success: true,
          metadata: { key, enabled: parsed.data.enabled },
        });

        res.json(featureFlagService.getFlag(key));
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * PATCH /api/admin/feature-flags/:key
   * Partially update a feature flag (e.g. just toggle enabled).
   */
  app.patch(
    "/api/admin/feature-flags/:key",
    authenticate,
    requireAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = req.params.key as string;
        const existing = featureFlagService.getFlag(key);
        if (!existing) {
          res.status(404).json({
            message: "Feature flag not found",
            code: "FLAG_NOT_FOUND",
          });
          return;
        }

        const parsed = featureFlagPatchSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            message: "Validation error",
            code: "VALIDATION_ERROR",
            errors: parsed.error.issues,
          });
          return;
        }

        await featureFlagService.setFlag({ ...existing, ...parsed.data, key });

        await auditLogService.log({
          timestamp: new Date().toISOString(),
          userId: req.jwtUser!.userId,
          username: req.jwtUser!.username,
          action: "admin.feature_flag.patch",
          ip: req.ip ?? null,
          userAgent: req.headers["user-agent"] ?? null,
          success: true,
          metadata: { key, changes: parsed.data },
        });

        res.json(featureFlagService.getFlag(key));
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * DELETE /api/admin/feature-flags/:key
   * Remove a feature flag permanently.
   */
  app.delete(
    "/api/admin/feature-flags/:key",
    authenticate,
    requireAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = req.params.key as string;
        const deleted = await featureFlagService.removeFlag(key);
        if (!deleted) {
          res.status(404).json({
            message: "Feature flag not found",
            code: "FLAG_NOT_FOUND",
          });
          return;
        }

        await auditLogService.log({
          timestamp: new Date().toISOString(),
          userId: req.jwtUser!.userId,
          username: req.jwtUser!.username,
          action: "admin.feature_flag.delete",
          ip: req.ip ?? null,
          userAgent: req.headers["user-agent"] ?? null,
          success: true,
          metadata: { key },
        });

        res.json({ message: "Feature flag deleted", code: "FLAG_DELETED" });
      } catch (err) {
        next(err);
      }
    },
  );

  logger.info("Feature flag admin routes registered");
}
