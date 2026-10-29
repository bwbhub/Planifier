import { inviteTokenSchema } from "@planifier/api-contract";

import { ROUTES } from "@/lib/routes";

/**
 * Lien d'invitation à partager. Le jeton va dans le fragment (`#…`) : le navigateur ne l'envoie jamais au serveur,
 * il n'apparaît donc ni dans les journaux ni dans l'en-tête Referer.
 */
export function inviteLinkOf(origin: string, token: string): string {
  return `${origin}${ROUTES.joinSpace}#${token}`;
}

/** Jeton lu dans le fragment de l'adresse (`#jeton`), ou `null` s'il manque ou n'a pas la forme attendue. */
export function inviteTokenOf(hash: string): string | null {
  const parsed = inviteTokenSchema.safeParse(hash.replace(/^#/, ""));
  return parsed.success ? parsed.data : null;
}
