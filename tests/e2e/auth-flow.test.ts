/**
 * E2E Auth Flow Tests
 *
 * Tests the full HTTP auth lifecycle: register → login → get user → logout
 * Uses the actual Express route handlers with mocked service layer to avoid
 * file-system side effects in CI.
 */
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import request from "supertest";
import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import { createServer, type Server } from "node:http";

// ---------------------------------------------------------------------------
// Mocks – must be declared before any imports that transitively load these modules
// ---------------------------------------------------------------------------

vi.mock("@server/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@server/auth/session-manager", () => ({
  sessionManager: {
    ready: vi.fn().mockResolvedValue(undefined),
    createSession: vi.fn().mockResolvedValue({ id: "sess-e2e-001" }),
    getSession: vi
      .fn()
      .mockResolvedValue({ id: "sess-e2e-001", userId: "user-e2e-001" }),
    deleteSession: vi.fn().mockResolvedValue(undefined),
    deleteAllSessionsForUser: vi.fn().mockResolvedValue(undefined),
    cleanupSessions: vi.fn().mockResolvedValue(0),
    isSessionValid: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("@server/services", () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    logoutAll: vi.fn().mockResolvedValue(undefined),
    getUserFromToken: vi.fn(),
    refreshAccessToken: vi.fn(),
  },
  userService: {
    getUserById: vi.fn(),
    updateUser: vi.fn(),
  },
  featureFlagService: {
    ready: vi.fn().mockResolvedValue(undefined),
    isEnabled: vi.fn().mockReturnValue(false),
  },
  auditLogService: {
    log: vi.fn().mockResolvedValue(undefined),
  },
  notificationService: {
    getForUser: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(undefined),
    markRead: vi.fn().mockResolvedValue(undefined),
    markAllRead: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  subscriptionService: {
    getPlans: vi.fn().mockReturnValue([]),
    getSubscription: vi.fn().mockResolvedValue(null),
    createFreeSubscription: vi.fn().mockResolvedValue(null),
  },
  PLANS: {},
}));

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const TEST_USER = {
  id: "user-e2e-001",
  username: "e2euser",
  email: "e2e@example.com",
  firstName: "Alice",
  lastName: "User",
  role: "user" as const,
  createdAt: new Date(),
};

/** Static mock tokens (values don't need to be cryptographically real for these tests) */
const MOCK_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLWUyZS0wMDEiLCJ1c2VybmFtZSI6ImUyZXVzZXIiLCJyb2xlIjoidXNlciIsInNlc3Npb25JZCI6InNlc3MtZTJlLTAwMSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.mock";
const MOCK_REFRESH_TOKEN = "mock-refresh-token-e2e";
const MOCK_CSRF_TOKEN = "mock-csrf-token-e2e-test";

const MOCK_AUTH_RESULT = {
  user: TEST_USER,
  accessToken: MOCK_ACCESS_TOKEN,
  refreshToken: MOCK_REFRESH_TOKEN,
  csrfToken: MOCK_CSRF_TOKEN,
};

// ---------------------------------------------------------------------------
// App bootstrap (reused across describe blocks)
// ---------------------------------------------------------------------------

async function createTestApp(): Promise<Express> {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  const { setupJWTAuthRoutes } = await import("@server/auth/jwt-auth-routes");
  setupJWTAuthRoutes(app);

  // Generic error handler
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(500).json({ message: err.message });
    },
  );

  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("E2E: Auth Flow", () => {
  let app: Express;
  let server: Server;

  beforeAll(async () => {
    app = await createTestApp();
    server = createServer(app);
  });

  afterAll(() => {
    server.close();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default happy-path mocks after clearAllMocks
    void import("@server/services").then(({ authService }) => {
      vi.mocked(authService.logout).mockResolvedValue(undefined);
      vi.mocked(authService.getUserFromToken).mockResolvedValue(TEST_USER);
    });
  });

  // -------------------------------------------------------------------------
  describe("POST /api/auth/register", () => {
    it("returns 201 with user + tokens on valid registration", async () => {
      const { authService } = await import("@server/services");
      vi.mocked(authService.register).mockResolvedValueOnce(MOCK_AUTH_RESULT);

      const res = await request(app).post("/api/auth/register").send({
        username: "e2euser",
        email: "e2e@example.com",
        password: "SecurePass1",
        firstName: "Alice",
        lastName: "User",
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("user");
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body.user.username).toBe("e2euser");
      expect(res.body.user).not.toHaveProperty("password");
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("returns 400 when username already exists", async () => {
      const { authService } = await import("@server/services");
      vi.mocked(authService.register).mockRejectedValueOnce(
        new Error("Username already exists"),
      );

      const res = await request(app).post("/api/auth/register").send({
        username: "e2euser",
        email: "other@example.com",
        password: "SecurePass1",
        firstName: "Alice",
        lastName: "User",
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("USERNAME_EXISTS");
    });

    it("returns 400 for missing required fields (no firstName/lastName)", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "partial",
        email: "partial@example.com",
        password: "SecurePass1",
        // firstName and lastName deliberately omitted
      });

      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid email format", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "not-an-email",
        password: "SecurePass1",
        firstName: "Test",
        lastName: "User",
      });

      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  describe("POST /api/auth/login", () => {
    it("returns 200 with tokens on valid credentials", async () => {
      const { authService } = await import("@server/services");
      vi.mocked(authService.login).mockResolvedValueOnce(MOCK_AUTH_RESULT);

      const res = await request(app).post("/api/auth/login").send({
        username: "e2euser",
        password: "SecurePass1",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("csrfToken");
      expect(res.body.user).not.toHaveProperty("password");
    });

    it("returns 401 on invalid credentials", async () => {
      const { authService } = await import("@server/services");
      vi.mocked(authService.login).mockRejectedValueOnce(
        new Error("Invalid credentials"),
      );

      const res = await request(app).post("/api/auth/login").send({
        username: "e2euser",
        password: "WrongPassword",
      });

      expect(res.status).toBe(401);
    });

    it("returns 400 for empty password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "e2euser",
        password: "",
      });

      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  describe("GET /api/auth/user", () => {
    it("returns current user with valid bearer token", async () => {
      const { authService } = await import("@server/services");
      vi.mocked(authService.getUserFromToken).mockResolvedValueOnce(TEST_USER);

      const res = await request(app)
        .get("/api/auth/user")
        .set("Authorization", `Bearer ${MOCK_ACCESS_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("username");
      expect(res.body).not.toHaveProperty("password");
    });

    it("returns 401 without authorization header", async () => {
      const res = await request(app).get("/api/auth/user");
      expect(res.status).toBe(401);
    });

    it("returns 401 when service reports invalid token", async () => {
      const { authService } = await import("@server/services");
      vi.mocked(authService.getUserFromToken).mockRejectedValueOnce(
        new Error("Invalid access token"),
      );

      const res = await request(app)
        .get("/api/auth/user")
        .set("Authorization", "Bearer expired.or.invalid.token");

      expect(res.status).toBe(401);
    });
  });

  // -------------------------------------------------------------------------
  describe("POST /api/auth/logout", () => {
    it("returns 200 and clears cookies on logout", async () => {
      const { authService } = await import("@server/services");
      vi.mocked(authService.logout).mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", `refreshToken=${MOCK_REFRESH_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe("LOGOUT_SUCCESS");
    });
  });
});

// ---------------------------------------------------------------------------
// Full sequence: register → login → get user → logout
// ---------------------------------------------------------------------------

describe("E2E: Full Auth Sequence", () => {
  let app: Express;
  let server: Server;

  beforeAll(async () => {
    app = await createTestApp();
    server = createServer(app);
  });

  afterAll(() => {
    server.close();
  });

  it("completes the full register → login → get user → logout flow", async () => {
    const { authService } = await import("@server/services");

    vi.mocked(authService.register).mockResolvedValueOnce(MOCK_AUTH_RESULT);
    vi.mocked(authService.login).mockResolvedValueOnce(MOCK_AUTH_RESULT);
    vi.mocked(authService.getUserFromToken).mockResolvedValueOnce(TEST_USER);
    vi.mocked(authService.logout).mockResolvedValueOnce(undefined);

    // 1. Register
    const registerRes = await request(app).post("/api/auth/register").send({
      username: "flowuser",
      email: "flow@example.com",
      password: "FlowPass1",
      firstName: "Flow",
      lastName: "Tester",
    });
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.user).toBeDefined();

    // 2. Login
    const loginRes = await request(app).post("/api/auth/login").send({
      username: "flowuser",
      password: "FlowPass1",
    });
    expect(loginRes.status).toBe(200);
    const { accessToken } = loginRes.body as { accessToken: string };
    expect(accessToken).toBeTruthy();

    // 3. Get authenticated user
    const userRes = await request(app)
      .get("/api/auth/user")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(userRes.status).toBe(200);
    expect(userRes.body.username).toBe(TEST_USER.username);

    // 4. Logout (via refresh token cookie, as the route expects)
    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", `refreshToken=${MOCK_REFRESH_TOKEN}`);
    expect(logoutRes.status).toBe(200);
  });
});
