// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

// ---------------------------------------------------------------------------
// Minimal Express mock factories
// ---------------------------------------------------------------------------
function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    method: "GET",
    path: "/test",
    ip: "127.0.0.1",
    ...overrides,
  } as unknown as Request;
}

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

const next: NextFunction = vi.fn();

describe("RBAC Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateAccessToken", () => {
    it("rejects requests with no Authorization header", async () => {
      const { validateAccessToken } = await import(
        "@server/auth/auth-middleware"
      );
      const req = makeReq({ headers: {} });
      const res = makeRes();

      validateAccessToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "MISSING_TOKEN" }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects requests with a malformed Bearer token", async () => {
      const { validateAccessToken } = await import(
        "@server/auth/auth-middleware"
      );
      const req = makeReq({
        headers: { authorization: "Bearer this.is.invalid" },
      });
      const res = makeRes();

      validateAccessToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INVALID_TOKEN" }),
      );
    });

    it("calls next() and attaches jwtUser for a valid token", async () => {
      const { generateTokenPair } = await import("@server/auth/jwt-utils");
      const { validateAccessToken } = await import(
        "@server/auth/auth-middleware"
      );

      const payload = {
        userId: "u1",
        username: "alice",
        email: "alice@test.com",
        role: "user",
        sessionId: "s1",
      };
      const { accessToken } = generateTokenPair(payload);

      const req = makeReq({
        headers: { authorization: `Bearer ${accessToken}` },
      });
      const res = makeRes();

      validateAccessToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect((req as any).jwtUser).toMatchObject({
        userId: "u1",
        role: "user",
      });
    });
  });

  describe("requireAdmin (via requireRole)", () => {
    it("rejects unauthenticated request (no jwtUser)", async () => {
      const { requireAdmin } = await import("@server/auth/auth-middleware");
      const req = makeReq();
      const res = makeRes();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects a user without admin role", async () => {
      const { requireAdmin } = await import("@server/auth/auth-middleware");
      const req = makeReq();
      (req as any).jwtUser = { userId: "u1", role: "user", username: "alice" };
      const res = makeRes();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INSUFFICIENT_PERMISSIONS" }),
      );
    });

    it("allows a user with admin role", async () => {
      const { requireAdmin } = await import("@server/auth/auth-middleware");
      const req = makeReq();
      (req as any).jwtUser = { userId: "u2", role: "admin", username: "bob" };
      const res = makeRes();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("optionalAuth", () => {
    it("calls next without setting jwtUser when no token provided", async () => {
      const { optionalAuth } = await import("@server/auth/auth-middleware");
      const req = makeReq({ headers: {} });
      const res = makeRes();

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect((req as any).jwtUser).toBeUndefined();
    });

    it("attaches jwtUser when a valid token is provided", async () => {
      const { generateTokenPair } = await import("@server/auth/jwt-utils");
      const { optionalAuth } = await import("@server/auth/auth-middleware");

      const payload = {
        userId: "u3",
        username: "carol",
        email: "carol@test.com",
        role: "user",
        sessionId: "s3",
      };
      const { accessToken } = generateTokenPair(payload);

      const req = makeReq({
        headers: { authorization: `Bearer ${accessToken}` },
      });
      const res = makeRes();

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect((req as any).jwtUser).toMatchObject({ userId: "u3" });
    });
  });
});
