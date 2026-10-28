import type { ListListsOutput, ListTasksOutput } from "@planifier/api-contract";
import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/lib/orpc";

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

export function useTodoLists() {
  return useQuery(orpc.todo.lists.list.queryOptions({ input: {} }));
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
  const listsKey = orpc.todo.lists.list.queryKey({ input: {} });
  return useMutation(
    orpc.todo.tasks.setDone.mutationOptions({
      onMutate: async ({ taskId, done }) => {
        await queryClient.cancelQueries({ queryKey: orpc.todo.key() });
        const previousTasks = queryClient.getQueryData<ListTasksOutput>(tasksKey);
        const previousLists = queryClient.getQueryData<ListListsOutput>(listsKey);
        if (previousTasks === undefined) return { previousTasks, previousLists };
        const { tasks, delta } = withTaskDone(previousTasks, taskId, done);
        queryClient.setQueryData(tasksKey, tasks);
        if (previousLists !== undefined) {
          queryClient.setQueryData(listsKey, {
            items: previousLists.items.map((list) =>
              list.id === listId ? { ...list, openTaskCount: list.openTaskCount + delta } : list,
            ),
          });
        }
        return { previousTasks, previousLists };
      },
      onError: (_error, _input, context) => {
        if (context?.previousTasks !== undefined)
          queryClient.setQueryData(tasksKey, context.previousTasks);
        if (context?.previousLists !== undefined)
          queryClient.setQueryData(listsKey, context.previousLists);
      },
      onSettled,
    }),
  );
}
