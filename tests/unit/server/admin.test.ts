// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import helmet from "helmet";
import { storage } from "@server/storage";
import { setupAdminRoutes } from "@server/api/admin-routes";
import { generateTokenPair } from "@server/auth/jwt-utils";

// Allow CSRF validation to pass in unit tests by default
vi.mock("@server/auth/session-manager", () => ({
  sessionManager: {
    getSession: vi.fn().mockResolvedValue({
      sessionId: "admin-session",
      userId: "admin-test-user",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    }),
    validateCSRFToken: vi.fn().mockResolvedValue(true),
    revokeSession: vi.fn().mockResolvedValue(undefined),
  },
}));

// ---------------------------------------------------------------------------
// Helper: build a minimal Express app with admin routes wired up
// ---------------------------------------------------------------------------
async function buildApp() {
  await storage.ready();

  const app = express();
  app.use(express.json());
  app.use(helmet());
  setupAdminRoutes(app);

  // Global error handler
  app.use(
    (
      err: Error & { status?: number },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(err.status || 500).json({ message: err.message });
    },
  );

  return app;
}

function adminToken() {
  return generateTokenPair({
    userId: "admin-test-user",
    username: "admin",
    email: "admin@test.com",
    role: "admin",
    sessionId: "admin-session",
  }).accessToken;
}

function userToken() {
  return generateTokenPair({
    userId: "regular-test-user",
    username: "regularuser",
    email: "user@test.com",
    role: "user",
    sessionId: "user-session",
  }).accessToken;
}

describe("Admin Routes", () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await buildApp();
    vi.clearAllMocks();
  });

  describe("GET /api/admin/users", () => {
    it("returns 401 when no token is provided", async () => {
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBe(401);
    });

    it("returns 403 when a non-admin user calls the endpoint", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${userToken()}`);
      expect(res.status).toBe(403);
    });

    it("returns 200 and an array of users for an admin", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken()}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
      // Passwords must never be exposed
      res.body.users.forEach((u: Record<string, unknown>) => {
        expect(u.password).toBeUndefined();
      });
    });
  });

  describe("GET /api/admin/stats", () => {
    it("returns 401 with no token", async () => {
      const res = await request(app).get("/api/admin/stats");
      expect(res.status).toBe(401);
    });

    it("returns stats object for admin", async () => {
      const res = await request(app)
        .get("/api/admin/stats")
        .set("Authorization", `Bearer ${adminToken()}`);
      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(res.body.server).toBeDefined();
      expect(typeof res.body.server.uptime).toBe("number");
    });
  });

  describe("GET /api/admin/audit-log", () => {
    it("returns 401 with no token", async () => {
      const res = await request(app).get("/api/admin/audit-log");
      expect(res.status).toBe(401);
    });

    it("returns entries array for admin", async () => {
      const res = await request(app)
        .get("/api/admin/audit-log")
        .set("Authorization", `Bearer ${adminToken()}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.entries)).toBe(true);
    });

    it("respects the limit query parameter (max 500)", async () => {
      const res = await request(app)
        .get("/api/admin/audit-log?limit=2")
        .set("Authorization", `Bearer ${adminToken()}`);
      expect(res.status).toBe(200);
      expect(res.body.entries.length).toBeLessThanOrEqual(2);
    });
  });

  describe("GET /api/admin/users/:id", () => {
    it("returns 404 for a non-existent user", async () => {
      const res = await request(app)
        .get("/api/admin/users/nonexistent-id-xyz")
        .set("Authorization", `Bearer ${adminToken()}`);
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/admin/users/:id/role", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app)
        .patch("/api/admin/users/some-id/role")
        .send({ role: "admin" });
      expect(res.status).toBe(401);
    });

    it("returns 400 with an invalid role value", async () => {
      const res = await request(app)
        .patch("/api/admin/users/some-id/role")
        .set("Authorization", `Bearer ${adminToken()}`)
        .set("X-CSRF-Token", "test-csrf-token")
        .send({ role: "superuser" });
      expect(res.status).toBe(400);
    });
  });
});
