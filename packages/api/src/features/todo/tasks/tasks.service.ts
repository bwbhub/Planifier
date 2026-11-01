import { ORPCError } from "@orpc/server";
import type {
  CompleteOccurrenceInput,
  CreateTaskInput,
  FinishTaskInput,
  ListTasksOutput,
  SetTaskDoneInput,
  TaskOutput,
  UndoCompletionInput,
  UpdateTaskInput,
} from "@planifier/api-contract";
import { dayToUtcDate, utcDateToDay } from "@planifier/constants/days";
import { TODO_LIST_MAX_TASKS } from "@planifier/constants/todo";
import { type Db, type DbTransaction, JSON_DB_NULL, type Prisma } from "@planifier/db";
import { nextDueDate, seriesAnchor } from "@planifier/domain-recurrence";
import { fromStoredRecurrence, toStoredRecurrence } from "@planifier/domain-recurrence/stored";

import { toPerson } from "../list-access";
import { todoConflict } from "../todo-errors";

const TASK_SELECT = {
  id: true,
  listId: true,
  parentId: true,
  title: true,
  description: true,
  dueDate: true,
  completedAt: true,
  completedBy: { select: { id: true, name: true } },
  recurrence: true,
  version: true,
} as const satisfies Prisma.TaskSelect;

type TaskRow = Prisma.TaskGetPayload<{ select: typeof TASK_SELECT }>;

/** Colonne `DATE` : Prisma la rend à minuit UTC ; le jour se relit en UTC, sans décalage de fuseau. */
function toTaskOutput({ dueDate, recurrence, completedBy, ...task }: TaskRow): TaskOutput {
  return {
    ...task,
    completedBy: completedBy === null ? null : toPerson(completedBy),
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

/** Écriture conditionnée par la version ; NOT_FOUND si supprimée entre-temps, avant de conclure à une version périmée. */
async function writeVersioned(
  db: Db,
  taskId: string,
  version: number,
  data: Prisma.TaskUpdateManyMutationInput,
): Promise<TaskOutput> {
  const { count } = await db.task.updateMany({
    where: { id: taskId, version },
    data: { ...data, version: { increment: 1 } },
  });
  const task = await readTask(db, taskId);
  if (count === 0) throw todoConflict("STALE_VERSION");
  return task;
}

export async function updateTask(
  db: Db,
  { taskId, version, title, description, dueDate, recurrence }: UpdateTaskInput,
): Promise<TaskOutput> {
  // Champ absent : inchangé ; `null` efface.
  return writeVersioned(db, taskId, version, {
    ...(title === undefined ? {} : { title }),
    ...(description === undefined ? {} : { description }),
    ...(dueDate === undefined ? {} : { dueDate: dueDate === null ? null : dayToUtcDate(dueDate) }),
    ...(recurrence === undefined
      ? {}
      : { recurrence: recurrence === null ? JSON_DB_NULL : toStoredRecurrence(recurrence) }),
    // Échéance ou règle redéfinies : la série repart de la nouvelle échéance (ADR 0017).
    ...(dueDate === undefined && recurrence === undefined ? {} : { recurrenceAnchor: null }),
  });
}

/** Une coche : qui (« Cochée par ») et quand. */
export interface Completion {
  userId: string;
  at: Date;
}

function done({ userId, at }: Completion) {
  return { completedAt: at, completedById: userId };
}

const NOT_DONE = { completedAt: null, completedById: null };

/**
 * État demandé, pas une bascule : rejouer « cocher » garde la première coche (date et personne). La version ne bouge
 * pas : cocher ne périme pas une modification du titre en cours ailleurs.
 */
export async function setTaskDone(
  db: Db,
  { taskId, done: isDone }: SetTaskDoneInput,
  completion: Completion,
): Promise<TaskOutput> {
  await db.task.updateMany({
    where: isDone ? { id: taskId, completedAt: null } : { id: taskId },
    data: isDone ? done(completion) : NOT_DONE,
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
  return writeVersioned(db, taskId, version, {
    dueDate: dayToUtcDate(next),
    // Ancre gardée : la série compte toujours depuis son premier jour (le 31 revient après un mois court).
    recurrenceAnchor: dayToUtcDate(seriesAnchor(series, today)),
    ...NOT_DONE,
  });
}

/**
 * Terminer pour de bon (ADR 0017) : la répétition s'arrête et la tâche est cochée, en une écriture. L'ancre reste :
 * « Annuler » rend la série telle qu'elle était.
 */
export function finishTask(
  db: Db,
  { taskId, version }: FinishTaskInput,
  completion: Completion,
): Promise<TaskOutput> {
  return writeVersioned(db, taskId, version, { recurrence: JSON_DB_NULL, ...done(completion) });
}

/**
 * Annuler une coche de tâche répétée : échéance et règle d'avant, tâche à faire. L'ancre n'est pas touchée : la série
 * reprend où elle en était (le 31 reste le 31).
 */
export function undoCompletion(
  db: Db,
  { taskId, version, dueDate, recurrence }: UndoCompletionInput,
): Promise<TaskOutput> {
  return writeVersioned(db, taskId, version, {
    dueDate: dueDate === null ? null : dayToUtcDate(dueDate),
    recurrence: toStoredRecurrence(recurrence),
    ...NOT_DONE,
  });
}

/** Ses sous-tâches partent avec elle (`onDelete: Cascade`). */
export async function deleteTask(db: Db, taskId: string): Promise<void> {
  await db.task.deleteMany({ where: { id: taskId } });
}
