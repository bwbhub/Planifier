import type { TaskOutput } from "@planifier/api-contract";
import { useState } from "react";

import type { TaskCompletion } from "../atoms/task-row";
import {
  useCompleteOccurrence,
  useFinishTask,
  useSetTaskDone,
  useUndoCompletion,
} from "../queries/todo.queries";
import { formatDueDate, today } from "./due-date";

/** Ce qui vient d'être fait, annoncé dans la liste ; `undo` : le défaire (tâche répétée seulement). */
export interface CompletionNotice {
  message: string;
  undo: (() => void) | null;
}

/**
 * Coche d'une tâche de la liste `listId`, au geste de l'utilisateur seulement (ADR 0017). Tâche répétée cochée :
 * l'occurrence est faite et l'échéance avance ; « Terminer » arrête la répétition et coche. Les deux s'annoncent et
 * s'annulent (garde-fou : l'échéance a bougé, la décocher ne la rendrait pas). Erreur et annonce vivent dans la
 * liste, pas dans la ligne, qui est recréée quand la tâche change de section.
 */
export function useTaskCompletion(listId: string) {
  const setDone = useSetTaskDone(listId);
  const completeOccurrence = useCompleteOccurrence(listId);
  const finishTask = useFinishTask();
  const undoCompletion = useUndoCompletion();
  const [notice, setNotice] = useState<CompletionNotice | null>(null);

  /** Annulation de la coche de `before` (état d'avant), sur la version rendue par la coche. */
  function undoOf(before: TaskOutput, version: number) {
    const { recurrence } = before;
    if (recurrence === null) return null;
    return () => {
      setNotice(null);
      undoCompletion.mutate(
        { taskId: before.id, version, dueDate: before.dueDate, recurrence },
        {
          onSuccess: () => {
            setNotice({ message: `« ${before.title} » : coche annulée.`, undo: null });
          },
        },
      );
    };
  }

  function toggle(task: TaskOutput, done: boolean) {
    setNotice(null);
    if (task.recurrence === null || !done) {
      setDone.mutate({ taskId: task.id, done });
      return;
    }
    const todayDay = today();
    completeOccurrence.mutate(
      { taskId: task.id, version: task.version, today: todayDay },
      {
        onSuccess: (next) => {
          if (next.dueDate === null) return;
          setNotice({
            message: `« ${next.title} » : c'est fait. Prochaine fois le ${formatDueDate(next.dueDate, todayDay)}.`,
            undo: undoOf(task, next.version),
          });
        },
      },
    );
  }

  function finish(task: TaskOutput) {
    setNotice(null);
    finishTask.mutate(
      { taskId: task.id, version: task.version },
      {
        onSuccess: (finished) => {
          setNotice({
            message: `« ${finished.title} » est terminée : elle ne se répète plus.`,
            undo: undoOf(task, finished.version),
          });
        },
      },
    );
  }

  const completion: TaskCompletion = { toggle, finish };
  const failed = [setDone, completeOccurrence, finishTask, undoCompletion].find(
    (mutation) => mutation.isError,
  );
  return { completion, notice, error: failed?.error ?? null };
}
