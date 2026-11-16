import { ORPCError } from "@orpc/server";
import type { EventConflictReason } from "@planifier/api-contract";

/** `CONFLICT` typé du contrat (`EVENT_ERRORS`) : l'interface lit la raison pour dire quoi faire. */
export function eventConflict(reason: EventConflictReason) {
  return new ORPCError("CONFLICT", { data: { reason } });
}
