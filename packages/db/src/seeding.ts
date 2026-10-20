import { getDbEnv } from "./env";
import { createPrismaClient, type Db } from "./factory";
import { assertLocalDatabase } from "./local-guard";

export { DEMO_USERS } from "./seed/users";

/**
 * Client d'une base locale vérifiée, pour un seed (celui de `db` ou d'un package qui le complète, comme `auth`).
 * Refuse la production et toute base distante (`assertLocalDatabase`).
 */
export function openLocalSeedDatabase(action: string): Db {
  const { DATABASE_URL, NODE_ENV } = getDbEnv();
  assertLocalDatabase(DATABASE_URL, NODE_ENV, action);
  return createPrismaClient(DATABASE_URL);
}
