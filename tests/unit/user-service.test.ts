/**
 * User Service Tests
 *
 * Tests for the user service implementation (ARCH-003)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  userService,
  type CreateUserDTO,
  type UpdateUserDTO,
} from "../../server/services/user-service";

// Mock the storage module
vi.mock("../../server/storage", () => ({
  storage: {
    getUserByUsername: vi.fn(),
    getUserByEmail: vi.fn(),
    getUser: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    updateUserPassword: vi.fn(),
    getUserPreferences: vi.fn(),
    updateUserPreferences: vi.fn(),
  },
}));

// Mock logger
vi.mock("../../server/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock jwt-utils
vi.mock("../../server/auth/jwt-utils", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed_password"),
}));

// Mock fs promises
vi.mock("node:fs/promises", () => ({
  default: {
    unlink: vi.fn(),
  },
}));

describe("UserService", () => {
  const service = userService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createUser", () => {
    it("should create a new user successfully", async () => {
      const { storage } = await import("../../server/storage");

      vi.mocked(storage.getUserByUsername).mockResolvedValue(null);
      vi.mocked(storage.getUserByEmail).mockResolvedValue(null);
      vi.mocked(storage.createUser).mockResolvedValue({
        id: "user123",
        username: "testuser",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        password: "hashed_password",
        role: "user",
        createdAt: new Date(),
      });

      const userData: CreateUserDTO = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        firstName: "Test",
        lastName: "User",
      };

      const result = await service.createUser(userData);

      expect(result).toBeDefined();
      expect(result.username).toBe("testuser");
      expect(result.email).toBe("test@example.com");
      expect("password" in result).toBe(false); // Password should be excluded
    });

    it("should throw error if username already exists", async () => {
      const { storage } = await import("../../server/storage");

      vi.mocked(storage.getUserByUsername).mockResolvedValue({
        id: "existing",
        username: "testuser",
        email: "existing@example.com",
        password: "hashed",
        role: "user",
        createdAt: new Date(),
        firstName: "",
        lastName: "",
      });

      const userData: CreateUserDTO = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      await expect(service.createUser(userData)).rejects.toThrow(
        "Username already exists",
      );
    });

    it("should throw error if email already exists", async () => {
      const { storage } = await import("../../server/storage");

      vi.mocked(storage.getUserByUsername).mockResolvedValue(null);
      vi.mocked(storage.getUserByEmail).mockResolvedValue({
        id: "existing",
        username: "existing",
        email: "test@example.com",
        password: "hashed",
        role: "user",
        createdAt: new Date(),
        firstName: "",
        lastName: "",
      });

      const userData: CreateUserDTO = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      await expect(service.createUser(userData)).rejects.toThrow(
        "Email already exists",
      );
    });
  });

  describe("getUserById", () => {
    it("should return user without password", async () => {
      const { storage } = await import("../../server/storage");

      vi.mocked(storage.getUser).mockResolvedValue({
        id: "user123",
        username: "testuser",
        email: "test@example.com",
        password: "hashed_password",
        role: "user",
        createdAt: new Date(),
        firstName: "Test",
        lastName: "User",
      });

      const result = await service.getUserById("user123");

      expect(result).toBeDefined();
      expect(result?.id).toBe("user123");
      expect("password" in (result || {})).toBe(false);
    });

    it("should return null for non-existent user", async () => {
      const { storage } = await import("../../server/storage");

      vi.mocked(storage.getUser).mockResolvedValue(null);

      const result = await service.getUserById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("updateUser", () => {
    it("should update user successfully", async () => {
      const { storage } = await import("../../server/storage");

      const existingUser = {
        id: "user123",
        username: "testuser",
        email: "test@example.com",
        password: "hashed",
        role: "user",
        createdAt: new Date(),
        firstName: "Test",
        lastName: "User",
      };

      vi.mocked(storage.getUser).mockResolvedValue(existingUser);
      vi.mocked(storage.updateUser).mockResolvedValue({
        ...existingUser,
        firstName: "Updated",
      });

      const updateData: UpdateUserDTO = {
        firstName: "Updated",
      };

      const result = await service.updateUser("user123", updateData);

      expect(result).toBeDefined();
      expect(result.firstName).toBe("Updated");
      expect("password" in result).toBe(false);
    });

    it("should throw error for non-existent user", async () => {
      const { storage } = await import("../../server/storage");

      vi.mocked(storage.getUser).mockResolvedValue(null);

      await expect(
        service.updateUser("nonexistent", { firstName: "Test" }),
      ).rejects.toThrow("User not found");
    });

    it("should validate email uniqueness", async () => {
      const { storage } = await import("../../server/storage");

      const currentUser = {
        id: "user123",
        username: "testuser",
        email: "test@example.com",
        password: "hashed",
        role: "user",
        createdAt: new Date(),
        firstName: "Test",
        lastName: "User",
      };

      const otherUser = {
        id: "user456",
        username: "other",
        email: "other@example.com",
        password: "hashed",
        role: "user",
        createdAt: new Date(),
        firstName: "Other",
        lastName: "User",
      };

      vi.mocked(storage.getUser).mockResolvedValue(currentUser);
      vi.mocked(storage.getUserByEmail).mockResolvedValue(otherUser);

      await expect(
        service.updateUser("user123", { email: "other@example.com" }),
      ).rejects.toThrow("Email already taken");
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      const { storage } = await import("../../server/storage");

      vi.mocked(storage.getUser).mockResolvedValue({
        id: "user123",
        username: "testuser",
        email: "test@example.com",
        password: "hashed",
        role: "user",
        createdAt: new Date(),
        firstName: "Test",
        lastName: "User",
      });

      vi.mocked(storage.deleteUser).mockResolvedValue(undefined);

      await expect(service.deleteUser("user123")).resolves.not.toThrow();
    });

    it("should throw error for non-existent user", async () => {
      const { storage } = await import("../../server/storage");

      vi.mocked(storage.getUser).mockResolvedValue(null);

      await expect(service.deleteUser("nonexistent")).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("getUserPreferences", () => {
    it("should return user preferences", async () => {
      const { storage } = await import("../../server/storage");

      const preferences = {
        theme: "dark",
        emailNotifications: true,
      };

      vi.mocked(storage.getUserPreferences).mockResolvedValue(preferences);

      const result = await service.getUserPreferences("user123");

      expect(result).toEqual(preferences);
    });
  });

  describe("updateUserPreferences", () => {
    it("should update user preferences", async () => {
      const { storage } = await import("../../server/storage");

      const newPreferences = {
        theme: "light",
        emailNotifications: false,
      };

      vi.mocked(storage.updateUserPreferences).mockResolvedValue(
        newPreferences,
      );

      const result = await service.updateUserPreferences(
        "user123",
        newPreferences,
      );

      expect(result).toEqual(newPreferences);
    });
  });
});
