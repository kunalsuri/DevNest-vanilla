/**
 * Feature Flag Service Tests
 *
 * Tests for the feature flag service implementation (ARCH-002)
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  featureFlagService,
  type FeatureFlag,
  type FeatureFlagContext,
} from "../../server/services/feature-flag-service";

describe("FeatureFlagService", () => {
  const service = featureFlagService;

  beforeEach(async () => {
    // Clear any test flags
    const allFlags = service.getAllFlags();
    for (const flag of allFlags) {
      if (flag.key.startsWith("test_") || flag.key.includes("_flag")) {
        await service.removeFlag(flag.key);
      }
    }
  });

  describe("isEnabled", () => {
    it("should return false for non-existent flag", () => {
      const context: FeatureFlagContext = {
        userId: "user123",
        role: "user",
        environment: "development",
      };

      expect(service.isEnabled("non_existent_flag", context)).toBe(false);
    });

    it("should return false for globally disabled flag", async () => {
      const flag: FeatureFlag = {
        key: "test_flag",
        name: "Test Flag",
        description: "Test",
        enabled: false,
      };

      await service.setFlag(flag);

      const context: FeatureFlagContext = {
        userId: "user123",
        role: "user",
        environment: "development",
      };

      expect(service.isEnabled("test_flag", context)).toBe(false);
    });

    it("should respect environment restrictions", async () => {
      const flag: FeatureFlag = {
        key: "env_flag",
        name: "Environment Flag",
        description: "Test",
        enabled: true,
        environments: ["production"],
      };

      await service.setFlag(flag);

      const devContext: FeatureFlagContext = {
        userId: "user123",
        role: "user",
        environment: "development",
      };

      const prodContext: FeatureFlagContext = {
        userId: "user123",
        role: "user",
        environment: "production",
      };

      expect(service.isEnabled("env_flag", devContext)).toBe(false);
      expect(service.isEnabled("env_flag", prodContext)).toBe(true);
    });

    it("should enable for specific users", async () => {
      const flag: FeatureFlag = {
        key: "specific_user_flag",
        name: "Specific User Flag",
        description: "Test",
        enabled: true,
        enabledForUsers: ["user123", "user456"],
        rolloutPercentage: 0, // Explicitly set to 0 to prevent percentage rollout
      };

      await service.setFlag(flag);

      const enabledContext: FeatureFlagContext = {
        userId: "user123",
        role: "user",
        environment: "development",
      };

      const disabledContext: FeatureFlagContext = {
        userId: "user789",
        role: "user",
        environment: "development",
      };

      expect(service.isEnabled("specific_user_flag", enabledContext)).toBe(
        true,
      );
      expect(service.isEnabled("specific_user_flag", disabledContext)).toBe(
        false,
      );
    });

    it("should enable for specific roles", async () => {
      const flag: FeatureFlag = {
        key: "admin_only_flag",
        name: "Admin Only Flag",
        description: "Test",
        enabled: true,
        enabledForRoles: ["admin"],
        rolloutPercentage: 0, // Explicitly set to 0 to prevent percentage rollout
      };

      await service.setFlag(flag);

      const adminContext: FeatureFlagContext = {
        userId: "user123",
        role: "admin",
        environment: "development",
      };

      const userContext: FeatureFlagContext = {
        userId: "user123",
        role: "user",
        environment: "development",
      };

      expect(service.isEnabled("admin_only_flag", adminContext)).toBe(true);
      expect(service.isEnabled("admin_only_flag", userContext)).toBe(false);
    });

    it("should handle percentage rollout", async () => {
      const flag: FeatureFlag = {
        key: "percent_flag",
        name: "Percent Flag",
        description: "Test",
        enabled: true,
        rolloutPercentage: 50,
      };

      await service.setFlag(flag);

      // Test with different user IDs to check deterministic behavior
      const context1: FeatureFlagContext = {
        userId: "user1",
        role: "user",
        environment: "development",
      };

      const context2: FeatureFlagContext = {
        userId: "user2",
        role: "user",
        environment: "development",
      };

      // Same user should always get same result
      const result1 = service.isEnabled("percent_flag", context1);
      const result1Again = service.isEnabled("percent_flag", context1);
      expect(result1).toBe(result1Again);

      // Different users may get different results
      const result2 = service.isEnabled("percent_flag", context2);
      expect(typeof result2).toBe("boolean");
    });
  });

  describe("getAllFlags", () => {
    it("should return all flags", () => {
      const flags = service.getAllFlags();
      expect(Array.isArray(flags)).toBe(true);
      expect(flags.length).toBeGreaterThan(0);
    });
  });

  describe("getFlag", () => {
    it("should return specific flag", async () => {
      const flag: FeatureFlag = {
        key: "test_flag",
        name: "Test Flag",
        description: "Test",
        enabled: true,
      };

      await service.setFlag(flag);

      const retrieved = service.getFlag("test_flag");
      expect(retrieved).toBeDefined();
      expect(retrieved?.key).toBe("test_flag");
    });

    it("should return undefined for non-existent flag", () => {
      const retrieved = service.getFlag("non_existent");
      expect(retrieved).toBeUndefined();
    });
  });

  describe("setFlag", () => {
    it("should add new flag", async () => {
      const flag: FeatureFlag = {
        key: "new_flag",
        name: "New Flag",
        description: "Test",
        enabled: true,
      };

      await service.setFlag(flag);

      const retrieved = service.getFlag("new_flag");
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("New Flag");
    });

    it("should update existing flag", async () => {
      const flag1: FeatureFlag = {
        key: "update_flag",
        name: "Original Name",
        description: "Test",
        enabled: true,
      };

      await service.setFlag(flag1);

      const flag2: FeatureFlag = {
        key: "update_flag",
        name: "Updated Name",
        description: "Test",
        enabled: false,
      };

      await service.setFlag(flag2);

      const retrieved = service.getFlag("update_flag");
      expect(retrieved?.name).toBe("Updated Name");
      expect(retrieved?.enabled).toBe(false);
    });
  });

  describe("removeFlag", () => {
    it("should remove existing flag", async () => {
      const flag: FeatureFlag = {
        key: "remove_flag",
        name: "Remove Flag",
        description: "Test",
        enabled: true,
      };

      await service.setFlag(flag);
      expect(service.getFlag("remove_flag")).toBeDefined();

      const removed = await service.removeFlag("remove_flag");
      expect(removed).toBe(true);
      expect(service.getFlag("remove_flag")).toBeUndefined();
    });

    it("should return false for non-existent flag", async () => {
      const removed = await service.removeFlag("non_existent");
      expect(removed).toBe(false);
    });
  });

  describe("getEnabledFlags", () => {
    it("should return all enabled flags for context", () => {
      const context: FeatureFlagContext = {
        userId: "user123",
        role: "admin",
        environment: "development",
      };

      const enabledFlags = service.getEnabledFlags(context);
      expect(Array.isArray(enabledFlags)).toBe(true);
    });

    it("should filter flags based on context", async () => {
      const flag1: FeatureFlag = {
        key: "test_admin_flag",
        name: "Test Admin Flag",
        description: "Test",
        enabled: true,
        enabledForRoles: ["admin"],
        rolloutPercentage: 0,
      };

      const flag2: FeatureFlag = {
        key: "test_user_flag",
        name: "Test User Flag",
        description: "Test",
        enabled: true,
        enabledForRoles: ["user"],
        rolloutPercentage: 0,
      };

      await service.setFlag(flag1);
      await service.setFlag(flag2);

      const adminContext: FeatureFlagContext = {
        userId: "user123",
        role: "admin",
        environment: "development",
      };

      const enabledFlags = service.getEnabledFlags(adminContext);
      expect(enabledFlags).toContain("test_admin_flag");
      expect(enabledFlags).not.toContain("test_user_flag");
    });
  });

  describe("checkFlags", () => {
    it("should check multiple flags at once", async () => {
      const context: FeatureFlagContext = {
        userId: "user123",
        role: "admin",
        environment: "development",
      };

      const flag1: FeatureFlag = {
        key: "flag1",
        name: "Flag 1",
        description: "Test",
        enabled: true,
      };

      const flag2: FeatureFlag = {
        key: "flag2",
        name: "Flag 2",
        description: "Test",
        enabled: false,
      };

      await service.setFlag(flag1);
      await service.setFlag(flag2);

      const results = service.checkFlags(["flag1", "flag2", "flag3"], context);

      expect(results.flag1).toBe(true);
      expect(results.flag2).toBe(false);
      expect(results.flag3).toBe(false);
    });
  });
});
