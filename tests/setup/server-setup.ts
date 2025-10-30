// server/__tests__/setup.ts
import { beforeAll, afterAll, afterEach } from "vitest";

// Setup global test environment
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
  process.env.SESSION_SECRET = "test-session-secret";
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
});

afterEach(() => {
  // Clear any mocks or timers after each test
});

afterAll(async () => {
  // Cleanup after all tests
});
