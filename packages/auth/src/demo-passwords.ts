import type { Db } from "@planifier/db";
import { DEMO_USERS } from "@planifier/db/seeding";
import { hashPassword } from "better-auth/crypto";

/** Mot de passe des comptes de démo, locaux uniquement (seed refusé en production et sur base distante). */
export const DEMO_PASSWORD = "planifier-demo";

/** Fournisseur e-mail + mot de passe de Better Auth : `accountId` y est l'id de l'utilisateur. */
const CREDENTIAL_PROVIDER = "credential";

/**
 * Pose le mot de passe de démo sur les comptes du seed de `db` (lancé avant). Même hash que l'inscription (Better
 * Auth, réglages par défaut). Idempotent : le compte e-mail + mot de passe est créé ou mis à jour.
 */
export async function seedDemoPasswords(db: Db) {
  const password = await hashPassword(DEMO_PASSWORD);
  for (const { id: userId } of DEMO_USERS) {
    const key = { providerId: CREDENTIAL_PROVIDER, accountId: userId };
    await db.account.upsert({
      where: { providerId_accountId: key },
      create: { ...key, userId, password },
      update: { password },
    });
  }
}
