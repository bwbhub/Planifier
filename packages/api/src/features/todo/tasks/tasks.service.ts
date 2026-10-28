import { ORPCError } from "@orpc/server";
import type {
  CompleteOccurrenceInput,
  CreateTaskInput,
  ListTasksOutput,
  SetTaskDoneInput,
  TaskOutput,
  UpdateTaskInput,
} from "@planifier/api-contract";
import { dayToUtcDate, utcDateToDay } from "@planifier/constants/days";
import { TODO_LIST_MAX_TASKS } from "@planifier/constants/todo";
import { type Db, type DbTransaction, JSON_DB_NULL, type Prisma } from "@planifier/db";
import { nextDueDate, seriesAnchor } from "@planifier/domain-recurrence";
import { fromStoredRecurrence, toStoredRecurrence } from "@planifier/domain-recurrence/stored";

import { todoConflict } from "../todo-errors";

const TASK_SELECT = {
  id: true,
  listId: true,
  parentId: true,
  title: true,
  description: true,
  dueDate: true,
  completedAt: true,
  recurrence: true,
  version: true,
} as const satisfies Prisma.TaskSelect;

type TaskRow = Prisma.TaskGetPayload<{ select: typeof TASK_SELECT }>;

/** Colonne `DATE` : Prisma la rend à minuit UTC ; le jour se relit en UTC, sans décalage de fuseau. */
function toTaskOutput({ dueDate, recurrence, ...task }: TaskRow): TaskOutput {
  return {
    ...task,
    dueDate: dueDate === null ? null : utcDateToDay(dueDate),
    recurrence: fromStoredRecurrence(recurrence),
  };
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

/** Parent d'une sous-tâche : tâche de la même liste (sinon NOT_FOUND), elle-même pas une sous-tâche. */
async function assertParent(tx: DbTransaction, listId: string, parentId: string) {
  const parent = await tx.task.findFirst({
    where: { id: parentId, listId },
    select: { parentId: true },
  });
  if (parent === null) throw new ORPCError("NOT_FOUND");
  if (parent.parentId !== null) throw todoConflict("NESTED_SUBTASK");
}

/** Sous le verrou de la ligne de la liste : deux créations simultanées ne dépassent pas la borne. */
export async function createTask(
  db: Db,
  { listId, parentId, title, description, dueDate, recurrence }: CreateTaskInput,
): Promise<TaskOutput> {
  return db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<
      unknown[]
    >`SELECT 1 FROM todo_lists WHERE id = ${listId} FOR UPDATE`;
    // Supprimée entre la garde et le verrou.
    if (locked.length === 0) throw new ORPCError("NOT_FOUND");
    const count = await tx.task.count({ where: { listId } });
    if (count >= TODO_LIST_MAX_TASKS) throw todoConflict("LIST_FULL");
    if (parentId !== undefined) await assertParent(tx, listId, parentId);
    const task = await tx.task.create({
      data: {
        listId,
        parentId: parentId ?? null,
        title,
        description: description ?? null,
        dueDate: dueDate === undefined ? null : dayToUtcDate(dueDate),
        ...(recurrence === undefined ? {} : { recurrence: toStoredRecurrence(recurrence) }),
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
  { taskId, version, title, description, dueDate, recurrence }: UpdateTaskInput,
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
      ...(recurrence === undefined
        ? {}
        : { recurrence: recurrence === null ? JSON_DB_NULL : toStoredRecurrence(recurrence) }),
      // Échéance ou règle redéfinies : la série repart de la nouvelle échéance (ADR 0017).
      ...(dueDate === undefined && recurrence === undefined ? {} : { recurrenceAnchor: null }),
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

/**
 * Tâche répétée cochée (ADR 0017) : échéance avancée à la première occurrence après `today`, tâche toujours à faire.
 * Écriture conditionnée par la version : rejouer la même coche ne fait pas avancer deux fois.
 */
export async function completeOccurrence(
  db: Db,
  { taskId, version, today }: CompleteOccurrenceInput,
): Promise<TaskOutput> {
  const found = await db.task.findUnique({
    where: { id: taskId },
    select: { ...TASK_SELECT, recurrenceAnchor: true },
  });
  if (found === null) throw new ORPCError("NOT_FOUND");
  const { recurrenceAnchor, ...row } = found;
  const task = toTaskOutput(row);
  if (task.recurrence === null) throw todoConflict("NOT_RECURRING");
  if (task.version !== version) throw todoConflict("STALE_VERSION");
  const series = {
    anchor: recurrenceAnchor === null ? null : utcDateToDay(recurrenceAnchor),
    due: task.dueDate,
  };
  const next = nextDueDate(task.recurrence, series, today);
  const { count } = await db.task.updateMany({
    where: { id: taskId, version },
    data: {
      dueDate: dayToUtcDate(next),
      // Ancre gardée : la série compte toujours depuis son premier jour (le 31 revient après un mois court).
      recurrenceAnchor: dayToUtcDate(seriesAnchor(series, today)),
      completedAt: null,
      version: { increment: 1 },
    },
  });
  const updated = await readTask(db, taskId);
  if (count === 0) throw todoConflict("STALE_VERSION");
  return updated;
}

/** Ses sous-tâches partent avec elle (`onDelete: Cascade`). */
export async function deleteTask(db: Db, taskId: string): Promise<void> {
  await db.task.deleteMany({ where: { id: taskId } });
}
