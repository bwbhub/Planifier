import type { ListListsOutput, TodoListOutput } from "@planifier/api-contract";
import type { InfiniteData } from "@tanstack/react-query";

/** Listes lues page par page (`useTodoLists`). */
export type ListPages = InfiniteData<ListListsOutput, string | undefined>;

export function allLists(pages: ListPages): TodoListOutput[] {
  return pages.pages.flatMap(({ items }) => items);
}

/** Compte des tâches à faire de `listId` décalé de `delta` (rendu optimiste d'une coche). */
export function withOpenTaskDelta(pages: ListPages, listId: string, delta: number): ListPages {
  return {
    ...pages,
    pages: pages.pages.map((page) => ({
      ...page,
      items: page.items.map((list) =>
        list.id === listId ? { ...list, openTaskCount: list.openTaskCount + delta } : list,
      ),
    })),
  };
}
