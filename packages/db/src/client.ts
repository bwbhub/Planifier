import "server-only";

import { getDbEnv } from "./env";
import { createPrismaClient, type Db } from "./factory";

// Rangé sur globalThis : le rechargement à chaud de `next dev` réévalue ce module, un `let` local
// créerait un nouveau client (et un nouveau pool de connexions) à chaque fois.
declare global {
  var planifierDb: Db | undefined;
}

/** Client Prisma unique du processus, créé au premier appel. */
export function getDb(): Db {
  globalThis.planifierDb ??= createPrismaClient(getDbEnv().DATABASE_URL);
  return globalThis.planifierDb;
}
