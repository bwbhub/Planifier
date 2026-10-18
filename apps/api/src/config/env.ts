import { z } from "zod";

// Seul fichier autorisé à lire process.env (règle ESLint). Toute nouvelle variable est aussi ajoutée à .env.example.
const envSchema = z.object({
  // Obligatoire : un défaut « development » journaliserait le détail des erreurs en production.
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().positive().default(3001),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Valide l'environnement au premier appel puis réutilise le résultat. */
export function getEnv(): Env {
  cached ??= envSchema.parse(process.env);
  return cached;
}
