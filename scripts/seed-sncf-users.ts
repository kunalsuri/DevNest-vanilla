/**
 * Seed SNCF Synthetic Users
 *
 * Populates data/users.json with 10 realistic employees of an SNCF-like
 * French rail transportation company for testing and demo purposes.
 *
 * Usage: npm run seed-users
 *
 * SAFETY: Upserts users by username — new users are added, existing users
 * have their profile fields updated. Safe to run repeatedly.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

const DATA_DIR = path.resolve(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

interface StoredUser {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user";
  profilePicture: string | null;
  createdAt: string;
  age?: number | null;
  officeLocation?: string | null;
  position?: string | null;
  department?: string | null;
  phone?: string | null;
}

/** Plain password used for all seeded accounts. Change before any real deployment. */
const SEED_PASSWORD = "SncfDemo2026!";

interface SncfSeedEntry {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "user";
  age: number;
  officeLocation: string;
  position: string;
  department: string;
  phone: string;
}

const SNCF_USERS: SncfSeedEntry[] = [
  {
    username: "marie.dupont",
    firstName: "Marie",
    lastName: "Dupont",
    email: "marie.dupont@sncf-connect.fr",
    role: "admin",
    age: 42,
    officeLocation: "Paris – Montparnasse",
    position: "Directrice Digitale",
    department: "Digital & Innovation",
    phone: "+33 1 45 82 31 00",
  },
  {
    username: "jean.martin",
    firstName: "Jean",
    lastName: "Martin",
    email: "jean.martin@sncf-connect.fr",
    role: "user",
    age: 35,
    officeLocation: "Paris – Gare de Lyon",
    position: "Chef de Projet Ferroviaire",
    department: "Ingénierie",
    phone: "+33 1 43 09 22 17",
  },
  {
    username: "isabelle.leroy",
    firstName: "Isabelle",
    lastName: "Leroy",
    email: "isabelle.leroy@sncf-reseau.fr",
    role: "user",
    age: 48,
    officeLocation: "Lyon – Part-Dieu",
    position: "Responsable Ressources Humaines",
    department: "Ressources Humaines",
    phone: "+33 4 72 60 14 55",
  },
  {
    username: "pierre.moreau",
    firstName: "Pierre",
    lastName: "Moreau",
    email: "pierre.moreau@sncf-reseau.fr",
    role: "user",
    age: 31,
    officeLocation: "Marseille – Saint-Charles",
    position: "Ingénieur Systèmes Embarqués",
    department: "Systèmes & Infrastructure",
    phone: "+33 4 91 50 63 28",
  },
  {
    username: "sophie.bernard",
    firstName: "Sophie",
    lastName: "Bernard",
    email: "sophie.bernard@sncf-connect.fr",
    role: "user",
    age: 27,
    officeLocation: "Paris – Montparnasse",
    position: "Chargée de Marketing Digital",
    department: "Marketing",
    phone: "+33 1 45 82 47 91",
  },
  {
    username: "lucas.petit",
    firstName: "Lucas",
    lastName: "Petit",
    email: "lucas.petit@sncf-voyageurs.fr",
    role: "user",
    age: 29,
    officeLocation: "Bordeaux – Saint-Jean",
    position: "Contrôleur de Gestion",
    department: "Finance",
    phone: "+33 5 56 33 11 72",
  },
  {
    username: "camille.robert",
    firstName: "Camille",
    lastName: "Robert",
    email: "camille.robert@sncf-voyageurs.fr",
    role: "user",
    age: 38,
    officeLocation: "Toulouse – Matabiau",
    position: "Responsable Exploitation",
    department: "Exploitation",
    phone: "+33 5 61 10 08 43",
  },
  {
    username: "thomas.richard",
    firstName: "Thomas",
    lastName: "Richard",
    email: "thomas.richard@sncf-connect.fr",
    role: "user",
    age: 44,
    officeLocation: "Paris – Gare du Nord",
    position: "Architecte Logiciel Senior",
    department: "Digital & Innovation",
    phone: "+33 1 55 31 60 20",
  },
  {
    username: "emma.simon",
    firstName: "Emma",
    lastName: "Simon",
    email: "emma.simon@sncf-reseau.fr",
    role: "user",
    age: 33,
    officeLocation: "Strasbourg – Ville",
    position: "Ingénieure Réseaux",
    department: "Systèmes & Infrastructure",
    phone: "+33 3 88 22 95 06",
  },
  {
    username: "olivier.laurent",
    firstName: "Olivier",
    lastName: "Laurent",
    email: "olivier.laurent@sncf-voyageurs.fr",
    role: "user",
    age: 51,
    officeLocation: "Nantes – Château",
    position: "Directeur Régional",
    department: "Direction Générale",
    phone: "+33 2 40 08 70 35",
  },
];

async function main() {
  // Ensure data directory exists
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Load existing users
  let existing: StoredUser[] = [];
  try {
    const raw = await fs.readFile(USERS_FILE, "utf-8");
    existing = JSON.parse(raw) as StoredUser[];
  } catch {
    // File doesn't exist yet — start fresh
  }

  const existingByUsername = new Map(existing.map((u) => [u.username, u]));

  console.log(`Found ${existing.length} existing users.`);
  console.log("Hashing passwords (bcrypt 12 rounds) — this takes a moment…");

  let added = 0;
  let updated = 0;

  for (const seed of SNCF_USERS) {
    const profileFields = {
      age: seed.age,
      officeLocation: seed.officeLocation,
      position: seed.position,
      department: seed.department,
      phone: seed.phone,
    };

    if (existingByUsername.has(seed.username)) {
      // Upsert: update profile fields and reset password on existing record
      const existingUser = existingByUsername.get(seed.username);
      if (existingUser) {
        const hashed = await bcrypt.hash(SEED_PASSWORD, 12);
        Object.assign(existingUser, { ...profileFields, password: hashed });
      }
      updated++;
      console.log(
        `  [UPDATE] ${seed.username} — profile fields and password reset`,
      );
    } else {
      // Insert new user
      const hashed = await bcrypt.hash(SEED_PASSWORD, 12);
      const user: StoredUser = {
        id: randomUUID(),
        username: seed.username,
        firstName: seed.firstName,
        lastName: seed.lastName,
        email: seed.email,
        role: seed.role,
        password: hashed,
        profilePicture: null,
        createdAt: new Date().toISOString(),
        ...profileFields,
      };
      existing.push(user);
      existingByUsername.set(seed.username, user);
      added++;
      console.log(
        `  [ADD]  ${seed.username} (${seed.firstName} ${seed.lastName})`,
      );
    }
  }

  await fs.writeFile(USERS_FILE, JSON.stringify(existing, null, 2), "utf-8");

  console.log(
    `\nDone! Added ${added} new, updated ${updated} existing SNCF users.`,
  );
  if (added > 0) {
    console.log(`Default password for new seeded accounts: ${SEED_PASSWORD}`);
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
