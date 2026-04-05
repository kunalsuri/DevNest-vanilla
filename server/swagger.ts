import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";
import { env } from "./env";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "DevNest API Documentation",
    version: "1.0.0",
    description:
      "Comprehensive API documentation for DevNest - a modern full-stack application with authentication, user management, and observability features.",
    license: {
      name: "Apache-2.0",
      url: "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
    contact: {
      name: "DevNest Team",
      url: "https://github.com/kunalsuri/DevNest-vanilla",
    },
  },
  servers: [
    {
      url: env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api",
      description:
        env.NODE_ENV === "production"
          ? "Production server"
          : "Development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token obtained from /auth/login endpoint",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "User ID",
          },
          username: {
            type: "string",
            description: "Username",
          },
          email: {
            type: "string",
            format: "email",
            description: "User email address",
          },
          role: {
            type: "string",
            enum: ["user", "admin"],
            description: "User role",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "User creation timestamp",
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "Error message",
          },
          error: {
            type: "string",
            description: "Error details",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: {
            type: "string",
            description: "Username or email",
          },
          password: {
            type: "string",
            format: "password",
            description: "User password",
          },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "JWT access token",
          },
          user: {
            $ref: "#/components/schemas/User",
          },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: {
            type: "string",
            minLength: 3,
            description: "Username (min 3 characters)",
          },
          email: {
            type: "string",
            format: "email",
            description: "User email address",
          },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            description: "User password (min 8 characters)",
          },
        },
      },
      ProfileUpdateRequest: {
        type: "object",
        properties: {
          email: {
            type: "string",
            format: "email",
            description: "New email address",
          },
          currentPassword: {
            type: "string",
            format: "password",
            description: "Current password (required for email change)",
          },
          newPassword: {
            type: "string",
            format: "password",
            description: "New password (optional)",
          },
        },
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["healthy", "degraded", "unhealthy"],
            description: "Overall health status",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "Health check timestamp",
          },
          uptime: {
            type: "number",
            description: "Server uptime in seconds",
          },
          version: {
            type: "string",
            description: "Application version",
          },
        },
      },
      LogEntry: {
        type: "object",
        properties: {
          level: {
            type: "string",
            enum: ["error", "warn", "info", "debug"],
            description: "Log level",
          },
          message: {
            type: "string",
            description: "Log message",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "Log timestamp",
          },
          metadata: {
            type: "object",
            description: "Additional log metadata",
          },
        },
      },
    },
  },
  tags: [
    {
      name: "Authentication",
      description: "User authentication and authorization endpoints",
    },
    {
      name: "Profile",
      description: "User profile management endpoints",
    },
    {
      name: "Health",
      description: "Application health and monitoring endpoints",
    },
    {
      name: "Logging",
      description: "Client-side logging endpoints",
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./server/**/*.ts", "./server/**/*.js"], // Path to API docs
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  if (env.NODE_ENV === "production") {
    return;
  }

  // Swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "DevNest API Documentation",
    }),
  );

  // Serve swagger spec as JSON
  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}
