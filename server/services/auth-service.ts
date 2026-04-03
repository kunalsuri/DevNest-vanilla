/**
 * Authentication Service
 *
 * This service encapsulates all authentication-related business logic,
 * implementing the service layer pattern (ARCH-003).
 *
 * Responsibilities:
 * - User authentication
 * - Session management
 * - Token generation and validation
 * - Password reset logic
 */

import { storage } from "../storage";
import {
  generateTokenPair,
  hashPassword,
  comparePassword,
  verifyRefreshToken,
  verifyAccessToken,
  generateCSRFToken,
} from "../auth/jwt-utils";
import { sessionManager } from "../auth/session-manager";
import logger from "../logger";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResult {
  user: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

export interface TokenRefreshResult {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(
    data: RegisterData,
    userAgent?: string,
    ip?: string,
  ): Promise<AuthResult> {
    // Validate username uniqueness
    const existingUser = await storage.getUserByUsername(data.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    // Validate email uniqueness
    const existingEmail = await storage.getUserByEmail(data.email);
    if (existingEmail) {
      throw new Error("Email already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await storage.createUser({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
    });

    // Generate temporary refresh token for session creation
    const { refreshToken } = generateTokenPair({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      sessionId: "",
    });

    // Create session
    const session = await sessionManager.createSession(
      user.id,
      refreshToken,
      userAgent,
      ip,
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
    const csrfToken = generateCSRFToken();
    await sessionManager.updateSessionTokens(
      session.sessionId,
      finalTokens.refreshToken,
      csrfToken,
    );

    logger.info("User registered and logged in", {
      userId: user.id,
      username: user.username,
      sessionId: session.sessionId,
    });

    const { password: _password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken: finalTokens.accessToken,
      refreshToken: finalTokens.refreshToken,
      csrfToken,
    };
  }

  /**
   * Login user
   */
  async login(
    credentials: LoginCredentials,
    userAgent?: string,
    ip?: string,
  ): Promise<AuthResult> {
    // Find user
    const user = await storage.getUserByUsername(credentials.username);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await comparePassword(
      credentials.password,
      user.password,
    );
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Generate temporary refresh token for session creation
    const { refreshToken } = generateTokenPair({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      sessionId: "",
    });

    // Create session
    const session = await sessionManager.createSession(
      user.id,
      refreshToken,
      userAgent,
      ip,
    );

    // Generate final tokens with correct session ID
    const finalTokens = generateTokenPair({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      sessionId: session.sessionId,
    });

    // Update session with final tokens
    const csrfToken = generateCSRFToken();
    await sessionManager.updateSessionTokens(
      session.sessionId,
      finalTokens.refreshToken,
      csrfToken,
    );

    logger.info("User logged in", {
      userId: user.id,
      username: user.username,
      sessionId: session.sessionId,
    });

    const { password: _password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken: finalTokens.accessToken,
      refreshToken: finalTokens.refreshToken,
      csrfToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenRefreshResult> {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new Error("Invalid refresh token");
    }

    // Validate refresh token against session
    const isValidToken = await sessionManager.validateRefreshToken(
      payload.sessionId,
      refreshToken,
    );
    if (!isValidToken) {
      await sessionManager.revokeSession(payload.sessionId);
      throw new Error("Invalid refresh token - session revoked");
    }

    // Get user data
    const user = await storage.getUser(payload.userId);
    if (!user) {
      throw new Error("User not found");
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

    logger.debug("Token refreshed", {
      userId: user.id,
      sessionId: payload.sessionId,
    });

    const { password: _password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      csrfToken: newCSRFToken,
    };
  }

  /**
   * Logout user (revoke session)
   */
  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    if (payload) {
      await sessionManager.revokeSession(payload.sessionId);
      logger.info("User logged out", {
        userId: payload.userId,
        sessionId: payload.sessionId,
      });
    }
  }

  /**
   * Logout user from all sessions
   */
  async logoutAll(accessToken: string): Promise<void> {
    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      throw new Error("Invalid access token");
    }

    await sessionManager.revokeUserSessions(payload.userId);
    logger.info("User logged out from all sessions", {
      userId: payload.userId,
    });
  }

  /**
   * Get user from access token
   */
  async getUserFromToken(accessToken: string) {
    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      throw new Error("Invalid access token");
    }

    const user = await storage.getUser(payload.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Don't reveal whether email exists for security
      logger.debug("Password reset requested for non-existent email", {
        email,
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
    if (process.env.NODE_ENV === "development") {
      logger.info(`Password reset token for ${user.email}`, {
        email: user.email,
        token,
        resetUrl: `http://localhost:5000/auth?reset-token=${token}`,
      });
    }

    logger.info("Password reset requested", {
      userId: user.id,
      email: user.email,
    });
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(
    token: string,
    newPassword: string,
  ): Promise<void> {
    const resetToken = await storage.getPasswordResetToken(token);
    if (!resetToken) {
      throw new Error("Invalid or expired reset token");
    }

    const user = await storage.getUser(resetToken.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update user password
    const hashedPassword = await hashPassword(newPassword);
    await storage.updateUserPassword(user.id, hashedPassword);

    // Delete the used token
    await storage.deletePasswordResetToken(token);

    logger.info("Password reset completed", {
      userId: user.id,
      email: user.email,
    });
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    await sessionManager.cleanupSessions();
    logger.info("Expired sessions cleaned up");
  }
}

// Export singleton instance
export const authService = new AuthService();
