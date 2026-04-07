// server/auth/auth-middleware.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, extractBearerToken } from "./jwt-utils";
import { sessionManager } from "./session-manager";
import { AccessTokenPayload } from "@shared/schema";
import logger from "../logger";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      jwtUser?: AccessTokenPayload;
      sessionId?: string;
    }
  }
}

/**
 * Middleware to validate JWT access token
 */
export function validateAccessToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    res.status(401).json({
      message: "Access token required",
      code: "MISSING_TOKEN",
    });
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({
      message: "Invalid or expired access token",
      code: "INVALID_TOKEN",
    });
    return;
  }

  // Attach user info to request
  req.jwtUser = payload;
  req.sessionId = payload.sessionId;
  next();
}

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.jwtUser = payload;
      req.sessionId = payload.sessionId;
    }
  }

  next();
}

/**
 * Middleware to validate CSRF token for state-changing operations
 */
export async function validateCSRF(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Only validate CSRF for state-changing HTTP methods
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    next();
    return;
  }

  const csrfToken = req.headers["x-csrf-token"] as string;
  const sessionId = req.sessionId;

  if (!sessionId) {
    res.status(401).json({
      message: "Session required for CSRF validation",
      code: "NO_SESSION",
    });
    return;
  }

  if (!csrfToken) {
    res.status(403).json({
      message: "CSRF token required",
      code: "MISSING_CSRF_TOKEN",
    });
    return;
  }

  try {
    const isValid = await sessionManager.validateCSRFToken(
      sessionId,
      csrfToken,
    );
    if (!isValid) {
      res.status(403).json({
        message: "Invalid CSRF token",
        code: "INVALID_CSRF_TOKEN",
      });
      return;
    }
    next();
  } catch (error) {
    logger.error("CSRF validation error", {
      error: error instanceof Error ? error.message : String(error),
    });
    next(error);
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.jwtUser) {
      res.status(401).json({
        message: "Authentication required",
        code: "AUTH_REQUIRED",
      });
      return;
    }

    if (req.jwtUser.role !== role) {
      res.status(403).json({
        message: `Access denied. Required role: ${role}`,
        code: "INSUFFICIENT_PERMISSIONS",
      });
      return;
    }

    next();
  };
}

/**
 * Admin access control middleware
 */
export const requireAdmin = requireRole("admin");

/**
 * Combined middleware for authenticated + CSRF protected routes
 */
export function protectedRoute(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  validateAccessToken(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }
    validateCSRF(req, res, next);
  });
}

/**
 * Middleware to check session validity
 */
export async function validateSession(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const sessionId = req.sessionId;

  if (!sessionId) {
    next();
    return;
  }

  try {
    const session = await sessionManager.getSession(sessionId);
    if (!session) {
      res.status(401).json({
        message: "Invalid or expired session",
        code: "INVALID_SESSION",
      });
      return;
    }
    next();
  } catch (error) {
    logger.error("Session validation error", {
      error: error instanceof Error ? error.message : String(error),
    });
    next(error);
  }
}

/**
 * Combined authentication and session validation middleware
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  validateAccessToken(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }
    validateSession(req, res, next);
  });
}
