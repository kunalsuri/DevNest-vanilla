#!/usr/bin/env tsx
/**
 * feature:check — validates that agent/INDEX.yaml stays consistent with the codebase,
 * and (optionally) enforces the "no app change without an APPROVED spec" gate.
 *
 * Usage:
 *   npm run feature:check            # integrity only (safe for CI on every run)
 *   npm run feature:check -- --changed   # also gate changed server/client/shared files
 *
 * Integrity checks (always run, fail the build on violation):
 *   - every feature has a valid id (F-NN), name, safety, and status
 *   - every server/client path listed in INDEX.yaml actually exists on disk
 *   - every referenced spec file exists
 *
 * Spec gate (only with --changed): each changed app file must be covered by an
 * APPROVED spec's "Files In" list. Strictness is set by GATE_MODE below.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INDEX_PATH = join(ROOT, "agent", "INDEX.yaml");
const SPECS_DIR = join(ROOT, "agent", "specs");

// ───────────────────────────────────────────────────────────────────────────
// POLICY KNOB — how strict is the spec-coverage gate?
//   'warn'  → uncovered app-file changes print a warning, build still passes.
//   'error' → uncovered app-file changes fail the build (exit 1).
// A fresh template starts as 'warn' (only F-01 has a spec). Flip to 'error'
// once specs cover the code you intend to protect. See AGENTS.md §0.
// ───────────────────────────────────────────────────────────────────────────
const GATE_MODE: "warn" | "error" =
  process.env.FEATURE_CHECK_GATE_MODE === "error" ? "error" : "warn";

const VALID_SAFETY = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const VALID_STATUS = new Set([
  "STABLE",
  "PARTIAL",
  "EXPERIMENTAL",
  "DEPRECATED",
]);

interface Feature {
  id?: string;
  name?: string;
  safety?: string;
  status?: string;
  server: string[];
  client: string[];
  spec?: string;
  line: number;
}

/** Strip a trailing ` # comment` from a scalar YAML value. */
function stripComment(value: string): string {
  return value.split(/\s+#/)[0].trim();
}

/** Parse an inline YAML array like "[a, b/, c.ts]" into ["a", "b/", "c.ts"]. */
function parseInlineArray(value: string): string[] {
  const open = value.indexOf("[");
  const close = value.indexOf("]");
  if (open === -1 || close === -1) {
    return [];
  }
  return value
    .slice(open + 1, close)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Minimal line-based parser for INDEX.yaml's regular `features:` list. */
function parseIndex(text: string): Feature[] {
  const features: Feature[] = [];
  const lines = text.split(/\r?\n/);
  let current: Feature | null = null;

  lines.forEach((raw, i) => {
    const idMatch = raw.match(/^\s*-\s*id:\s*(.+)$/);
    if (idMatch) {
      if (current) {
        features.push(current);
      }
      current = {
        server: [],
        client: [],
        line: i + 1,
        id: stripComment(idMatch[1]),
      };
      return;
    }
    if (!current) {
      return;
    }
    const kv = raw.match(/^\s{4}(\w+):\s*(.*)$/);
    if (!kv) {
      return;
    }
    const [, key, rawVal] = kv;
    switch (key) {
      case "name":
        current.name = stripComment(rawVal);
        break;
      case "safety":
        current.safety = stripComment(rawVal);
        break;
      case "status":
        current.status = stripComment(rawVal);
        break;
      case "spec":
        current.spec = stripComment(rawVal);
        break;
      case "server":
        current.server = parseInlineArray(rawVal);
        break;
      case "client":
        current.client = parseInlineArray(rawVal);
        break;
    }
  });
  if (current) {
    features.push(current);
  }
  return features;
}

function checkIntegrity(features: Feature[]): string[] {
  const errors: string[] = [];
  for (const f of features) {
    const where = `INDEX.yaml:${f.line} (${f.id ?? "??"})`;
    if (!f.id || !/^F-\d+$/.test(f.id)) {
      errors.push(`${where}: invalid or missing id`);
    }
    if (!f.name) {
      errors.push(`${where}: missing name`);
    }
    if (!f.safety || !VALID_SAFETY.has(f.safety)) {
      errors.push(
        `${where}: invalid safety "${f.safety}" (expected LOW|MEDIUM|HIGH|CRITICAL)`,
      );
    }
    if (!f.status || !VALID_STATUS.has(f.status)) {
      errors.push(
        `${where}: invalid status "${f.status}" (expected STABLE|PARTIAL|EXPERIMENTAL|DEPRECATED)`,
      );
    }
    for (const p of [...f.server, ...f.client]) {
      if (!existsSync(join(ROOT, p))) {
        errors.push(`${where}: path does not exist → ${p}`);
      }
    }
    if (f.spec && !existsSync(join(ROOT, "agent", f.spec))) {
      errors.push(`${where}: spec file not found → agent/${f.spec}`);
    }
  }
  return errors;
}

/** Recursively collect every spec.md under agent/specs/. */
function findSpecFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...findSpecFiles(full));
    } else if (entry === "spec.md") {
      out.push(full);
    }
  }
  return out;
}

