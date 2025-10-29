import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { storage } from "../storage";

describe("Storage Service", () => {
  beforeEach(async () => {
    await storage.ready();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("User Management", () => {
    it("should create a new user", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword123",
      };

      const user = await storage.createUser(userData);

      expect(user).toMatchObject({
        username: userData.username,
        email: userData.email,
        role: "user",
      });
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
    });

    it("should get user by username", async () => {
      const userData = {
        username: "findme",
        email: "findme@example.com",
        password: "password123",
      };

      await storage.createUser(userData);
      const user = await storage.getUserByUsername("findme");

      expect(user).toBeDefined();
      expect(user?.username).toBe("findme");
    });

    it("should get user by email", async () => {
      const userData = {
        username: "emailtest",
        email: "emailtest@example.com",
        password: "password123",
      };

      await storage.createUser(userData);
      const user = await storage.getUserByEmail("emailtest@example.com");

      expect(user).toBeDefined();
      expect(user?.email).toBe("emailtest@example.com");
    });

    it("should get user by id", async () => {
      const userData = {
        username: "idtest",
        email: "idtest@example.com",
        password: "password123",
      };

      const createdUser = await storage.createUser(userData);
      const user = await storage.getUser(createdUser.id);

      expect(user).toBeDefined();
      expect(user?.id).toBe(createdUser.id);
    });

    it("should update user data", async () => {
      const userData = {
        username: "updatetest",
        email: "updatetest@example.com",
        password: "password123",
      };

      const user = await storage.createUser(userData);
      const updated = await storage.updateUser(user.id, {
        email: "newemail@example.com",
      });

      expect(updated?.email).toBe("newemail@example.com");
      expect(updated?.username).toBe("updatetest");
    });

    it("should return null for non-existent user", async () => {
      const user = await storage.getUser("999999");
      expect(user).toBeUndefined();
    });
  });

  describe("User Preferences", () => {
    let userId: string;

    beforeEach(async () => {
      const user = await storage.createUser({
        username: "prefuser",
        email: "prefuser@example.com",
        password: "password123",
      });
      userId = user.id.toString();
    });

    it("should get default preferences for new user", async () => {
      const prefs = await storage.getUserPreferences(userId);

      expect(prefs).toBeDefined();
      expect(prefs.theme).toBe("system");
      expect(prefs.emailNotifications).toBe(true);
    });

    it("should update user preferences", async () => {
      const currentPrefs = await storage.getUserPreferences(userId);
      await storage.updateUserPreferences(userId, {
        ...currentPrefs,
        theme: "dark",
        emailNotifications: false,
      });

      const prefs = await storage.getUserPreferences(userId);
      expect(prefs.theme).toBe("dark");
      expect(prefs.emailNotifications).toBe(false);
    });

    it("should maintain existing preferences when updating", async () => {
      let currentPrefs = await storage.getUserPreferences(userId);
      await storage.updateUserPreferences(userId, {
        ...currentPrefs,
        theme: "dark",
      });

      currentPrefs = await storage.getUserPreferences(userId);
      await storage.updateUserPreferences(userId, {
        ...currentPrefs,
        twoFactorEnabled: true,
      });

      const prefs = await storage.getUserPreferences(userId);
      expect(prefs.theme).toBe("dark");
      expect(prefs.twoFactorEnabled).toBe(true);
    });
  });
});
