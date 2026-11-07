import type { TodoListOutput } from "@planifier/api-contract";

/** Listes où l'on peut ajouter une tâche : celles qu'on peut modifier (pas les listes montrées en lecture seule). */
export function writableLists(lists: readonly TodoListOutput[]): TodoListOutput[] {
  return lists.filter(({ can }) => can.write);
}

/**
 * Liste proposée d'abord : celle qu'on regarde si on peut y écrire, sinon la première liste perso, sinon la première
 * liste écrivable. `null` : aucune liste où écrire.
 */
export function defaultTaskList(
  writable: readonly TodoListOutput[],
  openListId: string | null,
): TodoListOutput | null {
  return (
    writable.find(({ id }) => id === openListId) ??
    writable.find(({ space }) => space === null) ??
    writable[0] ??
    null
  );
}
