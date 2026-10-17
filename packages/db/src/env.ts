import { existsSync } from "node:fs";

import { z } from "zod";

const dbEnvSchema = z.object({
  /** URL PostgreSQL (locale, Neon ou autre : aucune fonction propre à l'hébergeur, ADR 0005). */
  DATABASE_URL: z.url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

/** Lit et valide l'environnement de la base ; échoue au démarrage si DATABASE_URL est absente ou invalide. */
export function getDbEnv() {
  return dbEnvSchema.parse(process.env);
}

/**
 * URL directe de la CLI Prisma (`prisma.config.ts`), lue dans `.env.local` s'il existe.
 * Absente : `generate`, `validate` et `format` fonctionnent (aucune connexion), `migrate` échoue.
 */
export function getCliDatabaseUrl() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  return z.url().optional().parse(process.env.DATABASE_URL_UNPOOLED);
}
