import { ORPCError } from "@orpc/server";
import type {
  AgendaEntryOutput,
  AgendaWhen,
  CreateEntryInput,
  EntriesWindow,
  ListEntriesInput,
  ListEntriesOutput,
  ListSpaceEntriesInput,
  ListSpaceEntriesOutput,
  SpaceEntryOutput,
  UpdateEntryInput,
} from "@planifier/api-contract";
import { AGENDA_MAX_ENTRIES } from "@planifier/constants/agenda";
import { dayToUtcDate, utcDateToDay } from "@planifier/constants/days";
import { isListTint } from "@planifier/constants/todo";
import type { Db, DbTransaction, Prisma } from "@planifier/db";
import { spaceAgendaScope } from "@planifier/domain-access/agenda";
import { canAccessTodoList } from "@planifier/domain-access/todo-list";

import { listAccessSelect, toListAccess, toPerson } from "../../_shared/list-access";
import { toPage } from "../../_shared/page";
import { agendaConflict } from "../agenda-errors";

const sharedSelect = {
  id: true,
  title: true,
  location: true,
  startsAt: true,
  endsAt: true,
  startDay: true,
  endDay: true,
} as const satisfies Prisma.AgendaEntrySelect;

const entrySelect = {
  ...sharedSelect,
  description: true,
  tint: true,
  hidden: true,
  taskId: true,
  version: true,
} as const satisfies Prisma.AgendaEntrySelect;

const spaceEntrySelect = {
  ...sharedSelect,
  owner: { select: { id: true, name: true } },
} as const satisfies Prisma.AgendaEntrySelect;

type SharedRow = Prisma.AgendaEntryGetPayload<{ select: typeof sharedSelect }>;
type EntryRow = Prisma.AgendaEntryGetPayload<{ select: typeof entrySelect }>;
type SpaceEntryRow = Prisma.AgendaEntryGetPayload<{ select: typeof spaceEntrySelect }>;

/** La contrainte `agenda_entries_when_check` garantit l'une des deux formes : autre chose est une donnée corrompue. */
function toWhen({ id, startsAt, endsAt, startDay, endDay }: SharedRow): AgendaWhen {
  if (startsAt !== null && endsAt !== null) return { allDay: false, startsAt, endsAt };
  if (startDay !== null && endDay !== null) {
    return { allDay: true, startDay: utcDateToDay(startDay), endDay: utcDateToDay(endDay) };
  }
  throw new Error(`Entrée sans horaire en base (entrée ${id}).`);
}

function toSharedOutput(row: SharedRow) {
  const { id, title, location } = row;
  return { id, title, location, when: toWhen(row) };
}

function toEntryOutput(row: EntryRow): AgendaEntryOutput {
  const { id, description, tint, hidden, taskId, version } = row;
  // Chaîne libre en base : une valeur inconnue est une donnée corrompue, pas une entrée à deviner.
  if (!isListTint(tint)) throw new Error(`Teinte d'entrée inconnue en base (entrée ${id}).`);
  return { ...toSharedOutput(row), description, tint, hidden, taskId, version };
}

function toSpaceEntryOutput(row: SpaceEntryRow): SpaceEntryOutput {
  return { ...toSharedOutput(row), owner: toPerson(row.owner) };
}

/** Colonnes d'une forme, celles de l'autre à null : changer de forme ne laisse rien derrière. */
function whenColumns(when: AgendaWhen) {
  return when.allDay
    ? {
        startsAt: null,
        endsAt: null,
        startDay: dayToUtcDate(when.startDay),
        endDay: dayToUtcDate(when.endDay),
      }
    : { startsAt: when.startsAt, endsAt: when.endsAt, startDay: null, endDay: null };
}

/** Entrées qui touchent la période : horaires par instants, à la journée par jours (voir le contrat). */
function touchesWindow({ from, to, fromDay, toDay }: EntriesWindow): Prisma.AgendaEntryWhereInput {
  return {
    OR: [
      { startsAt: { lt: to }, endsAt: { gt: from } },
      { startDay: { lte: dayToUtcDate(toDay) }, endDay: { gte: dayToUtcDate(fromDay) } },
    ],
  };
}

/** Curseur : identifiant d'entrée (`uuid(7)`, croissant), donc ordre de création. */
function afterCursor(cursor: string | undefined): Prisma.AgendaEntryWhereInput {
  return cursor === undefined ? {} : { id: { gt: cursor } };
}

