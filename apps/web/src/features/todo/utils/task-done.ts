import type { ListTasksOutput } from "@planifier/api-contract";

import { isSubtask } from "./subtasks";

/**
 * Tâches avec `taskId` cochée ou décochée (rendu optimiste) ; `delta` : variation du nombre de tâches à faire de la
 * liste (0 si déjà dans l'état, ou pour une sous-tâche, qui n'y compte pas). Seule la tâche visée change.
 */
export function withTaskDone(
  tasks: ListTasksOutput,
  taskId: string,
  done: boolean,
  now: Date = new Date(),
) {
  let delta = 0;
  const items = tasks.items.map((task) => {
    if (task.id !== taskId || (task.completedAt !== null) === done) return task;
    if (!isSubtask(task)) delta = done ? -1 : 1;
    return { ...task, completedAt: done ? now : null };
  });
  return { tasks: { items }, delta };
}
