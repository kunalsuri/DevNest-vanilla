/**
 * shared/schema.ts — Type definitions and Zod validation schemas
 *
 * ARCHITECTURE NOTE — Drizzle ORM is used here exclusively for type generation
 * and Zod schema derivation via `drizzle-zod`. At runtime this application uses
 * FileStorage (server/storage.ts) backed by JSON files in data/.
 *
 * The PostgreSQL table definitions below are NOT executed against a database in
 * the default file-based mode. If you want to migrate to a database backend,
 * set DATABASE_URL and use `npm run db:push` to apply the schema.
 *
 * Do NOT read secrets (JWT, session keys, etc.) from this file — use
 * server/env.ts which validates environment variables at startup.
 */
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  profilePicture: text("profile_picture"),
  role: text("role").notNull().default("user"), // admin, user
  createdAt: timestamp("created_at").defaultNow(),
  // Professional profile fields
  age: integer("age"),
  officeLocation: text("office_location"),
  position: text("position"),
  department: text("department"),
  phone: text("phone"),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(
  passwordResetTokens,
).pick({
  userId: true,
  token: true,
  expiresAt: true,
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

// JWT Authentication schemas
export const jwtRegisterSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
});

export const jwtLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(), // From cookie
});

export const csrfTokenSchema = z.object({
  csrfToken: z.string().min(1),
});

// Session schema for JWT + CSRF storage
export const sessionSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  refreshTokenHash: z.string(),
  csrfTokenHash: z.string(),
  userAgent: z.string().optional(),
  ip: z.string().optional(),
  createdAt: z.date(),
  expiresAt: z.date(),
  revokedAt: z.date().optional(),
});

// JWT payload schemas
export const accessTokenPayloadSchema = z.object({
  userId: z.string(),
  username: z.string(),
  email: z.string(),
  role: z.string(),
  sessionId: z.string(),
  iat: z.number(),
  exp: z.number(),
});

export const refreshTokenPayloadSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  iat: z.number(),
  exp: z.number(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type PublicUser = Omit<User, "password">;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<
  typeof insertPasswordResetTokenSchema
>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirm = z.infer<typeof passwordResetConfirmSchema>;

// JWT Authentication types
export type JWTRegisterData = z.infer<typeof jwtRegisterSchema>;
export type JWTLoginData = z.infer<typeof jwtLoginSchema>;
export type RefreshTokenData = z.infer<typeof refreshTokenSchema>;
export type CSRFTokenData = z.infer<typeof csrfTokenSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;
export type RefreshTokenPayload = z.infer<typeof refreshTokenPayloadSchema>;

// Account preferences schema
export const accountPreferences = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  twoFactorEnabled: z.boolean().default(false),
  autoLogout: z.boolean().default(true),
  theme: z.enum(["light", "dark", "system"]).default("system"),
});

export type AccountPreferences = z.infer<typeof accountPreferences>;
