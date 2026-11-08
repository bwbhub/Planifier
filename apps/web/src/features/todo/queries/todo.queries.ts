import { type ListTasksOutput, PAGE_MAX_LIMIT, type TaskOutput } from "@planifier/api-contract";
import { useToast } from "@planifier/ui/components/toast";
import {
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { orpc } from "@/lib/orpc";

import { TODO_LABELS } from "../labels";
import { type ListPages, withOpenTaskDelta } from "../utils/list-pages";
import { withOccurrenceDone, withTaskDone } from "../utils/task-done";
import { todoErrorMessage } from "../utils/todo-error-message";

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
export function useListMembers(listId: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery(orpc.todo.lists.members.queryOptions({ input: { listId }, enabled }));
}

/**
 * Mes Espaces, candidats au partage d'une liste (`sharingChoices`) : la première page seulement (`PAGE_MAX_LIMIT`).
 * Lu du module Espaces de l'API, sans passer par son code web.
 */
export function useSharingSpaces() {
  return useQuery(orpc.spaces.space.list.queryOptions({ input: { limit: PAGE_MAX_LIMIT } }));
}

/** Une tâche pour son détail : la tâche, sa liste et ses sous-tâches. */
export function useTask(taskId: string) {
  return useQuery(orpc.todo.tasks.get.queryOptions({ input: { taskId } }));
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

/**
 * Le message est posé ici et non à l'appel : la ligne disparaît avec la tâche, un rappel de `mutate` ne tiendrait pas.
 * Pour la même raison, `onDeleted` (fermer le détail) passe par le hook : le détail se démonte dès que la tâche
 * n'existe plus.
 */
export function useDeleteTask({ onDeleted }: { onDeleted?: () => void } = {}) {
  const onSettled = useInvalidateTodo();
  const { notify } = useToast();
  return useMutation(
    orpc.todo.tasks.delete.mutationOptions({
      onSuccess: () => {
        notify(TODO_LABELS.taskDeleted);
        onDeleted?.();
      },
      onSettled,
    }),
  );
}

/** Une liste dans le message d'envoi : de quoi la nommer et y revenir. */
interface ListRef {
  id: string;
  name: string;
}

/**
 * Envoie une tâche (sous-tâches comprises) dans `to`. Le message vit ici : le détail se ferme dès l'envoi, un rappel
 * de `mutate` ne tiendrait pas. « Annuler » remet la tâche dans sa liste (et dit pourquoi si elle ne peut pas y
 * revenir) ; sans lui quand l'assignation a été retirée : la remettre ne la rendrait pas.
 */
export function useMoveTask() {
  const invalidate = useInvalidateTodo();
  const { notify } = useToast();
  const move = useMutation(orpc.todo.tasks.move.mutationOptions({ onSettled: invalidate }));
  const moveBack = useMutation(orpc.todo.tasks.move.mutationOptions({ onSettled: invalidate }));

  async function undo(moved: TaskOutput, from: ListRef) {
    try {
      await moveBack.mutateAsync({ taskId: moved.id, version: moved.version, listId: from.id });
      notify(TODO_LABELS.taskMovedBack);
    } catch (error) {
      // Modifiée depuis, liste d'origine passée en lecture seule ou pleine : on le dit, rien n'est forcé.
      notify(todoErrorMessage(error));
    }
  }

  function announce(task: TaskOutput, moved: TaskOutput, from: ListRef, to: ListRef) {
    if (task.assignee !== null && moved.assignee === null) {
      notify(TODO_LABELS.taskMovedNoAssignee(to.name));
      return;
    }
    notify(TODO_LABELS.taskMovedTo(to.name), {
      action: { label: TODO_LABELS.undo, onAction: () => void undo(moved, from) },
    });
  }

  async function send(task: TaskOutput, from: ListRef, to: ListRef): Promise<boolean> {
    try {
      const moved = await move.mutateAsync({
        taskId: task.id,
        version: task.version,
        listId: to.id,
      });
      announce(task, moved, from, to);
      return true;
    } catch {
      // Le refus s'affiche déjà, dans le détail (`move.error`).
      return false;
    }
  }

  return { send, isPending: move.isPending, error: move.isError ? move.error : null };
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
