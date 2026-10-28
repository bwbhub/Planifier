import { ORPCError } from "@orpc/server";
import type { TodoConflictReason } from "@planifier/api-contract";

/** `CONFLICT` typé du contrat (`TODO_ERRORS`) : l'interface lit la raison pour dire quoi faire. */
export function todoConflict(reason: TodoConflictReason) {
  return new ORPCError("CONFLICT", { data: { reason } });
}
