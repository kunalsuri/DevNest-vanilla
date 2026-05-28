#!/usr/bin/env tsx
/**
 * feature:new — scaffold a new feature the spec-driven way.
 *
 * Creates a DRAFT spec (NOT application code — code still requires the spec to be
 * APPROVED first), plus the registry + test stubs so a new feature is consistent
 * from the start.
 *
 * Usage:
 *   npm run feature:new -- --slug billing --name "Billing" --safety MEDIUM
 *   npm run feature:new -- --slug billing --name "Billing" --safety MEDIUM \
 *       --keywords "billing,invoice,plan" --status PARTIAL
 *
 * Generates:
 *   agent/specs/<slug>/spec.md         (from TEMPLATE.md, header pre-filled, Status: DRAFT)
 *   agent/INDEX.yaml                   (appends a new F-NN entry)
 *   agent/FEATURE_MAP.md               (appends a detail section)
 *   tests/features/<slug>/<slug>.test.ts (a pending test stub)
 */
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  appendFileSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { execSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INDEX_PATH = join(ROOT, "agent", "INDEX.yaml");
const TEMPLATE_PATH = join(ROOT, "agent", "specs", "TEMPLATE.md");
const FEATURE_MAP_PATH = join(ROOT, "agent", "FEATURE_MAP.md");

const VALID_SAFETY = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const VALID_STATUS = new Set([
  "STABLE",
  "PARTIAL",
  "EXPERIMENTAL",
  "DEPRECATED",
]);

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val =
        argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[(i += 1)] : "true";
      out[key] = val;
    }
  }
  return out;
}

function die(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function nextFeatureId(indexText: string): string {
  const ids = [...indexText.matchAll(/id:\s*F-(\d+)/g)].map((m) =>
    Number(m[1]),
  );
  const next = (ids.length ? Math.max(...ids) : 0) + 1;
  return `F-${String(next).padStart(2, "0")}`;
}

function gitAuthor(): string {
  try {
    return (
      execSync("git config user.name", {
        cwd: ROOT,
        encoding: "utf8",
      }).trim() || "AI Agent"
    );
  } catch {
    return "AI Agent";
  }
}

function buildSpec(
  template: string,
  name: string,
  id: string,
  safety: string,
  author: string,
  date: string,
): string {
  return template
    .replace(/^# Spec Template\s*$/m, `# Spec: ${name}`)
    .replace(/^\| \*\*Feature\*\* \|.*$/m, `| **Feature** | ${name} |`)
    .replace(/^\| \*\*Feature ID\*\* \|.*$/m, `| **Feature ID** | ${id} |`)
    .replace(/^\| \*\*Status\*\* \|.*$/m, `| **Status** | DRAFT |`)
    .replace(
      /^\| \*\*Safety Level\*\* \|.*$/m,
      `| **Safety Level** | ${safety} |`,
    )
    .replace(/^\| \*\*Author\*\* \|.*$/m, `| **Author** | ${author} |`)
    .replace(/^\| \*\*Date\*\* \|.*$/m, `| **Date** | ${date} |`);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.slug;
  const name = args.name;
  const safety = (args.safety ?? "").toUpperCase();
  const status = (args.status ?? "PARTIAL").toUpperCase();
  const keywords = (args.keywords ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (!slug || !name || !args.safety) {
    die(
      'required: --slug <kebab-case> --name "<Name>" --safety <LOW|MEDIUM|HIGH|CRITICAL>',
    );
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    die(`--slug must be kebab-case, got "${slug}"`);
  }
  if (!VALID_SAFETY.has(safety)) {
    die(`--safety must be one of LOW|MEDIUM|HIGH|CRITICAL, got "${safety}"`);
  }
  if (!VALID_STATUS.has(status)) {
    die(
      `--status must be one of STABLE|PARTIAL|EXPERIMENTAL|DEPRECATED, got "${status}"`,
    );
  }

  const specDir = join(ROOT, "agent", "specs", slug);
  if (existsSync(specDir)) {
    die(`spec directory already exists: agent/specs/${slug}`);
  }
  if (!existsSync(TEMPLATE_PATH)) {
    die("agent/specs/TEMPLATE.md not found");
  }

  const indexText = readFileSync(INDEX_PATH, "utf8");
  const id = nextFeatureId(indexText);
  const author = gitAuthor();
  const date = new Date().toISOString().slice(0, 10);

  // 1. Spec from template
  mkdirSync(specDir, { recursive: true });
  const specText = buildSpec(
    readFileSync(TEMPLATE_PATH, "utf8"),
    name,
    id,
    safety,
    author,
    date,
  );
  writeFileSync(join(specDir, "spec.md"), specText, "utf8");

  // 2. INDEX.yaml entry
  const kwList = keywords.length ? keywords.join(", ") : slug;
  const indexEntry = [
    "",
    `  - id: ${id}`,
    `    name: ${name}`,
    `    safety: ${safety}`,
    `    status: ${status}`,
    `    keywords: [${kwList}]`,
    "    server: []",
    "    client: []",
    `    spec: specs/${slug}/spec.md`,
    "",
  ].join("\n");
  appendFileSync(INDEX_PATH, indexEntry, "utf8");

  // 3. FEATURE_MAP.md detail section
  const mapSection = [
    "",
    `### ${id}: ${name}`,
    "",
    `**Description:** ${name} — scaffolded; fill in once the spec is APPROVED and implemented.`,
    "",
    "**Owner:** TBD | **Status & Safety:** authoritative in `INDEX.yaml`",
    "",
    "**Entry Points:** TBD",
    "**Related Files:** TBD",
    `**Spec:** agent/specs/${slug}/spec.md`,
    "",
    `> Scaffolded by \`npm run feature:new\`. Add a one-line row for ${id} to the Feature Registry table.`,
    "",
  ].join("\n");
  appendFileSync(FEATURE_MAP_PATH, mapSection, "utf8");

  // 4. Test stub
  const testDir = join(ROOT, "tests", "features", slug);
  mkdirSync(testDir, { recursive: true });
  const testText = [
    "import { describe, it } from 'vitest';",
    "",
    `// Scaffold for ${name} (${id}). Replace with real tests per the spec's Test Plan.`,
    `describe('${name}', () => {`,
    `  it.todo('implement tests defined in agent/specs/${slug}/spec.md');`,
    "});",
    "",
  ].join("\n");
  writeFileSync(join(testDir, `${slug}.test.ts`), testText, "utf8");

  console.log(`✓ Scaffolded feature ${id} — "${name}" (safety: ${safety})`);
  console.log("  created:");
  console.log(
    `    agent/specs/${slug}/spec.md            (Status: DRAFT — fill in, then set APPROVED)`,
  );
  console.log(
    `    agent/INDEX.yaml                       (entry ${id} appended)`,
  );
  console.log(
    `    agent/FEATURE_MAP.md                   (detail section appended)`,
  );
  console.log(`    tests/features/${slug}/${slug}.test.ts (pending stub)`);
  console.log(
    "\nNext: complete the spec, set Status: APPROVED, then implement. Run `npm run feature:check` to verify.",
  );
}

main();
