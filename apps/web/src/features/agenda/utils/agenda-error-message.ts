import { agendaConflictDataSchema, type AgendaConflictReason } from "@planifier/api-contract";
import { AGENDA_MAX_ENTRIES } from "@planifier/constants/agenda";

import { actionErrorMessage } from "@/features/_shared/utils/action-error-message";

const CONFLICT_MESSAGES: Record<AgendaConflictReason, string> = {
  STALE_VERSION:
    "Cette entrée a changé entre-temps. Recharge la page pour voir sa dernière version.",
  TOO_MANY_ENTRIES: `Ton agenda compte déjà ${String(AGENDA_MAX_ENTRIES)} entrées. Supprimes-en pour en ajouter.`,
  AGENDA_DISABLED:
    "Agenda n'est pas activé dans cet Espace. Un propriétaire peut l'activer dans ses réglages.",
};

/** Message à montrer après un refus d'une action Agenda. */
export function agendaErrorMessage(error: unknown): string {
  return actionErrorMessage(error, {
    conflictData: agendaConflictDataSchema,
    conflicts: CONFLICT_MESSAGES,
    notFound: "Cet élément n'existe plus. Recharge la page.",
    forbidden: "Seule la personne qui l'a créée peut modifier cette entrée.",
  });
}
