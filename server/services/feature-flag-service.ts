/**
 * Feature Flags Service
 *
 * This service provides a simple yet effective feature flag system
 * for gradual rollouts and A/B testing (ARCH-002).
 *
 * Features:
 * - User-based targeting
 * - Percentage rollouts
 * - Environment-based flags
 * - Role-based access
 */

import fs from "node:fs/promises";
import path from "node:path";
import { Mutex } from "async-mutex";
import logger from "../logger";

export interface FeatureFlag {
  /** Unique flag identifier */
  key: string;
  /** Human-readable flag name */
  name: string;
  /** Flag description */
  description: string;
  /** Is the flag enabled globally */
  enabled: boolean;
  /** Percentage of users to enable (0-100) */
  rolloutPercentage?: number;
  /** Specific user IDs to enable for */
  enabledForUsers?: string[];
  /** Specific user roles to enable for */
  enabledForRoles?: string[];
  /** Environments where this flag is active */
  environments?: string[];
}

export interface FeatureFlagContext {
  userId?: string;
  role?: string;
  environment: string;
}

class FeatureFlagService {
  private readonly flags: Map<string, FeatureFlag> = new Map();
  private readonly mutex = new Mutex();
  private readonly flagsFile = path.resolve(
    process.cwd(),
    "data",
    "feature-flags.json",
  );

  constructor() {
    this.initializeDefaultFlags();
  }

  /**
   * Load persisted flags from disk, falling back to defaults.
   * Call once during server startup.
   */
  async ready(): Promise<void> {
    try {
      const raw = await fs.readFile(this.flagsFile, "utf-8");
      const stored: FeatureFlag[] = JSON.parse(raw);
      this.flags.clear();
      for (const flag of stored) {
        this.flags.set(flag.key, flag);
      }
      logger.info("Feature flags loaded from file", {
        count: this.flags.size,
      });
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        logger.warn("Could not load feature-flags.json, using defaults", {
          error: err.message,
        });
      }
      // Keep the defaults already set by initializeDefaultFlags()
    }
  }

  private async saveFlags(): Promise<void> {
    await this.mutex.runExclusive(async () => {
      try {
        await fs.mkdir(path.dirname(this.flagsFile), { recursive: true });
        const arr = Array.from(this.flags.values());
        await fs.writeFile(
          this.flagsFile,
          JSON.stringify(arr, null, 2),
          "utf-8",
        );
      } catch (err) {
        logger.error("Failed to persist feature flags", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    });
  }

  /**
   * Initialize default feature flags
   */
  private initializeDefaultFlags(): void {
    // Example flags - these would typically come from a database or config
    const defaultFlags: FeatureFlag[] = [
      {
        key: "enhanced_logging",
        name: "Enhanced Logging",
        description: "Enable detailed request/response logging",
        enabled: true,
        rolloutPercentage: 100,
        environments: ["development"],
      },
      {
        key: "new_profile_ui",
        name: "New Profile UI",
        description: "Enable redesigned profile interface",
        enabled: false,
        rolloutPercentage: 25,
        enabledForRoles: ["admin"],
      },
      {
        key: "beta_features",
        name: "Beta Features",
        description: "Access to experimental beta features",
        enabled: false,
        enabledForRoles: ["admin", "beta_tester"],
      },
    ];

    for (const flag of defaultFlags) {
      this.flags.set(flag.key, flag);
    }

    logger.info("Feature flags initialized", {
      count: this.flags.size,
      flags: Array.from(this.flags.keys()),
    });
  }

  /**
   * Check if a feature flag is enabled for the given context
   */
  isEnabled(flagKey: string, context: FeatureFlagContext): boolean {
    const flag = this.flags.get(flagKey);

    if (!flag) {
      logger.warn("Feature flag not found", { flagKey });
      return false;
    }

    // Check if globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check environment
    if (flag.environments && !flag.environments.includes(context.environment)) {
      return false;
    }

    // Check user-specific enablement
    if (flag.enabledForUsers && context.userId) {
      if (flag.enabledForUsers.includes(context.userId)) {
        return true;
      }
    }

    // Check role-based enablement
    if (flag.enabledForRoles && context.role) {
      if (flag.enabledForRoles.includes(context.role)) {
        return true;
      }
    }

    // Check percentage rollout
    if (flag.rolloutPercentage !== undefined && context.userId) {
      const percentage = this.getUserPercentage(context.userId);
      return percentage <= flag.rolloutPercentage;
    }

    // If no specific rules, return global enabled state
    return flag.enabled;
  }

  /**
   * Get a deterministic percentage (0-100) for a user
   * This ensures consistent feature flag evaluation for the same user
   */
  private getUserPercentage(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.codePointAt(i) ?? 0;
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 100;
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get a specific feature flag
   */
  getFlag(flagKey: string): FeatureFlag | undefined {
    return this.flags.get(flagKey);
  }

  /**
   * Add or update a feature flag
   */
  async setFlag(flag: FeatureFlag): Promise<void> {
    this.flags.set(flag.key, flag);
    logger.info("Feature flag updated", {
      flagKey: flag.key,
      enabled: flag.enabled,
    });
    await this.saveFlags();
  }

  /**
   * Remove a feature flag
   */
  async removeFlag(flagKey: string): Promise<boolean> {
    const deleted = this.flags.delete(flagKey);
    if (deleted) {
      logger.info("Feature flag removed", { flagKey });
      await this.saveFlags();
    }
    return deleted;
  }

  /**
   * Get all enabled flags for a given context
   */
  getEnabledFlags(context: FeatureFlagContext): string[] {
    const enabledFlags: string[] = [];
    const flagKeys = Array.from(this.flags.keys());

    for (const key of flagKeys) {
      if (this.isEnabled(key, context)) {
        enabledFlags.push(key);
      }
    }

    return enabledFlags;
  }

  /**
   * Bulk check multiple flags
   */
  checkFlags(
    flagKeys: string[],
    context: FeatureFlagContext,
  ): Record<string, boolean> {
    const results: Record<string, boolean> = {};

    for (const key of flagKeys) {
      results[key] = this.isEnabled(key, context);
    }

    return results;
  }
}

// Export singleton instance
export const featureFlagService = new FeatureFlagService();
