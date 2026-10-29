import { RECURRENCE_FREQUENCIES, RECURRENCE_MAX_INTERVAL } from "@planifier/constants/todo";
import { z } from "zod";

/** Identifiants générés par la base (`uuid(7)`). */
export const listIdSchema = z.uuid();
export const taskIdSchema = z.uuid();
/** Espace d'une liste partagée et personne qui y a accès (module Espaces). */
export const spaceIdSchema = z.uuid();
export const userIdSchema = z.uuid();

/** Personne telle que les autres la voient : nom affiché seul, jamais l'e-mail (données minimales). */
export const personSchema = z.strictObject({ userId: userIdSchema, name: z.string() });

/** Entrée de toute procédure qui vise une liste : la garde de liste lit `listId` (droits de l'appelant). */
export const listTargetSchema = z.strictObject({ listId: listIdSchema });

/** Entrée de toute procédure qui vise une tâche : la garde de liste lit `taskId` puis sa liste. */
export const taskTargetSchema = z.strictObject({ taskId: taskIdSchema });

/**
 * Raisons d'un `CONFLICT` du module Todo, pour que l'interface dise quoi faire : `STALE_VERSION` (modifiée
 * entre-temps, recharger), `TOO_MANY_LISTS` (nombre de listes au plus atteint), `LIST_FULL` (tâches au plus atteint),
 * `NESTED_SUBTASK` (une sous-tâche n'a pas de sous-tâches : un seul niveau), `NOT_RECURRING` (la tâche n'est pas
 * répétée : la cocher avec `setDone`), `TODO_DISABLED` (le module Todo n'est pas activé dans l'Espace visé).
 */
export const TODO_CONFLICT_REASONS = [
  "STALE_VERSION",
  "TOO_MANY_LISTS",
  "LIST_FULL",
  "NESTED_SUBTASK",
  "NOT_RECURRING",
  "TODO_DISABLED",
] as const;
export type TodoConflictReason = (typeof TODO_CONFLICT_REASONS)[number];

/** Données d'un `CONFLICT` Todo : lues par le client avec ce schéma. */
export const todoConflictDataSchema = z.strictObject({ reason: z.enum(TODO_CONFLICT_REASONS) });

/** Erreurs typées des procédures Todo : `CONFLICT` porte toujours sa raison. */
export const TODO_ERRORS = { CONFLICT: { data: todoConflictDataSchema } };

/** Répétition d'une tâche : tous les `interval` jours, semaines, mois ou ans (ADR 0017). */
export const recurrenceSchema = z.strictObject({
  frequency: z.enum(RECURRENCE_FREQUENCIES),
  interval: z.int().min(1).max(RECURRENCE_MAX_INTERVAL),
});
