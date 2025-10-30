// server/__tests__/integration.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";

describe("Server Integration Tests", () => {
  let app: Express;

  beforeAll(() => {
    // Create a minimal Express app for testing
    app = express();
    app.use(express.json());
    app.use(cors());
    app.use(helmet());

    // Test routes
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    app.post("/api/echo", (req, res) => {
      res.json({ received: req.body });
    });

    app.get("/api/error", (req, res) => {
      res.status(500).json({ error: "Internal server error" });
    });
  });

  describe("Health Check Endpoint", () => {
    it("should return 200 status", async () => {
      const response = await request(app).get("/api/health");
      expect(response.status).toBe(200);
    });

    it("should return valid JSON", async () => {
      const response = await request(app).get("/api/health");
      expect(response.body).toHaveProperty("status");
      expect(response.body.status).toBe("ok");
    });

    it("should include timestamp", async () => {
      const response = await request(app).get("/api/health");
      expect(response.body).toHaveProperty("timestamp");
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe("Request/Response Handling", () => {
    it("should handle JSON POST requests", async () => {
      const testData = { message: "Hello, World!" };
      const response = await request(app)
        .post("/api/echo")
        .send(testData)
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual(testData);
    });

    it("should handle large payloads", async () => {
      const largeData = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          data: "x".repeat(100),
        })),
      };

      const response = await request(app)
        .post("/api/echo")
        .send(largeData)
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.received.items).toHaveLength(100);
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await request(app).get("/api/nonexistent");
      expect(response.status).toBe(404);
    });

    it("should handle server errors gracefully", async () => {
      const response = await request(app).get("/api/error");
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Security Headers", () => {
    it("should include security headers", async () => {
      const response = await request(app).get("/api/health");

      // Helmet adds various security headers
      expect(response.headers).toHaveProperty("x-content-type-options");
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("should handle CORS correctly", async () => {
      const response = await request(app)
        .options("/api/health")
        .set("Origin", "http://localhost:3000");

      expect(response.status).toBe(204);
    });
  });

  describe("Content Type Validation", () => {
    it("should accept JSON content type", async () => {
      const response = await request(app)
        .post("/api/echo")
        .send({ test: "data" })
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
    });

    it("should set correct content type in response", async () => {
      const response = await request(app).get("/api/health");
      expect(response.headers["content-type"]).toMatch(/json/);
    });
  });

  describe("Request Validation", () => {
    it("should handle empty bodies", async () => {
      const response = await request(app)
        .post("/api/echo")
        .send({})
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual({});
    });

    it("should handle special characters in data", async () => {
      const specialData = {
        text: "Special chars: <>&\"' €£¥",
        emoji: "🚀 🎉 ✨",
      };

      const response = await request(app)
        .post("/api/echo")
        .send(specialData)
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual(specialData);
    });
  });
});
