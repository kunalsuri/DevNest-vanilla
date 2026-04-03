import {
  type User,
  type InsertUser,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type AccountPreferences,
  accountPreferences,
} from "@shared/schema";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Mutex } from "async-mutex";
import logger from "./logger";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  updateUserPassword(id: string, password: string): Promise<void>;
  createPasswordResetToken(
    token: InsertPasswordResetToken,
  ): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  deletePasswordResetToken(token: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
  getUserPreferences(userId: string): Promise<AccountPreferences>;
  updateUserPreferences(
    userId: string,
    preferences: AccountPreferences,
  ): Promise<AccountPreferences>;
}

export class FileStorage implements IStorage {
  private readonly users: Map<string, User>;
  private readonly passwordResetTokens: Map<string, PasswordResetToken>;
  private readonly userPreferences: Map<string, AccountPreferences>;
  private readonly dataDir: string;
  private readonly usersFile: string;
  private readonly tokensFile: string;
  private readonly preferencesFile: string;
  private readonly loadingPromise: Promise<void>;
  // Serialise all file writes to prevent concurrent write races
  private readonly usersMutex = new Mutex();
  private readonly tokensMutex = new Mutex();
  private readonly preferencesMutex = new Mutex();

  constructor() {
    this.users = new Map();
    this.passwordResetTokens = new Map();
    this.userPreferences = new Map();
    this.dataDir = path.resolve(process.cwd(), "data");
    this.usersFile = path.join(this.dataDir, "users.json");
    this.tokensFile = path.join(this.dataDir, "password_reset_tokens.json");
    this.preferencesFile = path.join(this.dataDir, "preferences.json");
    this.loadingPromise = this.loadData();
  }

  async ready(): Promise<void> {
    return this.loadingPromise;
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error: any) {
      // Directory might already exist, only throw if it's not EEXIST
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
  }

  private async loadData(): Promise<void> {
    try {
      await this.ensureDataDir();

      // Load users
      try {
        const userData = await fs.readFile(this.usersFile, "utf-8");
        const usersArray: User[] = JSON.parse(userData);
        this.users.clear();
        usersArray.forEach((user) => {
          // Convert date strings back to Date objects
          const hydratedUser = {
            ...user,
            createdAt: user.createdAt ? new Date(user.createdAt) : null,
          };
          this.users.set(user.id, hydratedUser);
        });
      } catch (error: any) {
        // File doesn't exist yet or parse error, start with empty users
        if (error.code !== "ENOENT") {
          logger.warn("Error loading users", { error: error.message });
        }
        this.users.clear();
      }

      // Load password reset tokens
      try {
        const tokenData = await fs.readFile(this.tokensFile, "utf-8");
        const tokensArray: PasswordResetToken[] = JSON.parse(tokenData);
        this.passwordResetTokens.clear();
        tokensArray.forEach((token) => {
          // Convert date strings back to Date objects
          const hydratedToken = {
            ...token,
            expiresAt: new Date(token.expiresAt),
            createdAt: token.createdAt ? new Date(token.createdAt) : null,
          };
          this.passwordResetTokens.set(token.token, hydratedToken);
        });
      } catch (error: any) {
        // File doesn't exist yet or parse error, start with empty tokens
        if (error.code !== "ENOENT") {
          logger.warn("Error loading password reset tokens", {
            error: error.message,
          });
        }
        this.passwordResetTokens.clear();
      }

      // Load user preferences
      try {
        const preferencesData = await fs.readFile(
          this.preferencesFile,
          "utf-8",
        );
        const preferencesArray: Array<{ userId: string } & AccountPreferences> =
          JSON.parse(preferencesData);
        this.userPreferences.clear();
        preferencesArray.forEach((pref) => {
          const { userId, ...preferences } = pref;
          this.userPreferences.set(userId, preferences);
        });
      } catch (error: any) {
        // File doesn't exist yet or parse error, start with empty preferences
        if (error.code !== "ENOENT") {
          logger.warn("Error loading preferences", { error: error.message });
        }
        this.userPreferences.clear();
      }
    } catch (error) {
      logger.error("Error loading data", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async saveUsers(): Promise<void> {
    await this.usersMutex.runExclusive(async () => {
      await this.ensureDataDir();
      const usersArray = Array.from(this.users.values());
      await fs.writeFile(this.usersFile, JSON.stringify(usersArray, null, 2));
    });
  }

  private async saveTokens(): Promise<void> {
    await this.tokensMutex.runExclusive(async () => {
      await this.ensureDataDir();
      const tokensArray = Array.from(this.passwordResetTokens.values());
      await fs.writeFile(this.tokensFile, JSON.stringify(tokensArray, null, 2));
    });
  }

  private async savePreferences(): Promise<void> {
    await this.preferencesMutex.runExclusive(async () => {
      await this.ensureDataDir();
      const preferencesArray = Array.from(this.userPreferences.entries()).map(
        ([userId, preferences]) => ({
          userId,
          ...preferences,
        }),
      );
      await fs.writeFile(
        this.preferencesFile,
        JSON.stringify(preferencesArray, null, 2),
      );
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      role: "user", // Default role
      profilePicture: null,
      createdAt: new Date(),
      age: null,
      officeLocation: null,
      position: null,
      department: null,
      phone: null,
    };
    this.users.set(id, user);
    await this.saveUsers();
    return user;
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, { ...user, password });
      await this.saveUsers();
    }
  }

  async updateUser(
    id: string,
    updates: Partial<User>,
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...updates };
      this.users.set(id, updatedUser);
      await this.saveUsers();
      return updatedUser;
    }
    return undefined;
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
    await this.saveUsers();
  }

  async createPasswordResetToken(
    insertToken: InsertPasswordResetToken,
  ): Promise<PasswordResetToken> {
    const id = randomUUID();
    const token: PasswordResetToken = {
      ...insertToken,
      id,
      createdAt: new Date(),
    };
    this.passwordResetTokens.set(token.token, token);
    await this.saveTokens();
    return token;
  }

  async getPasswordResetToken(
    token: string,
  ): Promise<PasswordResetToken | undefined> {
    const resetToken = this.passwordResetTokens.get(token);
    if (resetToken && resetToken.expiresAt > new Date()) {
      return resetToken;
    }
    // Clean up expired token
    if (resetToken) {
      this.passwordResetTokens.delete(token);
      await this.saveTokens();
    }
    return undefined;
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    this.passwordResetTokens.delete(token);
    await this.saveTokens();
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    let hasExpired = false;

    for (const [token, resetToken] of Array.from(
      this.passwordResetTokens.entries(),
    )) {
      if (resetToken.expiresAt <= now) {
        this.passwordResetTokens.delete(token);
        hasExpired = true;
      }
    }

    if (hasExpired) {
      await this.saveTokens();
    }
  }

  async getUserPreferences(userId: string): Promise<AccountPreferences> {
    const preferences = this.userPreferences.get(userId);
    if (preferences) {
      return preferences;
    }
    // Return default preferences if none exist
    const defaultPreferences = accountPreferences.parse({});
    return defaultPreferences;
  }

  async updateUserPreferences(
    userId: string,
    preferences: AccountPreferences,
  ): Promise<AccountPreferences> {
    const validatedPreferences = accountPreferences.parse(preferences);
    this.userPreferences.set(userId, validatedPreferences);
    await this.savePreferences();
    return validatedPreferences;
  }
}

export const storage = new FileStorage();
