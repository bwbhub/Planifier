import { openLocalSeedDatabase } from "../seeding";
import { seedEvents } from "./events";
import { seedSpaces } from "./spaces";
import { seedUsers } from "./users";

// Point d'entrée de `pnpm --filter @planifier/db seed`. Idempotent : peut être relancé sans doublon.
const db = openLocalSeedDatabase("Seed");
try {
  await seedUsers(db);
  await seedSpaces(db);
  await seedEvents(db);
  console.log("Seed terminé.");
} finally {
  await db.$disconnect();
}
