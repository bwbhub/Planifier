import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/client/client";

/** Crée un client Prisma sur l'URL donnée. Utilisé par `client.ts` et par le seed (hors `server-only`). */
export function createPrismaClient(connectionString: string) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export type Db = ReturnType<typeof createPrismaClient>;
