import { ORPCError } from "@orpc/server";
import type {
  CreateTaskInput,
  ListTasksOutput,
  SetTaskDoneInput,
  TaskOutput,
  UpdateTaskInput,
} from "@planifier/api-contract";
import { dayToUtcDate, utcDateToDay } from "@planifier/constants/days";
import { TODO_LIST_MAX_TASKS } from "@planifier/constants/todo";
import type { Db, Prisma } from "@planifier/db";

import { todoConflict } from "../todo-errors";

const TASK_SELECT = {
  id: true,
  listId: true,
  title: true,
  description: true,
  dueDate: true,
  completedAt: true,
  version: true,
} as const satisfies Prisma.TaskSelect;

type TaskRow = Prisma.TaskGetPayload<{ select: typeof TASK_SELECT }>;

/** Colonne `DATE` : Prisma la rend à minuit UTC ; le jour se relit en UTC, sans décalage de fuseau. */
function toTaskOutput({ dueDate, ...task }: TaskRow): TaskOutput {
  return { ...task, dueDate: dueDate === null ? null : utcDateToDay(dueDate) };
}

/** Curseur inutile : les tâches d'une liste sont bornées (`TODO_LIST_MAX_TASKS`). */
export async function listTasks(db: Db, listId: string): Promise<ListTasksOutput> {
  const rows = await db.task.findMany({
    where: { listId },
    orderBy: { id: "asc" },
    take: TODO_LIST_MAX_TASKS,
    select: TASK_SELECT,
  });
  return { items: rows.map(toTaskOutput) };
}

/** Sous le verrou de la ligne de la liste : deux créations simultanées ne dépassent pas la borne. */
export async function createTask(
  db: Db,
  { listId, title, description, dueDate }: CreateTaskInput,
): Promise<TaskOutput> {
  return db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<
      unknown[]
    >`SELECT 1 FROM todo_lists WHERE id = ${listId} FOR UPDATE`;
    // Supprimée entre la garde et le verrou.
    if (locked.length === 0) throw new ORPCError("NOT_FOUND");
    const count = await tx.task.count({ where: { listId } });
    if (count >= TODO_LIST_MAX_TASKS) throw todoConflict("LIST_FULL");
    const task = await tx.task.create({
      data: {
        listId,
        title,
        description: description ?? null,
        dueDate: dueDate === undefined ? null : dayToUtcDate(dueDate),
      },
      select: TASK_SELECT,
    });
    return toTaskOutput(task);
  });
}

async function readTask(db: Db, taskId: string): Promise<TaskOutput> {
  const task = await db.task.findUnique({ where: { id: taskId }, select: TASK_SELECT });
  // Supprimée entre-temps.
  if (task === null) throw new ORPCError("NOT_FOUND");
  return toTaskOutput(task);
}

export async function updateTask(
  db: Db,
  { taskId, version, title, description, dueDate }: UpdateTaskInput,
): Promise<TaskOutput> {
  const { count } = await db.task.updateMany({
    where: { id: taskId, version },
    // Champ absent : inchangé ; `null` efface.
    data: {
      ...(title === undefined ? {} : { title }),
      ...(description === undefined ? {} : { description }),
      ...(dueDate === undefined
        ? {}
        : { dueDate: dueDate === null ? null : dayToUtcDate(dueDate) }),
      version: { increment: 1 },
    },
  });
  // `readTask` : NOT_FOUND si supprimée entre la garde et l'écriture, avant de conclure à une version périmée.
  const task = await readTask(db, taskId);
  if (count === 0) throw todoConflict("STALE_VERSION");
  return task;
}

/**
 * État demandé, pas une bascule : rejouer « cocher » garde la date de la première coche. La version ne bouge pas :
 * cocher ne périme pas une modification du titre en cours ailleurs.
 */
export async function setTaskDone(
  db: Db,
  { taskId, done }: SetTaskDoneInput,
  now: Date,
): Promise<TaskOutput> {
  await db.task.updateMany({
    where: done ? { id: taskId, completedAt: null } : { id: taskId },
    data: { completedAt: done ? now : null },
  });
  return readTask(db, taskId);
}

export async function deleteTask(db: Db, taskId: string): Promise<void> {
  await db.task.deleteMany({ where: { id: taskId } });
}
