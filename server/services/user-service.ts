/**
 * User Service
 *
 * This service encapsulates all user-related business logic,
 * implementing the service layer pattern (ARCH-003).
 *
 * Responsibilities:
 * - User CRUD operations
 * - Business validation
 * - Profile management
 * - User preferences
 */

import { storage } from "../storage";
import { hashPassword } from "../auth/jwt-utils";
import logger from "../logger";
import fs from "node:fs/promises";

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: string;
  age?: number | null;
  officeLocation?: string | null;
  position?: string | null;
  department?: string | null;
  phone?: string | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  role: string;
  createdAt: Date;
}

export class UserService {
  /**
   * Create a new user with validation
   */
  async createUser(data: CreateUserDTO): Promise<User> {
    // Validate username uniqueness
    const existingUsername = await storage.getUserByUsername(data.username);
    if (existingUsername) {
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

    logger.info("User created", {
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const user = await storage.getUser(userId);
    if (!user) {
      return null;
    }

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<User | null> {
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return null;
    }

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return null;
    }

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, data: UpdateUserDTO): Promise<User> {
    const currentUser = await storage.getUser(userId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Validate email uniqueness if email is being changed
    if (data.email && data.email !== currentUser.email) {
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail && existingEmail.id !== userId) {
        throw new Error("Email already taken");
      }
    }

    const updatedUser = await storage.updateUser(userId, data);
    if (!updatedUser) {
      throw new Error("User not found");
    }

    logger.info("User updated", {
      userId: updatedUser.id,
      changes: Object.keys(data),
    });

    const { password: _password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await hashPassword(newPassword);
    await storage.updateUserPassword(userId, hashedPassword);

    logger.info("User password updated", { userId });
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Delete profile picture if exists
    if (user.profilePicture) {
      try {
        await fs.unlink(user.profilePicture);
      } catch (error: unknown) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code !== "ENOENT"
        ) {
          logger.warn(
            "Failed to delete profile picture during account deletion",
            {
              error: error instanceof Error ? error.message : "Unknown error",
              path: user.profilePicture,
            },
          );
        }
      }
    }

    await storage.deleteUser(userId);

    logger.info("User deleted", {
      userId,
      username: user.username,
    });
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<Record<string, unknown>> {
    const preferences = await storage.getUserPreferences(userId);
    return preferences;
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const updatedPreferences = await storage.updateUserPreferences(
      userId,
      preferences as any,
    );

    logger.info("User preferences updated", {
      userId,
      keys: Object.keys(preferences),
    });

    return updatedPreferences;
  }

  /**
   * Update profile picture
   */
  async updateProfilePicture(
    userId: string,
    picturePath: string,
  ): Promise<User> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      try {
        await fs.unlink(user.profilePicture);
      } catch (error: unknown) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code !== "ENOENT"
        ) {
          logger.warn("Failed to delete old profile picture", {
            error: error instanceof Error ? error.message : "Unknown error",
            path: user.profilePicture,
          });
        }
      }
    }

    const updatedUser = await storage.updateUser(userId, {
      profilePicture: picturePath,
    });

    if (!updatedUser) {
      throw new Error("User not found");
    }

    logger.info("Profile picture updated", { userId, path: picturePath });

    const { password: _password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }
}

// Export singleton instance
export const userService = new UserService();
