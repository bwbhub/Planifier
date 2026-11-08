import { ORPCError } from "@orpc/client";
import { type ImportFailureReason, importFailureSchema } from "@planifier/api-contract";

import { agendaErrorMessage } from "./agenda-error-message";

/** Ce que dit l'écran de la raison d'un échec de lecture, avec quoi faire ensuite. */
export const IMPORT_FAILURE_MESSAGES: Record<ImportFailureReason, string> = {
  LINK_INVALID:
    "Ce lien n'est pas celui d'un agenda d'un service admis (Google, Outlook, iCloud). Colle l'adresse privée au format iCal.",
  FEED_UNREACHABLE:
    "Le service n'a pas répondu comme attendu. Vérifie que le lien est encore valide, puis réessaie.",
  FEED_TOO_LARGE: "Cet agenda est trop gros pour être importé.",
  FEED_UNREADABLE:
    "Ce lien ne donne pas un agenda lisible. Vérifie que c'est bien l'adresse au format iCal.",
  LINK_UNREADABLE:
    "Le lien enregistré n'est plus lisible. Retire cet agenda, puis colle son lien à nouveau.",
};

/** Raison d'un refus de lecture (`BAD_REQUEST`), ou `null` pour toute autre erreur. */
function failureReason(error: unknown): ImportFailureReason | null {
  if (!(error instanceof ORPCError) || error.code !== "BAD_REQUEST") return null;
  const parsed = importFailureSchema.safeParse(error.data);
  return parsed.success ? parsed.data.reason : null;
}

/** Message à montrer après le refus d'une action sur un agenda importé. */
export function importErrorMessage(error: unknown): string {
  const reason = failureReason(error);
  return reason === null ? agendaErrorMessage(error) : IMPORT_FAILURE_MESSAGES[reason];
}
