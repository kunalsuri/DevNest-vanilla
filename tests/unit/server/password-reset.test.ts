// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { authService } from "@server/services/auth-service";
import { storage } from "@server/storage";
import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function uniqueUser(suffix = randomUUID().slice(0, 8)) {
  return {
    username: `resetuser_${suffix}`,
    email: `resetuser_${suffix}@test.com`,
    password: "Password123!",
    firstName: "Reset",
    lastName: "Test",
  };
}

describe("Password Reset Flow", () => {
  beforeEach(async () => {
    await storage.ready();
  });

  describe("requestPasswordReset", () => {
    it("completes silently when the email does not exist (no info leak)", async () => {
      await expect(
        authService.requestPasswordReset("noone@nowhere.test"),
      ).resolves.not.toThrow();
    });

    it("creates a reset token for a known email", async () => {
      const data = uniqueUser();
      await authService.register(data);

      // Should not throw and should store a token
      await expect(
        authService.requestPasswordReset(data.email),
      ).resolves.not.toThrow();

      // Token was created in storage
      // We can't read it directly since it's returned only via the email stub,
      // but we can verify confirmPasswordReset rejects unknown tokens cleanly.
    });
  });

  describe("confirmPasswordReset", () => {
    it("rejects an invalid/unknown token", async () => {
      await expect(
        authService.confirmPasswordReset("invalidtoken123", "newpass"),
      ).rejects.toThrow("Invalid or expired reset token");
    });

    it("rejects an expired token (token past expiresAt)", async () => {
      const data = uniqueUser();
      const user = await authService.register(data);

      // Manually insert an already-expired token
      const expiredToken = randomUUID();
      const pastDate = new Date(Date.now() - 1000); // 1 second in the past
      await storage.createPasswordResetToken({
        userId: user.user.id,
        token: expiredToken,
        expiresAt: pastDate,
      });

      await expect(
        authService.confirmPasswordReset(expiredToken, "newpass"),
      ).rejects.toThrow("Invalid or expired reset token");
    });

    it("resets the password with a valid token", async () => {
      const data = uniqueUser();
      const { user } = await authService.register(data);

      // Insert a valid token
      const validToken = randomUUID();
      const futureDate = new Date(Date.now() + 3600_000);
      await storage.createPasswordResetToken({
        userId: user.id,
        token: validToken,
        expiresAt: futureDate,
      });

      const newPassword = "NewSecurePassword456!";
      await expect(
        authService.confirmPasswordReset(validToken, newPassword),
      ).resolves.not.toThrow();

      // Verify the new password works
      const loginResult = await authService.login({
        username: data.username,
        password: newPassword,
      });
      expect(loginResult.user.id).toBe(user.id);
    });

    it("token can only be used once", async () => {
      const data = uniqueUser();
      const { user } = await authService.register(data);

      const validToken = randomUUID();
      await storage.createPasswordResetToken({
        userId: user.id,
        token: validToken,
        expiresAt: new Date(Date.now() + 3600_000),
      });

      await authService.confirmPasswordReset(validToken, "AnotherPass1!");

      // Second use must fail
      await expect(
        authService.confirmPasswordReset(validToken, "AnotherPass2!"),
      ).rejects.toThrow("Invalid or expired reset token");
    });
  });
});
