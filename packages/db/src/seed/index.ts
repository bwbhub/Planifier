import { getDbEnv } from "../env";
import { createPrismaClient } from "../factory";
import { seedEvents } from "./events";
import { assertLocalDatabase } from "../local-guard";
import { seedSpaces } from "./spaces";
import { seedUsers } from "./users";

// Point d'entrée de `pnpm --filter @planifier/db seed`. Idempotent : peut être relancé sans doublon.
const env = getDbEnv();
assertLocalDatabase(env.DATABASE_URL, env.NODE_ENV, "Seed");

const db = createPrismaClient(env.DATABASE_URL);
try {
  await seedUsers(db);
  await seedSpaces(db);
  await seedEvents(db);
  console.log("Seed terminé.");
} finally {
  await db.$disconnect();
}
