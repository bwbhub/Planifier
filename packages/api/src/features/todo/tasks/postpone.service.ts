import type { PostponeTasksInput, TaskOutput } from "@planifier/api-contract";
import { dayToUtcDate } from "@planifier/constants/days";
import { type Db, JSON_DB_NULL } from "@planifier/db";

import { spaceMemberIds } from "../../_shared/list-access";
import { todoConflict } from "../todo-errors";
import { TASK_SELECT, toTaskOutput } from "./tasks.service";

/**
 * Reporte les tâches au jour `date` : échéance posée, heure retirée (une tâche reportée à aujourd'hui n'a plus d'horaire).
 * Tout ou rien : une version périmée ou une tâche répétée et rien n'est écrit. Droits : `tasksGuard`, avant ce service.
 */
export async function postponeTasks(
  db: Db,
  { date, tasks }: PostponeTasksInput,
): Promise<{ items: TaskOutput[] }> {
  const day = dayToUtcDate(date);
  return db.$transaction(async (tx) => {
    const recurring = await tx.task.count({
      where: { id: { in: tasks.map(({ taskId }) => taskId) }, recurrence: { not: JSON_DB_NULL } },
    });
    if (recurring > 0) throw todoConflict("RECURRING_TASK");
    for (const { taskId, version } of tasks) {
      const { count } = await tx.task.updateMany({
        where: { id: taskId, version },
        data: { dueDate: day, dueTime: null, version: { increment: 1 } },
      });
      if (count === 0) throw todoConflict("STALE_VERSION");
    }
    const rows = await tx.task.findMany({
      where: { id: { in: tasks.map(({ taskId }) => taskId) } },
      orderBy: { id: "asc" },
      select: TASK_SELECT,
    });
    const members = new Map<string, ReadonlySet<string>>();
    for (const { listId } of rows) {
      if (!members.has(listId)) members.set(listId, await spaceMemberIds(tx, listId));
    }
    return { items: rows.map((row) => toTaskOutput(row, members.get(row.listId) ?? new Set())) };
  });
}
