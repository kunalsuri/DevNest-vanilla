// server/auth/session-manager.ts
import { Session } from "@shared/schema";
import {
  generateSecureToken,
  hashToken,
  getTokenExpirationDate,
} from "./jwt-utils";
import fs from "node:fs/promises";
import path from "node:path";
import logger from "../logger";

export class SessionManager {
  private readonly sessions: Map<string, Session>;
  private readonly sessionsFile: string;
  private loadingPromise: Promise<void> | null = null;

  constructor() {
    this.sessions = new Map();
    this.sessionsFile = path.join(process.cwd(), "data", "sessions.json");
  }

  /**
   * Ensure session manager is ready
   */
  async ready(): Promise<void> {
    this.loadingPromise ??= this.loadSessions();
    await this.loadingPromise;
  }

  /**
   * Load sessions from file
   */
  private async loadSessions(): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.sessionsFile);
      await fs.mkdir(dataDir, { recursive: true });

      // Try to load existing sessions
      try {
        const data = await fs.readFile(this.sessionsFile, "utf-8");
        const sessions: Session[] = JSON.parse(data);

        // Convert date strings back to Date objects and filter expired sessions
        const now = new Date();
        const validSessions = sessions
          .map((session) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            expiresAt: new Date(session.expiresAt),
            revokedAt: session.revokedAt
              ? new Date(session.revokedAt)
              : undefined,
          }))
          .filter((session) => session.expiresAt > now && !session.revokedAt);

        validSessions.forEach((session) => {
          this.sessions.set(session.sessionId, session);
        });

        logger.info(`Loaded ${validSessions.length} valid sessions`);
      } catch (error) {
        // File doesn't exist or is invalid, start with empty sessions
        logger.info("No existing sessions file found, starting fresh", {
          error: error instanceof Error ? error.message : String(error),
        });
        await this.saveSessions();
      }
    } catch (error) {
      logger.error("Error loading sessions", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Save sessions to file
   */
  private async saveSessions(): Promise<void> {
    try {
      const sessions = Array.from(this.sessions.values());
      await fs.writeFile(this.sessionsFile, JSON.stringify(sessions, null, 2));
    } catch (error) {
      logger.error("Error saving sessions", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create a new session
   */
  async createSession(
    userId: string,
    refreshToken: string,
    userAgent?: string,
    ip?: string,
  ): Promise<Session> {
    await this.ready();

    const sessionId = generateSecureToken();
    const csrfToken = generateSecureToken(24);
    const refreshTokenHash = hashToken(refreshToken);
    const csrfTokenHash = hashToken(csrfToken);
    const createdAt = new Date();
    const expiresAt = getTokenExpirationDate("7d"); // Match refresh token expiration

    const session: Session = {
      sessionId,
      userId,
      refreshTokenHash,
      csrfTokenHash,
      userAgent,
      ip,
      createdAt,
      expiresAt,
    };

    this.sessions.set(sessionId, session);
    await this.saveSessions();

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    await this.ready();

    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Check if session is expired or revoked
    const now = new Date();
    const isExpired = session.expiresAt <= now;
    const isRevoked = !!session.revokedAt;

    if (isExpired || isRevoked) {
      await this.revokeSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Validate refresh token against session
   */
  async validateRefreshToken(
    sessionId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const refreshTokenHash = hashToken(refreshToken);
    return session.refreshTokenHash === refreshTokenHash;
  }

  /**
   * Validate CSRF token against session
   */
  async validateCSRFToken(
    sessionId: string,
    csrfToken: string,
  ): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const csrfTokenHash = hashToken(csrfToken);
    return session.csrfTokenHash === csrfTokenHash;
  }

  /**
   * Update session with new tokens (for refresh token rotation)
   */
  async updateSessionTokens(
    sessionId: string,
    newRefreshToken: string,
    newCSRFToken?: string,
  ): Promise<Session | null> {
    await this.ready();

    const session = this.sessions.get(sessionId);
    if (!session || session.revokedAt) {
      return null;
    }

    // Update tokens
    session.refreshTokenHash = hashToken(newRefreshToken);
    if (newCSRFToken) {
      session.csrfTokenHash = hashToken(newCSRFToken);
    }

    this.sessions.set(sessionId, session);
    await this.saveSessions();

    return session;
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.ready();

    const session = this.sessions.get(sessionId);
    if (session) {
      session.revokedAt = new Date();
      this.sessions.set(sessionId, session);
      await this.saveSessions();
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeUserSessions(userId: string): Promise<void> {
    await this.ready();

    const now = new Date();
    let updated = false;

    this.sessions.forEach((session, sessionId) => {
      if (session.userId === userId && !session.revokedAt) {
        session.revokedAt = now;
        this.sessions.set(sessionId, session);
        updated = true;
      }
    });

    if (updated) {
      await this.saveSessions();
    }
  }

  /**
   * Clean up expired and revoked sessions
   */
  async cleanupSessions(): Promise<void> {
    await this.ready();

    const now = new Date();
    let cleaned = false;

    this.sessions.forEach((session, sessionId) => {
      if (session.expiresAt <= now || session.revokedAt) {
        this.sessions.delete(sessionId);
        cleaned = true;
      }
    });

    if (cleaned) {
      await this.saveSessions();
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    await this.ready();

    const now = new Date();
    const userSessions: Session[] = [];

    this.sessions.forEach((session) => {
      if (
        session.userId === userId &&
        session.expiresAt > now &&
        !session.revokedAt
      ) {
        userSessions.push(session);
      }
    });

    return userSessions;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
