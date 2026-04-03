#!/usr/bin/env tsx
/**
 * Restore Data Script
 *
 * Extracts a backup archive back to the data/ directory.
 * WARNING: This will overwrite the current data/ contents.
 *
 * Usage:
 *   npm run restore -- data-backup-2026-04-04_10-00-00.tar.gz
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";

const BACKUPS_DIR = path.resolve(process.cwd(), "backups");

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "yes");
    });
  });
}

async function main(): Promise<void> {
  const archiveName = process.argv[2];

  if (!archiveName) {
    console.error("❌  Usage: npm run restore -- <backup-filename>");
    console.error(
      "   Example: npm run restore -- data-backup-2026-04-04_10-00-00.tar.gz",
    );
    process.exit(1);
  }

  // Security: prevent path traversal
  if (
    archiveName.includes("/") ||
    archiveName.includes("\\") ||
    archiveName.includes("..")
  ) {
    console.error(
      "❌  Invalid filename. Do not include path separators or '..'.",
    );
    process.exit(1);
  }

  const archivePath = path.join(BACKUPS_DIR, archiveName);

  if (!existsSync(archivePath)) {
    console.error(`❌  Backup file not found: ${archivePath}`);
    process.exit(1);
  }

  console.warn(
    "⚠️   WARNING: This will OVERWRITE the current data/ directory.",
  );
  const ok = await confirm(`Restore from "${archiveName}"?`);
  if (!ok) {
    console.log("Restore cancelled.");
    process.exit(0);
  }

  console.log(`⏳  Restoring from ${archivePath} ...`);
  execFileSync("tar", ["-xzf", archivePath, "-C", process.cwd()], {
    stdio: "inherit",
  });

  console.log(`✅  Data restored from: backups/${archiveName}`);
}

main().catch((err) => {
  console.error(
    "❌  Restore failed:",
    err instanceof Error ? err.message : String(err),
  );
  process.exit(1);
});
