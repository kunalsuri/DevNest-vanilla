/**
 * Admin API Routes
 *
 * Provides admin-only endpoints for user management and system statistics.
 * All routes require validateAccessToken + requireAdmin middleware.
 */

import { Express, Request, Response, NextFunction } from "express";
import {
  validateAccessToken,
  requireAdmin,
  validateCSRF,
} from "../auth/auth-middleware";
import { storage } from "../storage";
import { auditLogService } from "../services/audit-log-service";
import { authService } from "../services/auth-service";
import logger from "../logger";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  role: z.enum(["user", "admin"]).optional(),
  age: z.number().int().min(16).max(80).nullable().optional(),
  officeLocation: z.string().max(100).nullable().optional(),
  position: z.string().max(100).nullable().optional(),
  department: z.string().max(100).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
});

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(["user", "admin"]).default("user"),
  age: z.number().int().min(16).max(80).nullable().optional(),
  officeLocation: z.string().max(100).nullable().optional(),
  position: z.string().max(100).nullable().optional(),
  department: z.string().max(100).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
});

export function setupAdminRoutes(app: Express): void {
  /**
   * GET /api/admin/users
   * List all users (passwords stripped).
   */
  app.get(
    "/api/admin/users",
    validateAccessToken,
    requireAdmin,
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const limit = Math.min(Number(_req.query.limit) || 50, 200);
        const offset = Math.max(Number(_req.query.offset) || 0, 0);
        const allUsers = await storage.getAllUsers();
        const safeUsers = allUsers
          .slice(offset, offset + limit)
          .map(({ password: _p, ...rest }) => rest);
        res.json({ users: safeUsers, total: allUsers.length, limit, offset });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * GET /api/admin/users/:id
   * Get a single user by ID.
   */
  app.get(
    "/api/admin/users/:id",
    validateAccessToken,
    requireAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await storage.getUser(req.params.id as string);
        if (!user) {
          res
            .status(404)
            .json({ message: "User not found", code: "USER_NOT_FOUND" });
          return;
        }
        const { password: _p, ...safeUser } = user;
        res.json(safeUser);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * PATCH /api/admin/users/:id/role
   * Update a user's role. Admins cannot demote themselves.
   */
  app.patch(
    "/api/admin/users/:id/role",
    validateAccessToken,
    requireAdmin,
    validateCSRF,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = updateRoleSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            message: "Invalid role",
            code: "VALIDATION_ERROR",
            errors: parsed.error.issues,
          });
          return;
        }

        if (
          req.jwtUser!.userId === (req.params.id as string) &&
          parsed.data.role !== "admin"
        ) {
          res.status(400).json({
            message: "Cannot change your own role",
            code: "INVALID_OPERATION",
          });
          return;
        }

        const updated = await storage.updateUser(req.params.id as string, {
          role: parsed.data.role,
        });
        if (!updated) {
          res
            .status(404)
            .json({ message: "User not found", code: "USER_NOT_FOUND" });
          return;
        }

        await auditLogService.log({
          timestamp: new Date().toISOString(),
          userId: req.jwtUser!.userId,
          username: req.jwtUser!.username,
          action: "admin.update_role",
          ip: req.ip ?? null,
          userAgent: req.headers["user-agent"] ?? null,
          success: true,
          metadata: {
            targetUserId: req.params.id as string,
            newRole: parsed.data.role,
          },
        });

        const { password: _p, ...safeUser } = updated;
        res.json(safeUser);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * DELETE /api/admin/users/:id
   * Delete a user. Admins cannot delete themselves.
   */
  app.delete(
    "/api/admin/users/:id",
    validateAccessToken,
    requireAdmin,
    validateCSRF,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (req.jwtUser!.userId === (req.params.id as string)) {
          res.status(400).json({
            message: "Cannot delete your own account via the admin panel",
            code: "INVALID_OPERATION",
          });
          return;
        }

        const userId = req.params.id as string;
        const user = await storage.getUser(userId);
        if (!user) {
          res
            .status(404)
            .json({ message: "User not found", code: "USER_NOT_FOUND" });
          return;
        }

        await storage.deleteUser(userId);

        await auditLogService.log({
          timestamp: new Date().toISOString(),
          userId: req.jwtUser!.userId,
          username: req.jwtUser!.username,
          action: "admin.delete_user",
          ip: req.ip ?? null,
          userAgent: req.headers["user-agent"] ?? null,
          success: true,
          metadata: {
            deletedUserId: userId,
            deletedUsername: user.username,
          },
        });

        res.json({ message: "User deleted", code: "USER_DELETED" });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * POST /api/admin/users
   * Create a new user.
   */
  app.post(
    "/api/admin/users",
    validateAccessToken,
    requireAdmin,
    validateCSRF,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = createUserSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            message: "Validation error",
            code: "VALIDATION_ERROR",
            errors: parsed.error.issues,
          });
          return;
        }

        const { role, ...registerData } = parsed.data;
        const result = await authService.register(registerData);

        // Set the requested role if it differs from the default
        if (role !== "user") {
          await storage.updateUser(result.user.id, { role });
        }

        await auditLogService.log({
          timestamp: new Date().toISOString(),
          userId: req.jwtUser!.userId,
          username: req.jwtUser!.username,
          action: "admin.create_user",
          ip: req.ip ?? null,
          userAgent: req.headers["user-agent"] ?? null,
          success: true,
          metadata: {
            createdUserId: result.user.id,
            createdUsername: result.user.username,
          },
        });

        const createdUser = await storage.getUser(result.user.id);
        if (!createdUser) {
          res.status(500).json({
            message: "User created but not found",
            code: "INTERNAL_ERROR",
          });
          return;
        }
        const { password: _p, ...safeUser } = createdUser;
        res.status(201).json(safeUser);
      } catch (err) {
        if (err instanceof Error && err.message.includes("already exists")) {
          const isUsername = err.message.toLowerCase().includes("username");
          res.status(400).json({
            message: err.message,
            code: isUsername ? "USERNAME_EXISTS" : "EMAIL_EXISTS",
          });
          return;
        }
        next(err);
      }
    },
  );

  /**
   * PATCH /api/admin/users/:id
   * Update user info (firstName, lastName, email, role).
   */
  app.patch(
    "/api/admin/users/:id",
    validateAccessToken,
    requireAdmin,
    validateCSRF,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = updateUserSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            message: "Validation error",
            code: "VALIDATION_ERROR",
            errors: parsed.error.issues,
          });
          return;
        }

        const userId = req.params.id as string;
        const updated = await storage.updateUser(userId, parsed.data);
        if (!updated) {
          res
            .status(404)
            .json({ message: "User not found", code: "USER_NOT_FOUND" });
          return;
        }

        await auditLogService.log({
          timestamp: new Date().toISOString(),
          userId: req.jwtUser!.userId,
          username: req.jwtUser!.username,
          action: "admin.update_user",
          ip: req.ip ?? null,
          userAgent: req.headers["user-agent"] ?? null,
          success: true,
          metadata: { targetUserId: userId, changes: parsed.data },
        });

        const { password: _p, ...safeUser } = updated;
        res.json(safeUser);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * GET /api/admin/stats
   * Basic system statistics.
   */
  app.get(
    "/api/admin/stats",
    validateAccessToken,
    requireAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const users = await storage.getAllUsers();
        const adminCount = users.filter((u) => u.role === "admin").length;
        const userCount = users.filter((u) => u.role !== "admin").length;
        res.json({
          users: { total: users.length, admins: adminCount, users: userCount },
          server: {
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
          },
        });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * GET /api/admin/audit-log
   * Retrieve recent audit log entries.
   */
  app.get(
    "/api/admin/audit-log",
    validateAccessToken,
    requireAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const limit = Math.min(Number(req.query.limit) || 100, 500);
        const entries = await auditLogService.getRecentEntries(limit);
        res.json({ entries, total: entries.length });
      } catch (err) {
        next(err);
      }
    },
  );

  logger.info("Admin routes registered");
}
