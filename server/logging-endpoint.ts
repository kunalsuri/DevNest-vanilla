/**
 * Server-side Logging Endpoint
 *
 * Provides an API endpoint that browser clients can POST logs to
 * for server-side file persistence and Winston integration.
 * This solves the browser file access limitation while providing centralized logging.
 */

import { Request, Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import logger from "./logger";

/**
 * Convert LogLevel enum to string name
 */
function getLevelName(level: number | string): string {
  if (typeof level === "string") {
    return level;
  }

  const levelMap: Record<number, string> = {
    0: "debug",
    1: "info",
    2: "warn",
    3: "error",
    4: "fatal",
  };

  return levelMap[level] || "info";
}

interface LogEntry {
  timestamp: string;
  level: number | string; // Support both LogLevel enum and string
  levelName?: string; // Preferred string representation
  message: string;
  component?: string;
  metadata?: any;
}

const MAX_LOG_ENTRIES = 50;
const MAX_MESSAGE_LENGTH = 2000;

/**
 * POST /api/logs - Accept log entries from browser clients
 * Logs are processed through Winston for consistent server-side logging
 */
export async function handleLogSubmission(req: Request, res: Response) {
  try {
    const entries: LogEntry[] = req.body.logs || [req.body];

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        message: "Invalid log entries",
        code: "INVALID_LOG_ENTRIES",
      });
    }

    if (entries.length > MAX_LOG_ENTRIES) {
      return res.status(400).json({
        message: `Maximum ${MAX_LOG_ENTRIES} log entries per request`,
        code: "TOO_MANY_LOG_ENTRIES",
      });
    }

    // Process each log entry through Winston
    for (const entry of entries) {
      const message =
        typeof entry.message === "string"
          ? entry.message.slice(0, MAX_MESSAGE_LENGTH)
          : "";
      const levelName = entry.levelName || getLevelName(entry.level);
      const logLevel = levelName.toLowerCase();

      // Log through Winston with client context
      logger.log(logLevel as any, `[Client] ${message}`, {
        component: entry.component,
        source: "client",
        ...entry.metadata,
      });
    }

    res.json({
      success: true,
      processed: entries.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[LogEndpoint] Failed to process logs", {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      message: "Failed to write logs",
      code: "LOG_WRITE_ERROR",
    });
  }
}

/**
 * GET /api/logs - Retrieve recent log entries (for debugging)
 * Reads directly from Winston's log files
 */
const logQuerySchema = z.object({
  level: z
    .enum(["all", "debug", "info", "warn", "error", "fatal"])
    .default("all"),
  lines: z.coerce.number().int().min(1).max(1000).default(100),
});

export async function handleLogRetrieval(req: Request, res: Response) {
  try {
    const logsDir = path.resolve(process.cwd(), "logs");
    const parsed = logQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid query parameters",
        code: "VALIDATION_ERROR",
        errors: parsed.error.issues,
      });
      return;
    }
    const { level, lines } = parsed.data;

    const files = await fs.readdir(logsDir);
    const logFiles = files
      .filter((file) => file.endsWith(".log"))
      .filter((file) => level === "all" || file.startsWith(level));

    const logs: unknown[] = [];

    for (const file of logFiles.slice(-3)) {
      // Prevent path traversal — only allow plain filenames
      if (file.includes("/") || file.includes("\\") || file.includes("..")) {
        continue;
      }
      const filePath = path.join(logsDir, file);
      const content = await fs.readFile(filePath, "utf8");
      const fileLines = content
        .split("\n")
        .filter(Boolean)
        .slice(-lines)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return { raw: line };
          }
        });

      logs.push(...fileLines);
    }

    // Sort by timestamp
    logs.sort(
      (a: any, b: any) =>
        new Date(a.timestamp || 0).getTime() -
        new Date(b.timestamp || 0).getTime(),
    );

    res.json({
      logs: logs.slice(-lines),
      total: logs.length,
      files: logFiles.length,
    });
  } catch (error) {
    logger.error("[LogEndpoint] Failed to retrieve logs", {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      message: "Failed to retrieve logs",
      code: "LOG_RETRIEVAL_ERROR",
    });
  }
}
