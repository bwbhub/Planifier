import type { TodayTaskOutput } from "@planifier/api-contract";
import { useToast } from "@planifier/ui/components/toast";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { orpc } from "@/lib/orpc";

import { TODAY_LABELS } from "../labels";
import { dayWindow } from "../utils/today-day";

/** Tâches du jour de l'appareil. */
export function useTodayTasks(day: string) {
  return useQuery(orpc.todo.tasks.today.queryOptions({ input: { date: day } }));
}

/** Mes entrées d'agenda du jour, toutes les pages. */
export function useTodaySlots(day: string) {
  const query = useInfiniteQuery(
    orpc.agenda.entries.list.infiniteOptions({
      input: (cursor: string | undefined) => ({ ...dayWindow(day), cursor }),
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    }),
  );
  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = query;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isError) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage]);
  return query;
}

/** Une écriture ici touche Todo (listes, tâches) et Agenda (créneau lié à une tâche) : tout est relu. */
function useInvalidateDay() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: orpc.todo.key() }),
      queryClient.invalidateQueries({ queryKey: orpc.agenda.key() }),
    ]);
  };
}

/**
 * Cocher une tâche de l'écran, au geste de l'utilisateur seulement. Tâche répétée : l'occurrence est faite et
 * l'échéance avance ; sinon la tâche est cochée. Le toast confirme et propose d'annuler (décocher).
 */
export function useCheckTask(day: string) {
  const onSettled = useInvalidateDay();
  const { notify } = useToast();
  const setDone = useMutation(orpc.todo.tasks.setDone.mutationOptions({ onSettled }));
  const completeOccurrence = useMutation(
    orpc.todo.tasks.completeOccurrence.mutationOptions({ onSettled }),
  );
  const undoCompletion = useMutation(orpc.todo.tasks.undoCompletion.mutationOptions({ onSettled }));

  function confirm(task: TodayTaskOutput, undo: () => void) {
    notify(TODAY_LABELS.checked(task.title), {
      action: { label: TODAY_LABELS.undo, onAction: undo },
    });
  }

  function check(task: TodayTaskOutput) {
    const { recurrence } = task;
    if (recurrence === null) {
      setDone.mutate(
        { taskId: task.id, done: true },
        {
          onSuccess: () => {
            confirm(task, () => {
              setDone.mutate({ taskId: task.id, done: false });
            });
          },
        },
      );
      return;
    }
    completeOccurrence.mutate(
      { taskId: task.id, version: task.version, today: day },
      {
        onSuccess: (next) => {
          confirm(task, () => {
            undoCompletion.mutate({
              taskId: task.id,
              version: next.version,
              dueDate: task.dueDate,
              recurrence,
            });
          });
        },
      },
    );
  }

  const failed = [setDone, completeOccurrence, undoCompletion].find((mutation) => mutation.isError);
  return {
    check,
    error: failed?.error ?? null,
  };
}

export interface PostponeInput {
  tasks: readonly TodayTaskOutput[];
  date: string;
  time: string | undefined;
}

/**
 * Reporter des tâches à un jour, au clic seulement. Le toast propose d'annuler : chaque tâche reprend son jour et son
 * heure d'avant (une écriture par tâche, sur la version rendue par le report). Celles modifiées entre-temps ne sont
 * pas écrasées : le toast le dit.
 */
export function usePostponeTasks() {
  const onSettled = useInvalidateDay();
  const { notify } = useToast();
  const postpone = useMutation(orpc.todo.tasks.postpone.mutationOptions({ onSettled }));

  async function undo(before: readonly TodayTaskOutput[], versions: ReadonlyMap<string, number>) {
    const results = await Promise.allSettled(
      before.map(({ id, dueDate, dueTime }) =>
        orpc.todo.tasks.update.call({
          taskId: id,
          version: versions.get(id) ?? 0,
          dueDate,
          dueTime,
        }),
      ),
    );
    const failed = results.filter(({ status }) => status === "rejected").length;
    notify(failed === 0 ? TODAY_LABELS.undone : TODAY_LABELS.undonePartial(failed));
    await onSettled();
  }

  function run({ tasks, date, time }: PostponeInput) {
    postpone.mutate(
      {
        date,
        ...(time === undefined ? {} : { time }),
        tasks: tasks.map(({ id, version }) => ({ taskId: id, version })),
      },
      {
        onSuccess: ({ items }) => {
          const versions = new Map(items.map(({ id, version }) => [id, version]));
          notify(TODAY_LABELS.postponed(items.length), {
            action: {
              label: TODAY_LABELS.undo,
              onAction: () => {
                void undo(tasks, versions);
              },
            },
          });
        },
      },
    );
  }

  return { run, pending: postpone.isPending, error: postpone.isError ? postpone.error : null };
}
