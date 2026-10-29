import { type ListTasksOutput, PAGE_MAX_LIMIT } from "@planifier/api-contract";
import {
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { orpc } from "@/lib/orpc";

import { type ListPages, withOpenTaskDelta } from "../utils/list-pages";
import { withOccurrenceDone, withTaskDone } from "../utils/task-done";

/** Invalidation centralisée : toute écriture du module relit ses listes et ses tâches (compteurs compris). */
function invalidateTodo(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: orpc.todo.key() });
}

/** Rappel commun aux écritures du module : relire tout le module une fois la mutation terminée. */
function useInvalidateTodo() {
  const queryClient = useQueryClient();
  return () => invalidateTodo(queryClient);
}

/** Mes listes et celles de mes Espaces, page par page (curseur). */
export function useTodoLists() {
  return useInfiniteQuery(
    orpc.todo.lists.list.infiniteOptions({
      input: (cursor: string | undefined) => ({ cursor }),
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    }),
  );
}

/** Personnes d'une liste : son propriétaire et les membres de son Espace. */
export function useListMembers(listId: string) {
  return useQuery(orpc.todo.lists.members.queryOptions({ input: { listId } }));
}

/**
 * Mes Espaces, candidats au partage d'une liste (`sharingChoices`) : la première page seulement (`PAGE_MAX_LIMIT`).
 * Lu du module Espaces de l'API, sans passer par son code web.
 */
export function useSharingSpaces() {
  return useQuery(orpc.spaces.space.list.queryOptions({ input: { limit: PAGE_MAX_LIMIT } }));
}

export function useTasks(listId: string) {
  return useQuery(orpc.todo.tasks.list.queryOptions({ input: { listId } }));
}

export function useCreateList() {
  const onSettled = useInvalidateTodo();
  return useMutation(orpc.todo.lists.create.mutationOptions({ onSettled }));
}

export function useUpdateList() {
  const onSettled = useInvalidateTodo();
  return useMutation(orpc.todo.lists.update.mutationOptions({ onSettled }));
}

export function useDeleteList() {
  const onSettled = useInvalidateTodo();
  return useMutation(orpc.todo.lists.delete.mutationOptions({ onSettled }));
}

export function useCreateTask() {
  const onSettled = useInvalidateTodo();
  return useMutation(orpc.todo.tasks.create.mutationOptions({ onSettled }));
}

export function useUpdateTask() {
  const onSettled = useInvalidateTodo();
  return useMutation(orpc.todo.tasks.update.mutationOptions({ onSettled }));
}

/** Occurrence d'une tâche répétée faite : échéance avancée tout de suite (rendu optimiste), restaurée en cas de refus. */
export function useCompleteOccurrence(listId: string) {
  const queryClient = useQueryClient();
  const onSettled = useInvalidateTodo();
  const tasksKey = orpc.todo.tasks.list.queryKey({ input: { listId } });
  return useMutation(
    orpc.todo.tasks.completeOccurrence.mutationOptions({
      onMutate: async ({ taskId, today }) => {
        await queryClient.cancelQueries({ queryKey: orpc.todo.key() });
        const previousTasks = queryClient.getQueryData<ListTasksOutput>(tasksKey);
        if (previousTasks !== undefined) {
          queryClient.setQueryData(tasksKey, withOccurrenceDone(previousTasks, taskId, today));
        }
        return { previousTasks };
      },
      onError: (_error, _input, context) => {
        if (context?.previousTasks !== undefined)
          queryClient.setQueryData(tasksKey, context.previousTasks);
      },
      onSettled,
    }),
  );
}

export function useFinishTask() {
  const onSettled = useInvalidateTodo();
  return useMutation(orpc.todo.tasks.finish.mutationOptions({ onSettled }));
}

export function useUndoCompletion() {
  const onSettled = useInvalidateTodo();
  return useMutation(orpc.todo.tasks.undoCompletion.mutationOptions({ onSettled }));
}

export function useDeleteTask() {
  const onSettled = useInvalidateTodo();
  return useMutation(orpc.todo.tasks.delete.mutationOptions({ onSettled }));
}

/**
 * Cocher : retour immédiat (rendu optimiste) de la tâche et du compte de la liste, tout restauré si le serveur
 * refuse. Seul le geste de l'utilisateur coche ; rien n'est coché d'office.
 */
export function useSetTaskDone(listId: string) {
  const queryClient = useQueryClient();
  const onSettled = useInvalidateTodo();
  const tasksKey = orpc.todo.tasks.list.queryKey({ input: { listId } });
  const listsKey = orpc.todo.lists.list.key();
  return useMutation(
    orpc.todo.tasks.setDone.mutationOptions({
      onMutate: async ({ taskId, done }) => {
        await queryClient.cancelQueries({ queryKey: orpc.todo.key() });
        const previousTasks = queryClient.getQueryData<ListTasksOutput>(tasksKey);
        const previousLists = queryClient.getQueriesData<ListPages>({ queryKey: listsKey });
        if (previousTasks === undefined) return { previousTasks, previousLists };
        const { tasks, delta } = withTaskDone(previousTasks, taskId, done);
        queryClient.setQueryData(tasksKey, tasks);
        queryClient.setQueriesData<ListPages>({ queryKey: listsKey }, (pages) =>
          pages === undefined ? pages : withOpenTaskDelta(pages, listId, delta),
        );
        return { previousTasks, previousLists };
      },
      onError: (_error, _input, context) => {
        if (context?.previousTasks !== undefined)
          queryClient.setQueryData(tasksKey, context.previousTasks);
        for (const [key, pages] of context?.previousLists ?? []) {
          queryClient.setQueryData(key, pages);
        }
      },
      onSettled,
    }),
  );
}
