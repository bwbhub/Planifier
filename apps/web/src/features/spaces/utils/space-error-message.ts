import { ORPCError } from "@orpc/client";
import { SPACE_CONFLICT_REASONS, type SpaceConflictReason } from "@planifier/api-contract";
import { SPACE_MAX_ACTIVE_INVITES, SPACE_MAX_MEMBERS } from "@planifier/constants/spaces";
import { z } from "zod";

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
  if (!(error instanceof ORPCError) || error.code !== "CONFLICT") return null;
  const parsed = conflictDataSchema.safeParse(error.data);
  return parsed.success ? parsed.data.reason : null;
}

/** Message à montrer après un refus d'une action sur un Espace : il dit quoi faire, sans accuser. */
export function spaceErrorMessage(error: unknown): string {
  const reason = spaceConflictReason(error);
  if (reason !== null) return CONFLICT_MESSAGES[reason];
  if (error instanceof ORPCError) {
    if (error.code === "FORBIDDEN") return "Seuls les propriétaires de l'Espace peuvent faire ça.";
    if (error.code === "NOT_FOUND") return "Cet Espace n'existe plus, ou tu n'en fais plus partie.";
    if (error.code === "TOO_MANY_REQUESTS") {
      return "Trop de demandes d'affilée. Patiente quelques secondes, puis réessaie.";
    }
  }
  return "Quelque chose n'a pas fonctionné. Rien n'est perdu : réessaie dans un instant.";
}

/** L'Espace n'existe pas pour l'appelant (jamais existé, supprimé, ou quitté). */
export function isSpaceNotFound(error: unknown): boolean {
  return error instanceof ORPCError && error.code === "NOT_FOUND";
}
