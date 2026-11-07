import type { PostponeTasksInput, TaskOutput } from "@planifier/api-contract";
import { dayToUtcDate } from "@planifier/constants/days";
import type { Db } from "@planifier/db";

import { spaceMemberIds } from "../../_shared/list-access";
import { todoConflict } from "../todo-errors";
import { TASK_SELECT, toTaskOutput } from "./tasks.service";

/**
 * Reporte les tâches au jour `date` : échéance posée, à l'heure `time` si elle est donnée, sinon sans horaire. Tout ou
 * rien : une version périmée et rien n'est écrit. Une tâche répétée se reporte aussi : sa série repart de ce jour. Droits : `tasksGuard`, avant ce service.
 */
export async function postponeTasks(
  db: Db,
  { date, time, tasks }: PostponeTasksInput,
): Promise<{ items: TaskOutput[] }> {
  const day = dayToUtcDate(date);
  return db.$transaction(async (tx) => {
    for (const { taskId, version } of tasks) {
      const { count } = await tx.task.updateMany({
        where: { id: taskId, version },
        // Échéance changée : la série d'une tâche répétée repart d'ici (ADR 0017), comme à une modification.
        data: {
          dueDate: day,
          dueTime: time ?? null,
          recurrenceAnchor: null,
          version: { increment: 1 },
        },
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
