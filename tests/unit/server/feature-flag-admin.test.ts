// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";
import { setupFeatureFlagAdminRoutes } from "@server/api/feature-flag-routes";
import { generateTokenPair } from "@server/auth/jwt-utils";
import { featureFlagService } from "@server/services";

// Mock session manager so authenticate middleware passes
vi.mock("@server/auth/session-manager", () => ({
  sessionManager: {
    getSession: vi.fn().mockResolvedValue({
      sessionId: "ff-session",
      userId: "ff-admin",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    }),
    validateCSRFToken: vi.fn().mockResolvedValue(true),
    revokeSession: vi.fn().mockResolvedValue(undefined),
  },
}));

async function buildApp() {
  await featureFlagService.ready();
  const app = express();
  app.use(express.json());
  setupFeatureFlagAdminRoutes(app);
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
    userId: "ff-admin",
    username: "admin",
    email: "admin@test.com",
    role: "admin",
    sessionId: "ff-session",
  }).accessToken;
}

function userToken() {
  return generateTokenPair({
    userId: "ff-user",
    username: "user",
    email: "user@test.com",
    role: "user",
    sessionId: "ff-user-session",
  }).accessToken;
}

describe("Feature Flag Admin Routes", () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await buildApp();
    vi.clearAllMocks();
  });

  describe("GET /api/admin/feature-flags", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).get("/api/admin/feature-flags");
      expect(res.status).toBe(401);
    });

    it("returns 403 for non-admin", async () => {
      const res = await request(app)
        .get("/api/admin/feature-flags")
        .set("Authorization", `Bearer ${userToken()}`);
      expect(res.status).toBe(403);
    });

    it("returns all flags for admin", async () => {
      const res = await request(app)
        .get("/api/admin/feature-flags")
        .set("Authorization", `Bearer ${adminToken()}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.flags)).toBe(true);
      expect(typeof res.body.total).toBe("number");
    });
  });

  describe("POST /api/admin/feature-flags", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app)
        .post("/api/admin/feature-flags")
        .send({ key: "x", name: "X", enabled: true });
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid key format", async () => {
      const res = await request(app)
        .post("/api/admin/feature-flags")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ key: "INVALID KEY!", name: "Bad", enabled: false });
      expect(res.status).toBe(400);
    });

    it("creates a new flag and returns 201", async () => {
      const key = `test_flag_create_${Date.now()}`;
      const res = await request(app)
        .post("/api/admin/feature-flags")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({
          key,
          name: "Test Flag",
          description: "unit test",
          enabled: false,
        });
      expect(res.status).toBe(201);
      expect(res.body.key).toBe(key);
      expect(res.body.enabled).toBe(false);
    });

    it("upserts (200) when the flag already exists", async () => {
      const key = `test_flag_upsert_${Date.now()}`;
      // First creation
      await request(app)
        .post("/api/admin/feature-flags")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ key, name: "Upsert", enabled: false });

      // Second call → update
      const res = await request(app)
        .post("/api/admin/feature-flags")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ key, name: "Upsert Updated", enabled: true });

      expect(res.status).toBe(200);
      expect(res.body.enabled).toBe(true);
    });
  });

  describe("PATCH /api/admin/feature-flags/:key", () => {
    it("partially updates an existing flag", async () => {
      const key = `test_flag_patch_${Date.now()}`;
      await request(app)
        .post("/api/admin/feature-flags")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ key, name: "Patchable", enabled: false });

      const res = await request(app)
        .patch(`/api/admin/feature-flags/${key}`)
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ enabled: true });

      expect(res.status).toBe(200);
      expect(res.body.enabled).toBe(true);
      expect(res.body.name).toBe("Patchable"); // name unchanged
    });

    it("returns 404 for a non-existent flag", async () => {
      const res = await request(app)
        .patch("/api/admin/feature-flags/nonexistent_xyz")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ enabled: true });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/admin/feature-flags/:key", () => {
    it("deletes an existing flag", async () => {
      const key = `test_flag_delete_${Date.now()}`;
      await request(app)
        .post("/api/admin/feature-flags")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ key, name: "Deletable", enabled: false });

      const res = await request(app)
        .delete(`/api/admin/feature-flags/${key}`)
        .set("Authorization", `Bearer ${adminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe("FLAG_DELETED");
    });

    it("returns 404 for a non-existent flag", async () => {
      const res = await request(app)
        .delete("/api/admin/feature-flags/ghost_key_xyz")
        .set("Authorization", `Bearer ${adminToken()}`);
      expect(res.status).toBe(404);
    });
  });
});
