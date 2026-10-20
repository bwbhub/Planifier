import { z } from "zod";

/** Longueur minimale du secret (Better Auth refuse en dessous de 32 caractères). */
const MIN_SECRET_LENGTH = 32;
/** En production, un secret trop répétitif (« aaaa… », « 1234… ») est refusé. */
const MIN_DISTINCT_SECRET_CHARS = 12;

const authEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]),
    /** Clé de signature des cookies et de chiffrement. Aucune valeur par défaut (règle 8, skill runtime-configuration). */
    BETTER_AUTH_SECRET: z.string().min(MIN_SECRET_LENGTH),
    /** Origine publique du web (le navigateur n'appelle que lui, ADR 0015) : base des URL et origine de confiance. */
    BETTER_AUTH_URL: z.url(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;
    if (new Set(env.BETTER_AUTH_SECRET).size < MIN_DISTINCT_SECRET_CHARS) {
      ctx.addIssue({
        code: "custom",
        path: ["BETTER_AUTH_SECRET"],
        message: "secret trivial refusé en production",
      });
    }
    if (new URL(env.BETTER_AUTH_URL).protocol !== "https:") {
      ctx.addIssue({
        code: "custom",
        path: ["BETTER_AUTH_URL"],
        message: "https obligatoire en production (cookies Secure)",
      });
    }
  });

export type AuthEnv = z.infer<typeof authEnvSchema>;

/** Valide l'environnement de l'authentification ; échoue au démarrage si une variable manque ou est invalide. */
export function parseAuthEnv(source: Record<string, string | undefined>): AuthEnv {
  return authEnvSchema.parse(source);
}

export function getAuthEnv(): AuthEnv {
  return parseAuthEnv(process.env);
}
