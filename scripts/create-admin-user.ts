#!/usr/bin/env tsx
/**
 * Create Admin User Script
 *
 * Creates the initial administrator account in the file-based user store.
 *
 * Usage:
 *   npm run create-admin
 *   npm run create-admin -- --username admin --email admin@example.com --password Secret123!
 */

import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

const DATA_DIR = path.resolve(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const BCRYPT_ROUNDS = 12;

interface StoredUser {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null;
  role: string;
  createdAt: string;
}

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const val =
        argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : "";
      if (val) {
        args[key] = val;
        i++;
      }
    }
  }
  return args;
}

async function ask(rl: readline.Interface, q: string): Promise<string> {
  return new Promise((resolve) => rl.question(q, (a) => resolve(a.trim())));
}

async function loadUsers(): Promise<StoredUser[]> {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf-8");
    return JSON.parse(raw) as StoredUser[];
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

async function saveUsers(users: StoredUser[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

async function main(): Promise<void> {
  const args = parseArgs();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let username = args.username ?? "";
  let email = args.email ?? "";
  let password = args.password ?? "";
  let firstName = args.firstName ?? "";
  let lastName = args.lastName ?? "";

  try {
    if (!username) {
      username = await ask(rl, "Admin username: ");
    }
    if (!email) {
      email = await ask(rl, "Admin email: ");
    }
    if (!password) {
      password = await ask(rl, "Admin password (min 8 characters): ");
    }
    if (!firstName) {
      firstName = await ask(rl, "First name (press Enter to skip): ");
    }
    if (!lastName) {
      lastName = await ask(rl, "Last name (press Enter to skip): ");
    }
  } finally {
    rl.close();
  }

  // Validate inputs
  if (!username || username.length < 3) {
    console.error("❌  Username must be at least 3 characters.");
    process.exit(1);
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    console.error(
      "❌  Username may only contain letters, numbers, underscores, and hyphens.",
    );
    process.exit(1);
  }
  if (!email || !email.includes("@")) {
    console.error("❌  A valid email address is required.");
    process.exit(1);
  }
  if (!password || password.length < 8) {
    console.error("❌  Password must be at least 8 characters.");
    process.exit(1);
  }

  const users = await loadUsers();

  if (users.some((u) => u.username === username)) {
    console.error(`❌  Username "${username}" already exists.`);
    process.exit(1);
  }
  if (users.some((u) => u.email === email)) {
    console.error(`❌  Email "${email}" already exists.`);
    process.exit(1);
  }

  console.log("⏳  Hashing password...");
  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const admin: StoredUser = {
    id: randomUUID(),
    username,
    email,
    password: hashedPassword,
    firstName,
    lastName,
    profilePicture: null,
    role: "admin",
    createdAt: new Date().toISOString(),
  };

  users.push(admin);
  await saveUsers(users);

  console.log("✅  Admin user created successfully.");
  console.log(`    ID:       ${admin.id}`);
  console.log(`    Username: ${admin.username}`);
  console.log(`    Email:    ${admin.email}`);
  console.log(`    Role:     ${admin.role}`);
}

main().catch((err) => {
  console.error(
    "❌  Failed:",
    err instanceof Error ? err.message : String(err),
  );
  process.exit(1);
});
