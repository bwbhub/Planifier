import { z } from "zod";

/** Identifiants générés par la base (`uuid(7)`). */
export const listIdSchema = z.uuid();
export const taskIdSchema = z.uuid();

/** Entrée de toute procédure qui vise une liste : la garde de liste lit `listId` (droits de l'appelant). */
export const listTargetSchema = z.strictObject({ listId: listIdSchema });

/** Entrée de toute procédure qui vise une tâche : la garde de liste lit `taskId` puis sa liste. */
export const taskTargetSchema = z.strictObject({ taskId: taskIdSchema });

/**
 * Raisons d'un `CONFLICT` du module Todo, pour que l'interface dise quoi faire : `STALE_VERSION` (modifiée
 * entre-temps, recharger), `TOO_MANY_LISTS` (nombre de listes au plus atteint), `LIST_FULL` (tâches au plus atteint).
 */
export const TODO_CONFLICT_REASONS = ["STALE_VERSION", "TOO_MANY_LISTS", "LIST_FULL"] as const;
export type TodoConflictReason = (typeof TODO_CONFLICT_REASONS)[number];

/** Erreurs typées des procédures Todo : `CONFLICT` porte toujours sa raison. */
export const TODO_ERRORS = {
  CONFLICT: { data: z.strictObject({ reason: z.enum(TODO_CONFLICT_REASONS) }) },
};
