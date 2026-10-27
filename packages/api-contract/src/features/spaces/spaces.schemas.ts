import { SPACE_ROLES } from "@planifier/constants/spaces";
import { z } from "zod";

/** Identifiants générés par la base (`uuid(7)`). */
export const spaceIdSchema = z.uuid();
export const userIdSchema = z.uuid();

export const spaceRoleSchema = z.enum(SPACE_ROLES);

/** Entrée de toute procédure qui vise un Espace : la garde d'Espace lit `spaceId` (droits de l'appelant). */
export const spaceTargetSchema = z.strictObject({ spaceId: spaceIdSchema });

/**
 * Raisons d'un `CONFLICT` sur un Espace, pour que l'interface dise quoi faire :
 * `LAST_OWNER` (nommer un autre propriétaire ou supprimer l'Espace), `SPACE_FULL`, `TOO_MANY_INVITES`,
 * `STALE_VERSION` (l'Espace a changé entre-temps, recharger).
 */
export const SPACE_CONFLICT_REASONS = [
  "LAST_OWNER",
  "SPACE_FULL",
  "TOO_MANY_INVITES",
  "STALE_VERSION",
] as const;
export type SpaceConflictReason = (typeof SPACE_CONFLICT_REASONS)[number];

/** Erreurs typées des procédures d'Espace : `CONFLICT` porte toujours sa raison. */
export const SPACE_ERRORS = {
  CONFLICT: { data: z.strictObject({ reason: z.enum(SPACE_CONFLICT_REASONS) }) },
};

export const emptyOutputSchema = z.strictObject({});
