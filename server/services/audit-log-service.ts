/**
 * Audit Log Service
 *
 * Records security-relevant actions to an append-only JSONL file
 * at data/audit-log.jsonl. Each entry is a single JSON line.
 *
 * Failure to write an audit entry is logged but never crashes the app.
 */

import fs from "node:fs/promises";
import path from "node:path";
import logger from "../logger";

export interface AuditEntry {
  timestamp: string;
  userId: string | null;
  username: string | null;
  action: string;
  ip: string | null;
  userAgent: string | null;
  success: boolean;
  metadata?: Record<string, unknown>;
}

const AUDIT_FILE = path.resolve(process.cwd(), "data", "audit-log.jsonl");

class AuditLogService {
  async log(entry: AuditEntry): Promise<void> {
    const line = JSON.stringify(entry) + "\n";
    try {
      await fs.mkdir(path.dirname(AUDIT_FILE), { recursive: true });
      await fs.appendFile(AUDIT_FILE, line, "utf-8");
    } catch (err) {
      // Audit logging failure must never crash the application
      logger.error("Failed to write audit log entry", {
        error: err instanceof Error ? err.message : String(err),
        action: entry.action,
      });
    }
  }

  async getRecentEntries(limit = 100): Promise<AuditEntry[]> {
    try {
      const raw = await fs.readFile(AUDIT_FILE, "utf-8");
      const lines = raw.trim().split("\n").filter(Boolean);
      const entries = lines.map((line) => JSON.parse(line) as AuditEntry);
      return entries.slice(-limit).reverse();
    } catch (err: any) {
      if (err.code === "ENOENT") {
        return [];
      }
      throw err;
    }
  }
}

export const auditLogService = new AuditLogService();
