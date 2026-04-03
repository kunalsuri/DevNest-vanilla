#!/usr/bin/env tsx
/**
 * Backup Data Script
 *
 * Creates a timestamped gzip archive of the data/ directory.
 * Archives are stored in backups/ and excluded from version control.
 *
 * Usage:
 *   npm run backup
 */

import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const BACKUPS_DIR = path.resolve(process.cwd(), "backups");

function getTimestamp(): string {
  return new Date()
    .toISOString()
    .slice(0, 19)
    .replace("T", "_")
    .replace(/:/g, "-");
}

async function main(): Promise<void> {
  mkdirSync(BACKUPS_DIR, { recursive: true });

  const archiveName = `data-backup-${getTimestamp()}.tar.gz`;
  const archivePath = path.join(BACKUPS_DIR, archiveName);

  console.log(`⏳  Backing up ${DATA_DIR} → ${archivePath} ...`);

  execFileSync("tar", ["-czf", archivePath, "-C", process.cwd(), "data"], {
    stdio: "inherit",
  });

  console.log(`✅  Backup created: backups/${archiveName}`);
}

main().catch((err) => {
  console.error(
    "❌  Backup failed:",
    err instanceof Error ? err.message : String(err),
  );
  process.exit(1);
});