export async function listEntries(
  db: Db,
  userId: string,
  { limit, cursor, ...window }: ListEntriesInput,
): Promise<ListEntriesOutput> {
  const rows = await db.agendaEntry.findMany({
    where: { ownerId: userId, ...touchesWindow(window), ...afterCursor(cursor) },
    orderBy: { id: "asc" },
    take: limit + 1,
    select: entrySelect,
  });
  return toPage(rows, limit, toEntryOutput);
}

/** Membre de l'Espace vérifié par la garde. Un membre parti n'y paraît plus : son agenda n'est jamais rattaché. */
export async function listSpaceEntries(
  db: Db,
  userId: string,
  { spaceId, limit, cursor, ...window }: ListSpaceEntriesInput,
): Promise<ListSpaceEntriesOutput> {
  const space = await db.space.findUnique({
    where: { id: spaceId },
    select: { modules: true, restrictVisibility: true },
  });
  // Supprimé entre la garde et la lecture.
  if (space === null) throw new ORPCError("NOT_FOUND");
  const scope = spaceAgendaScope(space);
  if (scope === "DISABLED") throw agendaConflict("AGENDA_DISABLED");
  const owners: Prisma.AgendaEntryWhereInput =
    scope === "OWN" ? { ownerId: userId } : { owner: { spaces: { some: { spaceId } } } };
  const rows = await db.agendaEntry.findMany({
    where: { hidden: false, ...owners, ...touchesWindow(window), ...afterCursor(cursor) },
    orderBy: { id: "asc" },
    take: limit + 1,
    select: spaceEntrySelect,
  });
  return toPage(rows, limit, toSpaceEntryOutput);
}

/** Tâche à lier : l'appelant la lit, sinon elle n'existe pas pour lui. */
async function assertReadableTask(tx: DbTransaction, userId: string, taskId: string) {
  const task = await tx.task.findUnique({
    where: { id: taskId },
    select: { list: { select: listAccessSelect(userId) } },
  });
  if (task === null || !canAccessTodoList(toListAccess(userId, task.list), "read")) {
    throw new ORPCError("NOT_FOUND");
  }
}

/** Sous le verrou de la ligne de l'utilisateur : deux créations simultanées ne dépassent pas la borne. */
export async function createEntry(
  db: Db,
  userId: string,
  { title, description, location, when, tint, hidden, taskId }: CreateEntryInput,
): Promise<AgendaEntryOutput> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM users WHERE id = ${userId} FOR UPDATE`;
    const count = await tx.agendaEntry.count({ where: { ownerId: userId } });
    if (count >= AGENDA_MAX_ENTRIES) throw agendaConflict("TOO_MANY_ENTRIES");
    if (taskId !== undefined) await assertReadableTask(tx, userId, taskId);
    const entry = await tx.agendaEntry.create({
      data: {
        title,
        tint,
        description: description ?? null,
        location: location ?? null,
        hidden: hidden ?? false,
        ...whenColumns(when),
        ownerId: userId,
        taskId: taskId ?? null,
      },
      select: entrySelect,
    });
    return toEntryOutput(entry);
  });
}

/** Colonnes modifiées. Champ absent : inchangé (Prisma refuse `undefined` explicite avec `exactOptionalPropertyTypes`). */
function entryChanges({
  title,
  description,
  location,
  when,
  tint,
  hidden,
  taskId,
}: UpdateEntryInput): Prisma.AgendaEntryUncheckedUpdateManyInput {
  return {
    ...(title === undefined ? {} : { title }),
    ...(description === undefined ? {} : { description }),
    ...(location === undefined ? {} : { location }),
    ...(tint === undefined ? {} : { tint }),
    ...(hidden === undefined ? {} : { hidden }),
    ...(when === undefined ? {} : whenColumns(when)),
    ...(taskId === undefined ? {} : { taskId }),
  };
}

export async function updateEntry(
  db: Db,
  userId: string,
  input: UpdateEntryInput,
): Promise<AgendaEntryOutput> {
  const { entryId, version, taskId } = input;
  return db.$transaction(async (tx) => {
    if (typeof taskId === "string") await assertReadableTask(tx, userId, taskId);
    const { count } = await tx.agendaEntry.updateMany({
      where: { id: entryId, version },
      data: { ...entryChanges(input), version: { increment: 1 } },
    });
    const entry = await tx.agendaEntry.findUnique({
      where: { id: entryId },
      select: entrySelect,
    });
    // Supprimée entre la garde et l'écriture : elle n'existe plus, ce n'est pas une version périmée.
    if (entry === null) throw new ORPCError("NOT_FOUND");
    if (count === 0) throw agendaConflict("STALE_VERSION");
    return toEntryOutput(entry);
  });
}

export async function deleteEntry(db: Db, entryId: string): Promise<void> {
  await db.agendaEntry.deleteMany({ where: { id: entryId } });
}