function extractFilesInSection(text: string): string {
  const start = text.search(/^###\s*2\.1\s+Files In\b/m);
  if (start === -1) {
    return "";
  }
  const rest = text.slice(start);
  const end = rest.search(/^###\s*2\.2\s+Files Out\b/m);
  return end === -1 ? rest : rest.slice(0, end);
}

/** Backtick-quoted paths from the Files In section of APPROVED specs = "covered". */
function collectCoveredPaths(): Set<string> {
  const covered = new Set<string>();
  if (!existsSync(SPECS_DIR)) {
    return covered;
  }
  for (const file of findSpecFiles(SPECS_DIR)) {
    const text = readFileSync(file, "utf8");
    const approved =
      /\|\s*\*\*Status\*\*\s*\|\s*APPROVED\s*\|/.test(text) ||
      /Status:\s*APPROVED\b/.test(text);
    if (!approved) {
      continue;
    }
    const filesIn = extractFilesInSection(text);
    for (const m of filesIn.matchAll(/`([^`]+\/[^`]*)`/g)) {
      covered.add(m[1].trim().replace(/^\.?\//, ""));
    }
  }
  return covered;
}

function gitLines(args: string[]): string[] {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    return [];
  }
}

function hasGitRef(ref: string): boolean {
  try {
    execFileSync("git", ["rev-parse", "--verify", ref], {
      cwd: ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function baseRef(): string {
  const base = process.env.GITHUB_BASE_REF || "main";
  const remoteBase = `origin/${base}`;
  return hasGitRef(remoteBase) ? remoteBase : base;
}

function changedAppFiles(mode: "changed" | "staged"): string[] {
  const files = new Set<string>();
  if (mode === "changed") {
    for (const file of [
      ...gitLines(["diff", "--name-only", `${baseRef()}...HEAD`]),
      ...gitLines(["diff", "--name-only", "HEAD"]),
      ...gitLines(["ls-files", "--others", "--exclude-standard"]),
    ]) {
      files.add(file);
    }
  } else {
    for (const file of gitLines(["diff", "--name-only", "--cached"])) {
      files.add(file);
    }
  }
  return [...files].filter((f) =>
    /^(server|client|shared)\/.+\.(ts|tsx)$/.test(f),
  );
}

function checkSpecGate(mode: "changed" | "staged"): {
  violations: string[];
  fatal: boolean;
} {
  const covered = collectCoveredPaths();
  const changed = changedAppFiles(mode);
  const violations = changed.filter((f) => !covered.has(f));
  return { violations, fatal: GATE_MODE === "error" && violations.length > 0 };
}

function main(): void {
  const args = process.argv.slice(2);
  const gateModes: Array<"changed" | "staged"> = [];
  if (args.includes("--changed")) {
    gateModes.push("changed");
  }
  if (args.includes("--staged")) {
    gateModes.push("staged");
  }

  if (!existsSync(INDEX_PATH)) {
    console.error(`✗ agent/INDEX.yaml not found at ${INDEX_PATH}`);
    process.exit(1);
  }

  const features = parseIndex(readFileSync(INDEX_PATH, "utf8"));
  const errors = checkIntegrity(features);

  console.log(
    `feature:check — parsed ${features.length} features from agent/INDEX.yaml`,
  );

  if (errors.length) {
    console.error(`\n✗ ${errors.length} integrity error(s):`);
    for (const e of errors) {
      console.error(`  - ${e}`);
    }
  } else {
    console.log(
      "✓ INDEX.yaml integrity OK (ids, safety, status, paths, specs all valid)",
    );
  }

  let fatal = errors.length > 0;

  if (gateModes.length) {
    const violations = new Set<string>();
    let gateFatal = false;
    for (const mode of gateModes) {
      const result = checkSpecGate(mode);
      gateFatal = gateFatal || result.fatal;
      for (const violation of result.violations) {
        violations.add(violation);
      }
    }
    const allViolations = [...violations];
    if (allViolations.length) {
      const label = GATE_MODE === "error" ? "✗" : "⚠";
      console.log(
        `\n${label} ${allViolations.length} changed app file(s) not covered by an APPROVED spec (GATE_MODE=${GATE_MODE}):`,
      );
      for (const v of allViolations) {
        console.log(`  - ${v}`);
      }
      if (GATE_MODE === "warn") {
        console.log(
          '  → create a spec (npm run feature:new) or flip GATE_MODE to "error" to enforce.',
        );
      }
    } else {
      console.log(
        "\n✓ spec gate OK — all changed app files are covered by an APPROVED spec.",
      );
    }
    fatal = fatal || gateFatal;
  }

  process.exit(fatal ? 1 : 0);
}

main();
