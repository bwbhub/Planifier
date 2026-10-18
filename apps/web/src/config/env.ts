import "server-only";

import { z } from "zod";

// Seul fichier autorisé à lire process.env (règle ESLint). Lecture paresseuse : `next build`
// n'exige ni secret ni réseau. Toute nouvelle variable est aussi ajoutée à .env.example.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().positive().default(3000),
  /** Origine de l'API vue depuis le serveur web (réseau interne), cible du proxy /rpc. */
  API_INTERNAL_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Valide l'environnement au premier appel puis réutilise le résultat. */
export function getEnv(): Env {
  cached ??= envSchema.parse(process.env);
  return cached;
}
