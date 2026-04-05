/**
 * Health Check Endpoints Tests
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import express, { type Express } from "express";

describe("Health Check Endpoints", () => {
  let app: Express;

  beforeAll(async () => {
    // Dynamically import to avoid esbuild issues in test environment
    const { handleHealthCheck, handleReadinessCheck } = await import(
      "@server/health"
    );

    app = express();
    app.get("/health", handleHealthCheck);
    app.get("/health/ready", handleReadinessCheck);
  });

  describe("GET /health", () => {
    it("should return healthy status", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(typeof response.body.uptime).toBe("number");
    });

    it("should return valid ISO timestamp", async () => {
      const response = await request(app).get("/health");

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe("Invalid Date");
    });
  });

  describe("GET /health/ready", () => {
    it("should return readiness status", async () => {
      const response = await request(app).get("/health/ready");

      // May return 200 or 503 depending on environment
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
    });

    it("should include checks object", async () => {
      const response = await request(app).get("/health/ready");

      expect(response.body).toHaveProperty("checks");
      if (response.body.checks) {
        // Verify structure when checks are present
        if (response.body.checks.memory) {
          expect(["ok", "high"]).toContain(response.body.checks.memory);
        }
      }
    });

    it("should return valid ISO timestamp", async () => {
      const response = await request(app).get("/health/ready");

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe("Invalid Date");
    });
  });
});
