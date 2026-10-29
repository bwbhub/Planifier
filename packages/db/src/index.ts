import type { Prisma } from "./generated/client/client";

export { getDb } from "./client";
export type { Prisma, User } from "./generated/client/client";
export type { Db } from "./factory";
/** Client reçu dans `db.$transaction(async (tx) => …)`, pour les fonctions appelées dans une transaction. */
export type DbTransaction = Prisma.TransactionClient;
