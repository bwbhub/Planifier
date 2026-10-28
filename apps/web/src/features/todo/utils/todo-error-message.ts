import { ORPCError } from "@orpc/client";
import { todoConflictDataSchema, type TodoConflictReason } from "@planifier/api-contract";
import { TODO_LIST_MAX_TASKS, TODO_MAX_LISTS } from "@planifier/constants/todo";

const CONFLICT_MESSAGES: Record<TodoConflictReason, string> = {
  STALE_VERSION:
    "Cet élément a changé entre-temps. Recharge la page pour voir sa dernière version.",
  TOO_MANY_LISTS: `Tu as déjà ${String(TODO_MAX_LISTS)} listes. Supprimes-en une pour en créer une autre.`,
  LIST_FULL: `Cette liste compte déjà ${String(TODO_LIST_MAX_TASKS)} tâches. Supprimes-en pour en ajouter.`,
  NESTED_SUBTASK: "Une sous-tâche ne peut pas avoir ses propres sous-tâches.",
};

const FALLBACK = "Quelque chose n'a pas fonctionné, rien n'est perdu. Réessaie dans un instant.";

/** Message à montrer après un refus d'une action Todo : rassurant, avec quoi faire ensuite. */
export function todoErrorMessage(error: unknown): string {
  if (!(error instanceof ORPCError)) return FALLBACK;
  if (error.code === "CONFLICT") {
    const data = todoConflictDataSchema.safeParse(error.data);
    return data.success ? CONFLICT_MESSAGES[data.data.reason] : FALLBACK;
  }
  if (error.code === "NOT_FOUND") return "Cet élément n'existe plus. Recharge la page.";
  if (error.code === "TOO_MANY_REQUESTS") {
    return "Trop d'actions d'affilée. Patiente quelques secondes, puis réessaie.";
  }
  return FALLBACK;
}
