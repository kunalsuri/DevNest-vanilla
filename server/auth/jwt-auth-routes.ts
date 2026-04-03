// server/auth/jwt-auth-routes.ts
import { Express, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { jwtRegisterSchema, jwtLoginSchema, PublicUser } from "@shared/schema";
import { authService } from "../services";
import { userService } from "../services";
import { verifyRefreshToken } from "./jwt-utils";
import logger from "../logger";
import { z } from "zod";
import {
  validateRegister,
  validateLogin,
  handleValidationErrors,
} from "../middleware/validation";
import { validateAccessToken, requireAdmin } from "./auth-middleware";

/** Helper: set HTTP-only refresh token + JS-readable CSRF cookies */
function setAuthCookies(
  res: Response,
  refreshToken: string,
  csrfToken: string,
): void {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOpts = {
    secure: isProduction,
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
  res.cookie("refreshToken", refreshToken, { ...cookieOpts, httpOnly: true });
  res.cookie("csrfToken", csrfToken, { ...cookieOpts, httpOnly: false });
}

/**
 * Setup JWT-based authentication routes
 */
export function setupJWTAuthRoutes(app: Express): void {
  // Add cookie parser middleware
  app.use(cookieParser());

  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       400:
   *         description: Username or email already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // JWT Register endpoint
  app.post(
    "/api/auth/register",
    validateRegister,
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const validatedData = jwtRegisterSchema.parse(req.body);
        const result = await authService.register(
          validatedData,
          req.headers["user-agent"],
          req.ip,
        );
        setAuthCookies(res, result.refreshToken, result.csrfToken);
        res.status(201).json({
          user: result.user as PublicUser,
          accessToken: result.accessToken,
          csrfToken: result.csrfToken,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({
            message: "Validation error",
            errors: error.issues,
            code: "VALIDATION_ERROR",
          });
          return;
        }
        if (
          error instanceof Error &&
          error.message.includes("already exists")
        ) {
          const isUsername = error.message.toLowerCase().includes("username");
          res.status(400).json({
            message: error.message,
            code: isUsername ? "USERNAME_EXISTS" : "EMAIL_EXISTS",
          });
          return;
        }
        next(error);
      }
    },
  );

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // JWT Login endpoint
  app.post(
    "/api/auth/login",
    validateLogin,
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const validatedData = jwtLoginSchema.parse(req.body);
        const result = await authService.login(
          validatedData,
          req.headers["user-agent"],
          req.ip,
        );
        setAuthCookies(res, result.refreshToken, result.csrfToken);
        res.json({
          user: result.user as PublicUser,
          accessToken: result.accessToken,
          csrfToken: result.csrfToken,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({
            message: "Validation error",
            errors: error.issues,
            code: "VALIDATION_ERROR",
          });
          return;
        }
        if (error instanceof Error && error.message === "Invalid credentials") {
          res.status(401).json({
            message: "Invalid credentials",
            code: "INVALID_CREDENTIALS",
          });
          return;
        }
        next(error);
      }
    },
  );

  // JWT Refresh endpoint
  app.post(
    "/api/auth/refresh",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const incomingRefreshToken = req.cookies.refreshToken;

        if (!incomingRefreshToken) {
          res.clearCookie("refreshToken", { path: "/" });
          res.clearCookie("csrfToken", { path: "/" });
          res.status(401).json({
            message: "Refresh token required",
            code: "MISSING_REFRESH_TOKEN",
          });
          return;
        }

        const result = await authService.refreshToken(incomingRefreshToken);
        setAuthCookies(res, result.refreshToken, result.csrfToken);
        res.json({
          user: result.user as PublicUser,
          accessToken: result.accessToken,
          csrfToken: result.csrfToken,
        });
      } catch (error) {
        res.clearCookie("refreshToken", { path: "/" });
        res.clearCookie("csrfToken", { path: "/" });
        if (
          error instanceof Error &&
          (error.message.includes("Invalid refresh token") ||
            error.message.includes("session revoked"))
        ) {
          res.status(401).json({
            message: error.message,
            code: "INVALID_REFRESH_TOKEN",
          });
          return;
        }
        next(error);
      }
    },
  );

  // JWT Logout endpoint
  app.post(
    "/api/auth/logout",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await authService.logout(req.cookies.refreshToken);
        res.clearCookie("refreshToken");
        res.clearCookie("csrfToken");
        res.json({
          message: "Logged out successfully",
          code: "LOGOUT_SUCCESS",
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // Get current user endpoint (using JWT)
  app.get(
    "/api/auth/user",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
          res.status(401).json({
            message: "Access token required",
            code: "MISSING_TOKEN",
          });
          return;
        }

        const user = await authService.getUserFromToken(authHeader.slice(7));
        res.json(user as PublicUser);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Invalid access token"
        ) {
          res
            .status(401)
            .json({ message: "Invalid access token", code: "INVALID_TOKEN" });
          return;
        }
        if (error instanceof Error && error.message === "User not found") {
          res
            .status(401)
            .json({ message: "User not found", code: "USER_NOT_FOUND" });
          return;
        }
        next(error);
      }
    },
  );

  // Logout from all sessions
  app.post(
    "/api/auth/logout-all",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
          res.status(401).json({
            message: "Access token required",
            code: "MISSING_TOKEN",
          });
          return;
        }

        await authService.logoutAll(authHeader.slice(7));
        res.clearCookie("refreshToken");
        res.clearCookie("csrfToken");
        res.json({
          message: "Logged out from all sessions",
          code: "LOGOUT_ALL_SUCCESS",
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Invalid access token"
        ) {
          res
            .status(401)
            .json({ message: "Invalid access token", code: "INVALID_TOKEN" });
          return;
        }
        next(error);
      }
    },
  );

  // Cleanup expired sessions endpoint (admin only)
  app.post(
    "/api/auth/cleanup-sessions",
    validateAccessToken,
    requireAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { sessionManager } = await import("./session-manager");
        await sessionManager.cleanupSessions();
        res.json({
          message: "Sessions cleaned up successfully",
          code: "CLEANUP_SUCCESS",
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // Password reset request endpoint
  app.post(
    "/api/auth/password-reset/request",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { passwordResetRequestSchema } = await import("@shared/schema");
        const validatedData = passwordResetRequestSchema.parse(req.body);
        await authService.requestPasswordReset(validatedData.email);
        res.json({
          message:
            "If your email is registered, you will receive reset instructions",
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res
            .status(400)
            .json({ message: "Validation error", errors: error.issues });
          return;
        }
        next(error);
      }
    },
  );

  // Password reset confirm endpoint
  app.post(
    "/api/auth/password-reset/confirm",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { passwordResetConfirmSchema } = await import("@shared/schema");
        const validatedData = passwordResetConfirmSchema.parse(req.body);
        await authService.confirmPasswordReset(
          validatedData.token,
          validatedData.password,
        );
        res.json({ message: "Password reset successful" });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res
            .status(400)
            .json({ message: "Validation error", errors: error.issues });
          return;
        }
        if (
          error instanceof Error &&
          (error.message.includes("reset token") ||
            error.message === "User not found")
        ) {
          res.status(400).json({ message: error.message });
          return;
        }
        next(error);
      }
    },
  );
}
