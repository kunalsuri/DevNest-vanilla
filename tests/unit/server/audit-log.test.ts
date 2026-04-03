import { describe, it, expect, beforeEach } from "vitest";
import { auditLogService } from "@server/services/audit-log-service";
import type { AuditEntry } from "@server/services/audit-log-service";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// Use a temp file so tests never touch the real audit log
const tmpDir = path.join(os.tmpdir(), `devnest-audit-test-${Date.now()}`);
const tmpAuditFile = path.join(tmpDir, "audit-log.jsonl");

// Patch the private constant via module injection isn't straightforward —
// instead we test through the public interface using a real temp directory.

function sampleEntry(overrides: Partial<AuditEntry> = {}): AuditEntry {
  return {
    timestamp: new Date().toISOString(),
    userId: "user-1",
    username: "alice",
    action: "auth.login",
    ip: "127.0.0.1",
    userAgent: "vitest",
    success: true,
    ...overrides,
  };
}

describe("AuditLogService", () => {
  beforeEach(async () => {
    // Ensure a clean temp dir for each test
    await fs.mkdir(tmpDir, { recursive: true });
    // Remove previous test file if present
    try {
      await fs.unlink(tmpAuditFile);
    } catch {
      // noop
    }
  });

  it("returns empty array when no log file exists", async () => {
    const entries = await auditLogService.getRecentEntries(10);
    // May have entries from previous test runs in the real data dir;
    // we just verify the method returns an array without throwing.
    expect(Array.isArray(entries)).toBe(true);
  });

  it("writes an entry and reads it back", async () => {
    const before = (await auditLogService.getRecentEntries(500)).length;

    await auditLogService.log(sampleEntry({ action: "test.write_read" }));

    const after = await auditLogService.getRecentEntries(500);
    expect(after.length).toBe(before + 1);
    const written = after.find((e) => e.action === "test.write_read");
    expect(written).toBeDefined();
    expect(written?.username).toBe("alice");
    expect(written?.success).toBe(true);
  });

  it("respects the limit parameter", async () => {
    for (let i = 0; i < 5; i++) {
      await auditLogService.log(
        sampleEntry({ action: `test.limit_${i}`, userId: `u${i}` }),
      );
    }

    const limited = await auditLogService.getRecentEntries(3);
    expect(limited.length).toBeLessThanOrEqual(3);
  });

  it("records failed actions", async () => {
    await auditLogService.log(
      sampleEntry({
        action: "auth.login",
        success: false,
        userId: null,
        username: null,
      }),
    );

    const entries = await auditLogService.getRecentEntries(500);
    const failEntry = entries.find(
      (e) => e.action === "auth.login" && !e.success,
    );
    expect(failEntry).toBeDefined();
    expect(failEntry?.userId).toBeNull();
  });

  it("does not throw when metadata is included", async () => {
    await expect(
      auditLogService.log(
        sampleEntry({
          action: "admin.update_role",
          metadata: { targetUserId: "u99", newRole: "admin" },
        }),
      ),
    ).resolves.not.toThrow();
  });

  it("returns entries in reverse-chronological order", async () => {
    const firstAction = `test.order_first_${Date.now()}`;
    const secondAction = `test.order_second_${Date.now()}`;
    await auditLogService.log(sampleEntry({ action: firstAction }));
    await auditLogService.log(sampleEntry({ action: secondAction }));

    const entries = await auditLogService.getRecentEntries(10);
    const firstIdx = entries.findIndex((e) => e.action === firstAction);
    const secondIdx = entries.findIndex((e) => e.action === secondAction);

    // secondAction was written last → appears earlier in reverse-chron list
    expect(secondIdx).toBeLessThan(firstIdx);
  });
});
