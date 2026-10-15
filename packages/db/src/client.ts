import "server-only";

import { getDbEnv } from "./env";
import { createPrismaClient, type Db } from "./factory";

let client: Db | undefined;

/** Client Prisma unique du processus, créé au premier appel. */
export function getDb(): Db {
  client ??= createPrismaClient(getDbEnv().DATABASE_URL);
  return client;
}
