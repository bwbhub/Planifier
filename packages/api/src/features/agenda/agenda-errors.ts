import { ORPCError } from "@orpc/server";
import type { AgendaConflictReason } from "@planifier/api-contract";

/** `CONFLICT` typé du contrat (`AGENDA_ERRORS`) : l'interface lit la raison pour dire quoi faire. */
export function agendaConflict(reason: AgendaConflictReason) {
  return new ORPCError("CONFLICT", { data: { reason } });
}
