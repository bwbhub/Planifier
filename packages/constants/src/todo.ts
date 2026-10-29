// Teintes de liste de la maquette « Doux et vivant » (packages/tokens).
export const LIST_TINTS = ["general", "work", "couple", "trip"] as const;
export type ListTint = (typeof LIST_TINTS)[number];

/** Nom d'une liste : non vide une fois nettoyé, 60 caractères au plus. */
export const TODO_LIST_NAME_MAX_LENGTH = 60;

/** Titre d'une tâche, 200 caractères au plus ; description, 2 000. */
export const TASK_TITLE_MAX_LENGTH = 200;
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;

/** Listes par utilisateur et tâches par liste au plus : bornent ce que l'API rend en une fois. */
export const TODO_MAX_LISTS = 50;
export const TODO_LIST_MAX_TASKS = 500;

/** Teinte connue : la colonne est une chaîne libre en base, relue avec ce garde. */
export function isListTint(value: string): value is ListTint {
  return LIST_TINTS.some((tint) => tint === value);
}

/** Rythmes de répétition d'une tâche (ADR 0017). */
export const RECURRENCE_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

/** Intervalle d'une répétition (« toutes les N semaines ») au plus. */
export const RECURRENCE_MAX_INTERVAL = 99;
