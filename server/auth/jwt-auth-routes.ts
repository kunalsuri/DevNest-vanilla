// server/auth/jwt-auth-routes.ts
import { Express, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import {
  jwtRegisterSchema,
  jwtLoginSchema,
  PublicUser,
  JWTRegisterData,
  JWTLoginData,
} from "@shared/schema";
import {
  generateTokenPair,
  hashPassword,
  comparePassword,
  verifyRefreshToken,
  verifyAccessToken,
  generateCSRFToken,
} from "./jwt-utils";
import { sessionManager } from "./session-manager";
import { storage } from "../storage";
import logger from "../logger";
import { z } from "zod";
import {
  validateRegister,
  validateLogin,
  handleValidationErrors,
} from "../middleware/validation";

/**
 * Setup JWT-based authentication routes
 */
export function setupJWTAuthRoutes(app: Express): void {
  // Add cookie parser middleware
  app.use(cookieParser());

  // JWT Register endpoint
  app.post(
    "/api/auth/register",
    validateRegister,
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const validatedData: JWTRegisterData = jwtRegisterSchema.parse(
          req.body,
        );

        // Check if user already exists
        const existingUser = await storage.getUserByUsername(
          validatedData.username,
        );
        if (existingUser) {
          res.status(400).json({
            message: "Username already exists",
            code: "USERNAME_EXISTS",
          });
          return;
        }

        const existingEmail = await storage.getUserByEmail(validatedData.email);
        if (existingEmail) {
          res.status(400).json({
            message: "Email already exists",
            code: "EMAIL_EXISTS",
          });
          return;
        }

        // Hash password
        const hashedPassword = await hashPassword(validatedData.password);

        // Create user
        const user = await storage.createUser({
          ...validatedData,
          password: hashedPassword,
        });

        // Generate temporary refresh token for session creation
        const { refreshToken } = generateTokenPair({
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          sessionId: "", // Will be set after session creation
        });

        // Create session
        const session = await sessionManager.createSession(
          user.id,
          refreshToken,
          req.headers["user-agent"],
          req.ip,
        );

        // Generate new tokens with correct session ID
        const finalTokens = generateTokenPair({
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          sessionId: session.sessionId,
        });

        // Update session with final refresh token
        await sessionManager.updateSessionTokens(
          session.sessionId,
          finalTokens.refreshToken,
        );

        // Generate CSRF token
        const csrfToken = generateCSRFToken();
        await sessionManager.updateSessionTokens(
          session.sessionId,
          finalTokens.refreshToken,
          csrfToken,
        );

        // Set HTTP-only refresh token cookie
        res.cookie("refreshToken", finalTokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: "/",
        });

        // Set CSRF token cookie (readable by JS)
        res.cookie("csrfToken", csrfToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: "/",
        });

        // Return user data and access token
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({
          user: userWithoutPassword as PublicUser,
          accessToken: finalTokens.accessToken,
          csrfToken,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({
            message: "Validation error",
            errors: error.errors,
            code: "VALIDATION_ERROR",
          });
          return;
        }
        next(error);
      }
    },
  );

  // JWT Login endpoint
  app.post(
    "/api/auth/login",
    validateLogin,
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const validatedData: JWTLoginData = jwtLoginSchema.parse(req.body);

        // Find user
        const user = await storage.getUserByUsername(validatedData.username);
        if (!user) {
          res.status(401).json({
            message: "Invalid credentials",
            code: "INVALID_CREDENTIALS",
          });
          return;
        }

        // Verify password
        const isValidPassword = await comparePassword(
          validatedData.password,
          user.password,
        );
        if (!isValidPassword) {
          res.status(401).json({
            message: "Invalid credentials",
            code: "INVALID_CREDENTIALS",
          });
          return;
        }

        // Generate temporary refresh token for session creation
        const { refreshToken } = generateTokenPair({
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          sessionId: "", // Will be set after session creation
        });

        // Create session
        const session = await sessionManager.createSession(
          user.id,
          refreshToken,
          req.headers["user-agent"],
          req.ip,
        );

        // Generate final tokens with correct session ID
        const finalTokens = generateTokenPair({
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          sessionId: session.sessionId,
        });

        // Update session with final refresh token
        await sessionManager.updateSessionTokens(
          session.sessionId,
          finalTokens.refreshToken,
        );

        // Generate CSRF token
        const csrfToken = generateCSRFToken();
        await sessionManager.updateSessionTokens(
          session.sessionId,
          finalTokens.refreshToken,
          csrfToken,
        );

        // Set HTTP-only refresh token cookie
        res.cookie("refreshToken", finalTokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: "/",
        });

        // Set CSRF token cookie (readable by JS)
        res.cookie("csrfToken", csrfToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: "/",
        });

        // Return user data and access token
        const { password, ...userWithoutPassword } = user;
        res.json({
          user: userWithoutPassword as PublicUser,
          accessToken: finalTokens.accessToken,
          csrfToken,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({
            message: "Validation error",
            errors: error.errors,
            code: "VALIDATION_ERROR",
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
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
          // Clear any stale cookies
          res.clearCookie("refreshToken", { path: "/" });
          res.clearCookie("csrfToken", { path: "/" });
          res.status(401).json({
            message: "Refresh token required",
            code: "MISSING_REFRESH_TOKEN",
          });
          return;
        }

        // Verify refresh token
        const payload = verifyRefreshToken(refreshToken);
        if (!payload) {
          // Clear invalid cookies
          res.clearCookie("refreshToken", { path: "/" });
          res.clearCookie("csrfToken", { path: "/" });
          res.status(401).json({
            message: "Invalid refresh token",
            code: "INVALID_REFRESH_TOKEN",
          });
          return;
        }

        // Validate refresh token against session
        const isValidToken = await sessionManager.validateRefreshToken(
          payload.sessionId,
          refreshToken,
        );
        if (!isValidToken) {
          // Token mismatch or session not found - clear cookies and revoke session
          await sessionManager.revokeSession(payload.sessionId);
          res.clearCookie("refreshToken", { path: "/" });
          res.clearCookie("csrfToken", { path: "/" });
          res.status(401).json({
            message: "Invalid refresh token - session revoked",
            code: "TOKEN_MISMATCH",
          });
          return;
        }

        // Get user data
        const user = await storage.getUser(payload.userId);
        if (!user) {
          res.status(401).json({
            message: "User not found",
            code: "USER_NOT_FOUND",
          });
          return;
        }

        // Generate new token pair (refresh token rotation)
        const newTokens = generateTokenPair({
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          sessionId: payload.sessionId,
        });

        // Generate new CSRF token
        const newCSRFToken = generateCSRFToken();

        // Update session with new tokens
        await sessionManager.updateSessionTokens(
          payload.sessionId,
          newTokens.refreshToken,
          newCSRFToken,
        );

        // Set new HTTP-only refresh token cookie
        res.cookie("refreshToken", newTokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: "/",
        });

        // Set new CSRF token cookie
        res.cookie("csrfToken", newCSRFToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: "/",
        });

        // Return new access token and user data
        const { password, ...userWithoutPassword } = user;
        res.json({
          user: userWithoutPassword as PublicUser,
          accessToken: newTokens.accessToken,
          csrfToken: newCSRFToken,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // JWT Logout endpoint
  app.post(
    "/api/auth/logout",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
          // Verify and get session ID from refresh token
          const payload = verifyRefreshToken(refreshToken);
          if (payload) {
            await sessionManager.revokeSession(payload.sessionId);
          }
        }

        // Clear cookies
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

        const token = authHeader.slice(7);
        const payload = verifyAccessToken(token);
        if (!payload) {
          res.status(401).json({
            message: "Invalid access token",
            code: "INVALID_TOKEN",
          });
          return;
        }

        const user = await storage.getUser(payload.userId);
        if (!user) {
          res.status(401).json({
            message: "User not found",
            code: "USER_NOT_FOUND",
          });
          return;
        }

        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword as PublicUser);
      } catch (error) {
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

        const token = authHeader.slice(7);
        const payload = verifyAccessToken(token);
        if (!payload) {
          res.status(401).json({
            message: "Invalid access token",
            code: "INVALID_TOKEN",
          });
          return;
        }

        // Revoke all user sessions
        await sessionManager.revokeUserSessions(payload.userId);

        // Clear cookies
        res.clearCookie("refreshToken");
        res.clearCookie("csrfToken");

        res.json({
          message: "Logged out from all sessions",
          code: "LOGOUT_ALL_SUCCESS",
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // Cleanup expired sessions endpoint (admin only)
  app.post(
    "/api/auth/cleanup-sessions",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // This should be protected with admin middleware in a real app
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

        const user = await storage.getUserByEmail(validatedData.email);
        if (!user) {
          // Don't reveal whether email exists for security
          res.json({
            message:
              "If your email is registered, you will receive reset instructions",
          });
          return;
        }

        // Generate reset token
        const { nanoid } = await import("nanoid");
        const token = nanoid(32);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        await storage.createPasswordResetToken({
          userId: user.id,
          token,
          expiresAt,
        });

        // In a real app, you'd send an email here
        // For now, we'll log the token for testing (only in development)
        if (process.env.NODE_ENV === "development") {
          logger.info(`Password reset token for ${user.email}`, {
            email: user.email,
            token,
            resetUrl: `http://localhost:5000/auth?reset-token=${token}`,
          });
        }

        res.json({
          message:
            "If your email is registered, you will receive reset instructions",
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res
            .status(400)
            .json({ message: "Validation error", errors: error.errors });
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

        const resetToken = await storage.getPasswordResetToken(
          validatedData.token,
        );
        if (!resetToken) {
          res.status(400).json({ message: "Invalid or expired reset token" });
          return;
        }

        const user = await storage.getUser(resetToken.userId);
        if (!user) {
          res.status(400).json({ message: "User not found" });
          return;
        }

        // Update user password
        const hashedPassword = await hashPassword(validatedData.password);
        await storage.updateUserPassword(user.id, hashedPassword);

        // Delete the used token
        await storage.deletePasswordResetToken(validatedData.token);

        res.json({ message: "Password reset successful" });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res
            .status(400)
            .json({ message: "Validation error", errors: error.errors });
          return;
        }
        next(error);
      }
    },
  );
}
