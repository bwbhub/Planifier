import { ORPCError } from "@orpc/server";
import type { SpaceConflictReason } from "@planifier/api-contract";

/** `CONFLICT` typé du contrat (`SPACE_ERRORS`) : l'interface lit la raison pour dire quoi faire. */
export function spaceConflict(reason: SpaceConflictReason) {
  return new ORPCError("CONFLICT", { data: { reason } });
}
