import type { TaskOutput } from "@planifier/api-contract";
import { useState } from "react";

import { useCompleteOccurrence, useSetTaskDone } from "../queries/todo.queries";
import { formatDueDate, today } from "./due-date";

/**
 * Coche d'une tâche de la liste `listId`, au geste de l'utilisateur seulement. Tâche répétée cochée : l'occurrence
 * est faite et l'échéance avance (ADR 0017) ; `notice` dit quand elle reviendra. Erreur et annonce vivent dans la
 * liste, pas dans la ligne, qui est recréée quand la tâche change de section.
 */
export function useToggleTask(listId: string) {
  const setDone = useSetTaskDone(listId);
  const completeOccurrence = useCompleteOccurrence();
  const [notice, setNotice] = useState<string | null>(null);

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
          setNotice(
            `« ${next.title} » : c'est fait. Prochaine fois le ${formatDueDate(next.dueDate, todayDay)}.`,
          );
        },
      },
    );
  }

  const failed = setDone.isError ? setDone : completeOccurrence.isError ? completeOccurrence : null;
  return { toggle, notice, error: failed?.error ?? null };
}
