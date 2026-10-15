import { getDbEnv } from "../env";
import { createPrismaClient } from "../factory";
import { seedEvents } from "./events";
import { seedSpaces } from "./spaces";
import { seedUsers } from "./users";

// Point d'entrée de `pnpm --filter @planifier/db seed`. Idempotent : peut être relancé sans doublon.
// Comptes de démo : local uniquement, donc refus net en production.
const env = getDbEnv();
if (env.NODE_ENV === "production") {
  throw new Error("Seed refusé : NODE_ENV=production.");
}

const db = createPrismaClient(env.DATABASE_URL);
try {
  await seedUsers(db);
  await seedSpaces(db);
  await seedEvents(db);
  console.log("Seed terminé.");
} finally {
  await db.$disconnect();
}
