import type { TaskOutput } from "@planifier/api-contract";

/** Sous-tâche : rattachée à une tâche de la même liste, un seul niveau (CONTEXT.md). */
export function isSubtask(task: Pick<TaskOutput, "parentId">): boolean {
  return task.parentId !== null;
}

/** Sous-tâches regroupées par parent, dans l'ordre reçu (création). */
export function subtasksByParent(tasks: readonly TaskOutput[]): Map<string, TaskOutput[]> {
  const byParent = new Map<string, TaskOutput[]>();
  for (const task of tasks) {
    if (task.parentId === null) continue;
    const siblings = byParent.get(task.parentId);
    if (siblings === undefined) byParent.set(task.parentId, [task]);
    else siblings.push(task);
  }
  return byParent;
}

/** « 1 sur 2 sous-tâches cochées » : compteur sous la tâche. */
export function subtaskCountLabel(subtasks: readonly Pick<TaskOutput, "completedAt">[]): string {
  const done = subtasks.filter(({ completedAt }) => completedAt !== null).length;
  const total = subtasks.length;
  return `${String(done)} sur ${String(total)} sous-tâche${total > 1 ? "s" : ""} cochée${done > 1 ? "s" : ""}`;
}

/** Question de suppression : elle nomme les sous-tâches qui partent avec la tâche. */
export function deleteQuestion(title: string, subtaskCount: number): string {
  if (subtaskCount === 0) return `Supprimer « ${title} » ?`;
  if (subtaskCount === 1) return `Supprimer « ${title} » et sa sous-tâche ?`;
  return `Supprimer « ${title} » et ses ${String(subtaskCount)} sous-tâches ?`;
}
