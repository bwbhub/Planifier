import { z } from "zod";

/** Identifiants générés par la base (`uuid(7)`). */
export const entryIdSchema = z.uuid();
export const spaceIdSchema = z.uuid();
export const taskIdSchema = z.uuid();

/** Entrée d'une procédure qui ne vise qu'une entrée. */
export const entryTargetSchema = z.strictObject({ entryId: entryIdSchema });

/**
 * Raisons d'un `CONFLICT` du module Agenda, pour que l'interface dise quoi faire : `STALE_VERSION` (modifiée
 * entre-temps, recharger), `TOO_MANY_ENTRIES` (nombre d'entrées au plus atteint), `AGENDA_DISABLED` (le module Agenda
 * n'est pas activé dans l'Espace visé), `TOO_MANY_IMPORTS` (nombre d'agendas importés au plus atteint),
 * `REFRESH_TOO_SOON` (agenda importé lu il y a moins d'une minute), `IMPORTED_ENTRY` (entrée importée : modifiable à
 * la source seulement).
 */
export const AGENDA_CONFLICT_REASONS = [
  "STALE_VERSION",
  "TOO_MANY_ENTRIES",
  "AGENDA_DISABLED",
  "TOO_MANY_IMPORTS",
  "REFRESH_TOO_SOON",
  "IMPORTED_ENTRY",
] as const;
export type AgendaConflictReason = (typeof AGENDA_CONFLICT_REASONS)[number];

/** Données d'un `CONFLICT` Agenda : lues par le client avec ce schéma. */
export const agendaConflictDataSchema = z.strictObject({ reason: z.enum(AGENDA_CONFLICT_REASONS) });

/** Erreurs typées des procédures Agenda : `CONFLICT` porte toujours sa raison. */
export const AGENDA_ERRORS = { CONFLICT: { data: agendaConflictDataSchema } };

/** Identifiant d'un agenda importé. */
export const subscriptionIdSchema = z.uuid();
