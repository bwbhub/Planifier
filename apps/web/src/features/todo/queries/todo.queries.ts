import type { ListTasksOutput } from "@planifier/api-contract";
import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/lib/orpc";

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

export function useDeleteTask() {
  const onSettled = useInvalidateTodo();
  return useMutation(orpc.todo.tasks.delete.mutationOptions({ onSettled }));
}

/**
 * Cocher : retour immédiat (rendu optimiste), état restauré si le serveur refuse. Seul le geste de l'utilisateur
 * coche ; rien n'est coché d'office.
 */
export function useSetTaskDone(listId: string) {
  const queryClient = useQueryClient();
  const onSettled = useInvalidateTodo();
  const queryKey = orpc.todo.tasks.list.queryKey({ input: { listId } });
  return useMutation(
    orpc.todo.tasks.setDone.mutationOptions({
      onMutate: async ({ taskId, done }) => {
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<ListTasksOutput>(queryKey);
        queryClient.setQueryData<ListTasksOutput>(queryKey, (current) =>
          current === undefined
            ? current
            : {
                items: current.items.map((task) =>
                  task.id === taskId ? { ...task, completedAt: done ? new Date() : null } : task,
                ),
              },
        );
        return { previous };
      },
      onError: (_error, _input, context) => {
        if (context?.previous !== undefined) queryClient.setQueryData(queryKey, context.previous);
      },
      onSettled,
    }),
  );
}
