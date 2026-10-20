import type { Db } from "../factory";
import { DEMO_MODULES, SEED_IDS } from "./ids";

/** Comptes de démo, locaux uniquement ; leurs mots de passe sont posés par le seed de `auth`. */
export const DEMO_USERS = [
  { id: SEED_IDS.alice, email: "alice@example.test", name: "Alice" },
  { id: SEED_IDS.bob, email: "bob@example.test", name: "Bob" },
  { id: SEED_IDS.chloe, email: "chloe@example.test", name: "Chloé" },
] as const;

/** Trois comptes de démo, locaux uniquement. Chacun active les trois modules. */
export async function seedUsers(db: Db) {
  // `id` sort du profil : il sert de clé d'upsert, et n'est écrit qu'à la création.
  for (const { id, ...profile } of DEMO_USERS) {
    const data = { ...profile, modules: DEMO_MODULES };
    await db.user.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
}
