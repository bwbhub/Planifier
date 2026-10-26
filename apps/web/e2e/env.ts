import { z } from "zod";

// Environnement des tests E2E (seul fichier du dossier autorisé à lire process.env, règle ESLint). La base est celle
// des tests d'intégration : jamais une autre que `_test`, puisque les parcours y créent des comptes.
const e2eEnvSchema = z.object({
  DATABASE_URL: z.url().refine((url) => new URL(url).pathname.endsWith("_test"), {
    message: "les tests E2E n'écrivent que dans une base dont le nom finit par _test",
  }),
  CI: z.stringbool().default(false),
});

export type E2eEnv = z.infer<typeof e2eEnvSchema>;

export function getE2eEnv(): E2eEnv {
  return e2eEnvSchema.parse(process.env);
}
