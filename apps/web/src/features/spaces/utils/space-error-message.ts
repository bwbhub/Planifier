import { ORPCError } from "@orpc/client";
import { SPACE_CONFLICT_REASONS, type SpaceConflictReason } from "@planifier/api-contract";
import { SPACE_MAX_ACTIVE_INVITES, SPACE_MAX_MEMBERS } from "@planifier/constants/spaces";
import { z } from "zod";

import { actionErrorMessage, conflictReason } from "@/features/_shared/utils/action-error-message";

const conflictDataSchema = z.object({ reason: z.enum(SPACE_CONFLICT_REASONS) });

const CONFLICT_MESSAGES: Record<SpaceConflictReason, string> = {
  LAST_OWNER:
    "L'Espace a besoin d'au moins un propriétaire : nomme quelqu'un d'autre, ou supprime l'Espace.",
  CREATOR:
    "La personne qui a créé l'Espace en reste propriétaire : elle ne peut être ni rétrogradée ni retirée.",
  SPACE_FULL: `Cet Espace est complet : ${String(SPACE_MAX_MEMBERS)} personnes au plus.`,
  TOO_MANY_INVITES: `${String(SPACE_MAX_ACTIVE_INVITES)} liens sont déjà en cours : révoques-en un pour en créer un autre.`,
  STALE_VERSION:
    "Quelqu'un a modifié l'Espace pendant que tu le faisais. Tes changements n'ont pas été enregistrés : recharge pour partir de la dernière version.",
};

/** Raison d'un `CONFLICT` d'Espace, ou `null` pour toute autre erreur. */
export function spaceConflictReason(error: unknown): SpaceConflictReason | null {
  return conflictReason(error, conflictDataSchema);
}

/** Message à montrer après un refus d'une action sur un Espace. */
export function spaceErrorMessage(error: unknown): string {
  return actionErrorMessage(error, {
    conflictData: conflictDataSchema,
    conflicts: CONFLICT_MESSAGES,
    notFound: "Cet Espace n'existe plus, ou tu n'en fais plus partie.",
    forbidden: "Seuls les propriétaires de l'Espace peuvent faire ça.",
  });
}

/** L'Espace n'existe pas pour l'appelant (jamais existé, supprimé, ou quitté). */
export function isSpaceNotFound(error: unknown): boolean {
  return error instanceof ORPCError && error.code === "NOT_FOUND";
}
