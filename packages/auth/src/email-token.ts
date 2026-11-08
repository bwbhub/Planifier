import { z } from "zod";

const TokenPayload = z.object({
  email: z.string(),
  updateTo: z.string().optional(),
  requestType: z.string().optional(),
});

/** Ce que porte un jeton de vérification d'adresse de Better Auth. */
export type EmailTokenPayload = z.infer<typeof TokenPayload>;

/**
 * Lit le contenu d'un jeton de vérification **sans** contrôler la signature. À n'appeler que sur un jeton que Better
 * Auth vient de fabriquer ou de valider dans la même requête (callbacks d'envoi, hook après écriture) : jamais sur
 * une entrée brute. `null` si le jeton n'a pas la forme attendue.
 */
export function readEmailTokenPayload(token: string): EmailTokenPayload | null {
  const payload = token.split(".")[1];
  if (payload === undefined) return null;
  try {
    const json: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const parsed = TokenPayload.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Le jeton confirme-t-il un changement d'adresse (et non une inscription) ? */
export function isChangeEmailToken(token: string): boolean {
  return readEmailTokenPayload(token)?.requestType === "change-email-verification";
}
