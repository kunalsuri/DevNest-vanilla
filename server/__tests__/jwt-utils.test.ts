import { describe, it, expect } from "vitest";
import {
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  generateCSRFToken,
} from "../auth/jwt-utils";

describe("JWT Utilities", () => {
  const testPayload = {
    userId: "123",
    username: "testuser",
    email: "test@example.com",
    role: "user",
    sessionId: "session-123",
  };

  describe("Token Generation and Verification", () => {
    it("should generate valid token pair", () => {
      const tokens = generateTokenPair(testPayload);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe("string");
      expect(typeof tokens.refreshToken).toBe("string");
    });

    it("should verify valid access token", () => {
      const { accessToken } = generateTokenPair(testPayload);
      const decoded = verifyAccessToken(accessToken);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(testPayload.userId);
      expect(decoded?.username).toBe(testPayload.username);
      expect(decoded?.email).toBe(testPayload.email);
      expect(decoded?.role).toBe(testPayload.role);
    });

    it("should verify valid refresh token", () => {
      const { refreshToken } = generateTokenPair(testPayload);
      const decoded = verifyRefreshToken(refreshToken);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(testPayload.userId);
      expect(decoded?.sessionId).toBe(testPayload.sessionId);
    });

    it("should return null for invalid access token", () => {
      const decoded = verifyAccessToken("invalid-token");
      expect(decoded).toBeNull();
    });

    it("should return null for invalid refresh token", () => {
      const decoded = verifyRefreshToken("invalid-token");
      expect(decoded).toBeNull();
    });

    it("should return null for tampered token", () => {
      const { accessToken } = generateTokenPair(testPayload);
      const tampered = accessToken.slice(0, -5) + "aaaaa";
      const decoded = verifyAccessToken(tampered);

      expect(decoded).toBeNull();
    });
  });

  describe("Password Hashing", () => {
    const testPassword = "mySecurePassword123!";

    it("should hash password", async () => {
      const hash = await hashPassword(testPassword);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash).not.toBe(testPassword);
      expect(hash.length).toBeGreaterThan(0);
    });

    it("should generate different hashes for same password", async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);

      expect(hash1).not.toBe(hash2);
    });

    it("should verify correct password", async () => {
      const hashedPassword = await hashPassword(testPassword);
      const isValid = await comparePassword(testPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const hashedPassword = await hashPassword(testPassword);
      const isValid = await comparePassword("wrongPassword", hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe("CSRF Token Generation", () => {
    it("should generate CSRF token", () => {
      const token = generateCSRFToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should generate unique tokens", () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();

      expect(token1).not.toBe(token2);
    });

    it("should generate tokens of sufficient length", () => {
      const token = generateCSRFToken();
      // Should be a reasonable length for security
      expect(token.length).toBeGreaterThanOrEqual(16);
    });
  });
});
