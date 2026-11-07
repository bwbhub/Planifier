import { todoConflictDataSchema, type TodoConflictReason } from "@planifier/api-contract";
import { TODO_LIST_MAX_TASKS, TODO_MAX_LISTS } from "@planifier/constants/todo";

import { actionErrorMessage } from "@/features/_shared/utils/action-error-message";

const CONFLICT_MESSAGES: Record<TodoConflictReason, string> = {
  STALE_VERSION:
    "Cet élément a changé entre-temps. Recharge la page pour voir sa dernière version.",
  TOO_MANY_LISTS: `Tu as déjà ${String(TODO_MAX_LISTS)} listes. Supprimes-en une pour en créer une autre.`,
  LIST_FULL: `Cette liste compte déjà ${String(TODO_LIST_MAX_TASKS)} tâches. Supprimes-en pour en ajouter.`,
  NESTED_SUBTASK: "Une sous-tâche ne peut pas avoir ses propres sous-tâches.",
  NOT_RECURRING: "Cette tâche ne se répète plus. Recharge la page.",
  TODO_DISABLED:
    "Todo n'est pas activé dans cet Espace. Un propriétaire peut l'activer dans ses réglages.",
  ASSIGNEE_NOT_MEMBER:
    "Cette personne n'est plus dans l'Espace. Recharge la page et choisis quelqu'un d'autre.",
  TIME_WITHOUT_DATE: "Une heure demande un jour. Choisis d'abord un jour d'échéance.",
};

/** Message à montrer après un refus d'une action Todo. */
export function todoErrorMessage(error: unknown): string {
  return actionErrorMessage(error, {
    conflictData: todoConflictDataSchema,
    conflicts: CONFLICT_MESSAGES,
    notFound: "Cet élément n'existe plus. Recharge la page.",
    forbidden:
      "Tu n'as pas le droit de faire ça sur cette liste. Recharge la page pour voir ce qui a changé.",
  });
}
