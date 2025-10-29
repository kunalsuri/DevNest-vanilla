import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import logger from "./logger";

// Server startup timestamp to help invalidate stale sessions
export const SERVER_START_TIME = new Date();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security: Block access to data directory
app.use('/data/*', (req, res) => {
  res.status(404).json({ message: 'Not found' });
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
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
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
  
  const server = await registerRoutes(app);

  // Enhanced error handling middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log error details with Winston
    logger.error(`Error ${status} on ${req.method} ${req.path}`, {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      body: req.body,
      statusCode: status,
      method: req.method,
      path: req.path,
    });

    // Send structured error response
    res.status(status).json({ 
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.details 
      })
    });
  });

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
  const port = Number.parseInt(process.env.PORT || '5000', 10);
  // Use 127.0.0.1 (IPv4) to avoid ENOTSUP error on macOS and Windows
  const host = '127.0.0.1';
  
  server.listen(port, host, () => {
    log(`serving on port ${port}`);
  });
})();
