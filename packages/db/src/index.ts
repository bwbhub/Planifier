import { Prisma } from "./generated/client/client";

export { getDb } from "./client";
export type { User } from "./generated/client/client";
export type { Prisma };
export type { Db } from "./factory";
/** Client reçu dans `db.$transaction(async (tx) => …)`, pour les fonctions appelées dans une transaction. */
export type DbTransaction = Prisma.TransactionClient;

/** NULL SQL d'une colonne JSON nullable : Prisma le distingue du `null` JSON (`JsonNull`). */
export const JSON_DB_NULL = Prisma.DbNull;
