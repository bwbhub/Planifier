import { agendaConflictDataSchema, type AgendaConflictReason } from "@planifier/api-contract";
import { AGENDA_MAX_ENTRIES, AGENDA_MAX_IMPORTS } from "@planifier/constants/agenda";

import { actionErrorMessage } from "@/features/_shared/utils/action-error-message";

const CONFLICT_MESSAGES: Record<AgendaConflictReason, string> = {
  STALE_VERSION:
    "Cette entrée a changé entre-temps. Recharge la page pour voir sa dernière version.",
  TOO_MANY_ENTRIES: `Ton agenda compte déjà ${String(AGENDA_MAX_ENTRIES)} entrées. Supprimes-en pour en ajouter.`,
  AGENDA_DISABLED:
    "Agenda n'est pas activé dans cet Espace. Un propriétaire peut l'activer dans ses réglages.",
  TOO_MANY_IMPORTS: `Tu as déjà ${String(AGENDA_MAX_IMPORTS)} agendas importés. Retires-en un pour en ajouter.`,
  REFRESH_TOO_SOON: "Cet agenda vient d'être actualisé. Réessaie dans une minute.",
  IMPORTED_ENTRY:
    "Cette entrée vient d'un agenda importé : modifie-la à la source, ou retire l'agenda importé.",
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
