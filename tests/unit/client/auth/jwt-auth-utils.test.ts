/**
 * Unit tests for jwt-auth-utils.ts type safety improvements
 * Tests the fixes for Critical Issue #1: Replace any types with TokenPayload interface
 *
 * These tests verify that:
 * 1. TokenPayload interface properly types JWT token data
 * 2. decodeTokenPayload returns TokenPayload | null instead of any
 * 3. getUserFromToken returns TokenPayload | null instead of any
 * 4. Type safety is maintained throughout token operations
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  TokenPayload,
  decodeTokenPayload,
  getUserFromToken,
  setAccessToken,
  clearAccessToken,
} from "../../../../client/src/features/auth/utils/jwt-auth-utils";

describe("JWT Auth Utils Type Safety Improvements", () => {
  beforeEach(() => {
    clearAccessToken();
  });

  describe("TokenPayload interface", () => {
    it("should properly type token payload structure", () => {
      const payload: TokenPayload = {
        userId: "user123",
        username: "testuser",
        email: "test@example.com",
        role: "user",
        sessionId: "session456",
        iat: 1234567890,
        exp: 1234571490,
      };

      expect(payload.userId).toBe("user123");
      expect(payload.username).toBe("testuser");
      expect(payload.email).toBe("test@example.com");
      expect(payload.role).toBe("user");
      expect(payload.sessionId).toBe("session456");
      expect(typeof payload.iat).toBe("number");
      expect(typeof payload.exp).toBe("number");
    });

    it("should enforce required fields", () => {
      // This tests TypeScript compilation - if it compiles, types are correct
      const payload: TokenPayload = {
        userId: "123",
        username: "user",
        email: "user@test.com",
        role: "admin",
        sessionId: "session",
        iat: 123,
        exp: 456,
      };

      expect(payload).toBeDefined();
    });
  });

  describe("decodeTokenPayload function", () => {
    it("should return TokenPayload on valid token", () => {
      // Create a valid JWT token (header.payload.signature)
      const payload = {
        userId: "user123",
        username: "testuser",
        email: "test@example.com",
        role: "user",
        sessionId: "session456",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const base64Payload = btoa(JSON.stringify(payload))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

      const token = `header.${base64Payload}.signature`;

      const result = decodeTokenPayload(token);

      expect(result).not.toBeNull();
      if (result) {
        // Type guard ensures TypeScript knows result is TokenPayload
        expect(result.userId).toBe("user123");
        expect(result.username).toBe("testuser");
        expect(result.email).toBe("test@example.com");
        expect(result.role).toBe("user");
      }
    });

    it("should return null on invalid token", () => {
      const invalidToken = "invalid.token";
      const result = decodeTokenPayload(invalidToken);

      expect(result).toBeNull();
    });

    it("should return null on malformed token", () => {
      const malformedToken = "not-a-jwt-token";
      const result = decodeTokenPayload(malformedToken);

      expect(result).toBeNull();
    });

    it("should handle empty token", () => {
      const emptyToken = "";
      const result = decodeTokenPayload(emptyToken);

      expect(result).toBeNull();
    });
  });

  describe("getUserFromToken function", () => {
    it("should return null when no access token is set", () => {
      clearAccessToken();
      const result = getUserFromToken();

      expect(result).toBeNull();
    });

    it("should return TokenPayload when valid access token is set", () => {
      const payload = {
        userId: "user456",
        username: "activeuser",
        email: "active@example.com",
        role: "admin",
        sessionId: "session789",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const base64Payload = btoa(JSON.stringify(payload))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

      const token = `header.${base64Payload}.signature`;
      setAccessToken(token);

      const result = getUserFromToken();

      expect(result).not.toBeNull();
      if (result) {
        // Type guard ensures TypeScript knows result is TokenPayload
        expect(result.userId).toBe("user456");
        expect(result.username).toBe("activeuser");
        expect(result.role).toBe("admin");
      }
    });

    it("should return null after clearAccessToken is called", () => {
      const payload = {
        userId: "user789",
        username: "tempuser",
        email: "temp@example.com",
        role: "user",
        sessionId: "session012",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const base64Payload = btoa(JSON.stringify(payload))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

      const token = `header.${base64Payload}.signature`;
      setAccessToken(token);

      expect(getUserFromToken()).not.toBeNull();

      clearAccessToken();
      expect(getUserFromToken()).toBeNull();
    });
  });

  describe("type safety in token operations", () => {
    it("should allow accessing TokenPayload properties with type safety", () => {
      const payload = {
        userId: "user999",
        username: "typeduser",
        email: "typed@example.com",
        role: "moderator",
        sessionId: "session345",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const base64Payload = btoa(JSON.stringify(payload))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

      const token = `header.${base64Payload}.signature`;
      const decoded = decodeTokenPayload(token);

      if (decoded) {
        // These property accesses should be type-safe
        const userId: string = decoded.userId;
        const username: string = decoded.username;
        const email: string = decoded.email;
        const role: string = decoded.role;
        const iat: number = decoded.iat;
        const exp: number = decoded.exp;

        expect(userId).toBe("user999");
        expect(username).toBe("typeduser");
        expect(email).toBe("typed@example.com");
        expect(role).toBe("moderator");
        expect(typeof iat).toBe("number");
        expect(typeof exp).toBe("number");
      }
    });

    it("should require null checks before accessing properties", () => {
      clearAccessToken();
      const user = getUserFromToken();

      // This demonstrates type safety - user could be null
      if (user) {
        expect(user.userId).toBeDefined();
        expect(user.username).toBeDefined();
        expect(user.email).toBeDefined();
      } else {
        expect(user).toBeNull();
      }
    });
  });

  describe("token expiry type safety", () => {
    it("should properly type expiry timestamps", () => {
      const now = Math.floor(Date.now() / 1000);
      const payload: TokenPayload = {
        userId: "user000",
        username: "expiryuser",
        email: "expiry@example.com",
        role: "user",
        sessionId: "session678",
        iat: now,
        exp: now + 3600, // 1 hour from now
      };

      // Type safety ensures iat and exp are numbers
      expect(typeof payload.iat).toBe("number");
      expect(typeof payload.exp).toBe("number");
      expect(payload.exp).toBeGreaterThan(payload.iat);
    });
  });
});
