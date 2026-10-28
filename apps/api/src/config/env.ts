import { PLAN_RATE_LIMIT } from "@planifier/api";
import { z } from "zod";

// Seul fichier autorisé à lire process.env (règle ESLint). Toute nouvelle variable est aussi ajoutée à .env.example.
const envSchema = z.object({
  // Obligatoire : un défaut « development » journaliserait le détail des erreurs en production.
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().positive().default(3001),
  // Plans oRPC acceptés par minute et par IP. Ne se relève que pour les tests de bout en bout, qui viennent tous de
  // localhost ; jamais en production.
  RPC_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(PLAN_RATE_LIMIT.max),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Valide l'environnement au premier appel puis réutilise le résultat. */
export function getEnv(): Env {
  cached ??= envSchema.parse(process.env);
  return cached;
}
