import { openLocalSeedDatabase } from "@planifier/db/seeding";

import { seedDemoPasswords } from "./demo-passwords";

// Point d'entrée de `pnpm --filter @planifier/auth seed`, après celui de `db` (`pnpm seed` à la racine).
const db = openLocalSeedDatabase("Seed des mots de passe de démo");
try {
  await seedDemoPasswords(db);
  console.log("Mots de passe de démo posés.");
} finally {
  await db.$disconnect();
}
