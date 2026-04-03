import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupSwagger } from "./swagger";
import { initSentry, setupSentryErrorHandler } from "./monitoring/sentry";
import logger from "./logger";
import { env } from "./env";

// Server startup timestamp to help invalidate stale sessions
export { SERVER_START_TIME } from "./server-start-time";

const app = express();

// Initialize Sentry (must be first)
initSentry(app);

// Security: Helmet middleware for setting various HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Tailwind and inline styles
          "https://fonts.googleapis.com", // Google Fonts CSS
        ],
        scriptSrc: [
          "'self'",
          ...(env.NODE_ENV === "development"
            ? ["'unsafe-inline'", "'unsafe-eval'"]
            : []),
        ], // unsafe-inline and unsafe-eval needed for Vite HMR and React Fast Refresh in dev
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'",
          ...(env.NODE_ENV === "development" ? ["ws:", "wss:"] : []),
        ],
        fontSrc: [
          "'self'",
          "data:",
          "https://fonts.gstatic.com", // Google Fonts files
        ],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for development compatibility
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }),
);

// Security: CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (env.ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from unauthorized origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
    maxAge: 86400, // 24 hours
  }),
);

// Security: Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    message: "Too many requests from this IP, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      message: "Too many requests from this IP, please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000),
    });
  },
});

// Apply rate limiting to all API routes
app.use("/api/", apiLimiter);

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    message: "Too many authentication attempts, please try again later.",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      message: "Too many authentication attempts, please try again later.",
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      retryAfter: 900, // 15 minutes in seconds
    });
  },
});

// Apply stricter rate limiting to auth endpoints
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/refresh", authLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" })); // Add size limit for security
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Trace middleware for distributed tracing
import { traceMiddleware } from "./middleware/trace-middleware";
app.use(traceMiddleware);

// Security: Block access to data directory
app.use("/data/{*path}", (req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      // Only serialize response body in development/debug to avoid CPU cost and PII leakage in production
      if (env.NODE_ENV !== "production" && capturedJsonResponse) {
        const serialized = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${serialized}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Ensure storage is ready before starting server
  const { storage } = await import("./storage");
  await storage.ready();

  // Setup API documentation
  setupSwagger(app);

  const server = await registerRoutes(app);

  // Setup Sentry error handler (must be before other error handlers)
  setupSentryErrorHandler(app);

  // Enhanced error handling middleware
  app.use(
    (
      err: Error & { status?: number; statusCode?: number; details?: unknown },
      req: Request,
      res: Response,
      _next: NextFunction,
    ) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Log error details with Winston
      logger.error(`Error ${status} on ${req.method} ${req.path}`, {
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        body: req.body,
        statusCode: status,
        method: req.method,
        path: req.path,
      });

      // Send structured error response
      res.status(status).json({
        message,
        ...(process.env.NODE_ENV === "development" && {
          stack: err.stack,
          details: err.details,
        }),
      });
    },
  );

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = Number.parseInt(process.env.PORT || "5000", 10);
  // Use 127.0.0.1 (IPv4) to avoid ENOTSUP error on macOS and Windows
  const host = "127.0.0.1";

  server.listen(port, host, () => {
    log(`serving on port ${port}`);
  });
})();
