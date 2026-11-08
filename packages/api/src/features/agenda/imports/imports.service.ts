import { ORPCError } from "@orpc/server";
import type {
  CreateImportInput,
  ImportFailureReason,
  ImportSubscriptionOutput,
  ListImportsOutput,
} from "@planifier/api-contract";
import { IMPORT_FAILURE_REASONS, importSourceOf } from "@planifier/api-contract";
import {
  AGENDA_IMPORT_COOLDOWN_SECONDS,
  AGENDA_MAX_ENTRIES,
  AGENDA_MAX_IMPORTS,
} from "@planifier/constants/agenda";
import { utcDateToDay } from "@planifier/constants/days";
import type { Db, DbTransaction, Prisma } from "@planifier/db";
import { planUpsert } from "@planifier/domain-ical/plan";
import type { ImportedEntry } from "@planifier/domain-ical/types";

import { agendaConflict } from "../agenda-errors";
import { whenColumns } from "../entries/entries.service";
import { entriesOfFeed } from "./feed-import";
import type { ImportsDeps } from "./imports-deps";
import { failureReasonOf, importFailure } from "./imports.errors";

const subscriptionSelect = {
  id: true,
  label: true,
  urlHint: true,
  lastFetchedAt: true,
  lastError: true,
} as const satisfies Prisma.CalendarSubscriptionSelect;

type SubscriptionRow = Prisma.CalendarSubscriptionGetPayload<{ select: typeof subscriptionSelect }>;

/** Limite de la transaction d'écriture d'un agenda entier (la valeur par défaut, 5 s, est courte pour 5 000 entrées). */
const WRITE_TIMEOUT_MS = 30_000;
/** Taille de lot des insertions. */
const CREATE_BATCH = 500;

/** `lastError` est une chaîne libre en base : une valeur inconnue est une donnée corrompue. */
function toFailureReason(value: string | null, id: string): ImportFailureReason | null {
  if (value === null) return null;
  const reason = IMPORT_FAILURE_REASONS.find((known) => known === value);
  if (reason === undefined)
    throw new Error(`Raison d'échec inconnue en base (agenda importé ${id}).`);
  return reason;
}

function toOutput(row: SubscriptionRow): ImportSubscriptionOutput {
  return { ...row, lastError: toFailureReason(row.lastError, row.id) };
}

/** Fin du lien (`…/ab12.ics`) : de quoi le reconnaître, pas de quoi le reconstituer. */
function hintOf(link: string): string {
  const tail = new URL(link).pathname.split("/").filter(Boolean).at(-1) ?? "";
  return `…/${tail.slice(-8)}`;
}

export async function listImports(db: Db, userId: string): Promise<ListImportsOutput> {
  const rows = await db.calendarSubscription.findMany({
    where: { ownerId: userId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: subscriptionSelect,
  });
  return { items: rows.map(toOutput) };
}

/** Verrou du compte : sérialise les lectures et créations d'un même utilisateur (comptes d'entrées, plafonds). */
async function lockUser(tx: DbTransaction, userId: string): Promise<void> {
  await tx.$queryRaw`SELECT 1 FROM users WHERE id = ${userId} FOR UPDATE`;
}

function toImportedEntry(row: {
  sourceUid: string | null;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  startDay: Date | null;
  endDay: Date | null;
}): ImportedEntry {
  const time =
    row.startDay !== null && row.endDay !== null
      ? {
          allDay: true as const,
          startDay: utcDateToDay(row.startDay),
          endDay: utcDateToDay(row.endDay),
        }
      : {
          allDay: false as const,
          startsAt: row.startsAt ?? new Date(0),
          endsAt: row.endsAt ?? new Date(0),
        };
  return {
    uid: row.sourceUid ?? "",
    title: row.title,
    description: row.description,
    location: row.location,
    time,
  };
}

/**
 * Applique le flux relu aux entrées déjà importées de cet agenda (ADR 0011) : créées, mises à jour (même identifiant),
 * retirées si disparues de la source. Tout ou rien. Entrées importées : cachées de la vue fusionnée des Espaces
 * (`hidden`), un agenda externe peut contenir du privé que personne n'a choisi de montrer.
 */
async function applyEntries(
  tx: DbTransaction,
  userId: string,
  subscriptionId: string,
  received: ImportedEntry[],
): Promise<void> {
  const source = importSourceOf(subscriptionId);
  const existing = await tx.agendaEntry.findMany({
    where: { ownerId: userId, source },
    select: {
      sourceUid: true,
      title: true,
      description: true,
      location: true,
      startsAt: true,
      endsAt: true,
      startDay: true,
      endDay: true,
    },
  });
  const plan = planUpsert(existing.map(toImportedEntry), received);
  const total = await tx.agendaEntry.count({ where: { ownerId: userId } });
  if (total + plan.create.length - plan.removed.length > AGENDA_MAX_ENTRIES) {
    throw agendaConflict("TOO_MANY_ENTRIES");
  }
  if (plan.removed.length > 0) {
    await tx.agendaEntry.deleteMany({
      where: { ownerId: userId, source, sourceUid: { in: plan.removed } },
    });
  }
  for (const entry of plan.update) {
    await tx.agendaEntry.updateMany({
      where: { ownerId: userId, source, sourceUid: entry.uid },
      data: {
        title: entry.title,
        description: entry.description,
        location: entry.location,
        ...whenColumns(entry.time),
        version: { increment: 1 },
      },
    });
  }
  for (let start = 0; start < plan.create.length; start += CREATE_BATCH) {
    await tx.agendaEntry.createMany({
      data: plan.create.slice(start, start + CREATE_BATCH).map((entry) => ({
        ownerId: userId,
        source,
        sourceUid: entry.uid,
        title: entry.title,
        description: entry.description,
        location: entry.location,
        ...whenColumns(entry.time),
        tint: "general",
        hidden: true,
      })),
    });
  }
}

type ReadResult = { entries: ImportedEntry[] } | { reason: ImportFailureReason };

/** Lit le lien et rend les entrées à importer, ou la raison de l'échec (jamais le lien). */
async function readEntries(deps: ImportsDeps, link: string): Promise<ReadResult> {
  try {
    const entries = entriesOfFeed(await deps.fetchFeed(link), deps.now());
    return entries === null ? { reason: "FEED_UNREADABLE" } : { entries };
  } catch (error) {
    return { reason: failureReasonOf(error) };
  }
}

export async function createImport(
  db: Db,
  deps: ImportsDeps,
  userId: string,
  { label, url }: CreateImportInput,
): Promise<ImportSubscriptionOutput> {
  // Lecture avant toute écriture : un lien qui échoue ne laisse rien derrière lui.
  const read = await readEntries(deps, url);
  if ("reason" in read) throw importFailure(read.reason);
  const { entries } = read;
  const link = new URL(url.replace(/^webcals?:\/\//i, "https://")).toString();
  return db.$transaction(
    async (tx) => {
      await lockUser(tx, userId);
      const count = await tx.calendarSubscription.count({ where: { ownerId: userId } });
      if (count >= AGENDA_MAX_IMPORTS) throw agendaConflict("TOO_MANY_IMPORTS");
      const created = await tx.calendarSubscription.create({
        data: { label, urlEncrypted: "", urlHint: hintOf(link), ownerId: userId },
        select: { id: true },
      });
      await tx.calendarSubscription.update({
        where: { id: created.id },
        data: { urlEncrypted: deps.secretBox.seal(link, created.id) },
      });
      await applyEntries(tx, userId, created.id, entries);
      const row = await tx.calendarSubscription.update({
        where: { id: created.id },
        data: { lastFetchedAt: deps.now(), lastError: null },
        select: subscriptionSelect,
      });
      return toOutput(row);
    },
    { timeout: WRITE_TIMEOUT_MS },
  );
}

/** Réserve la lecture : un seul appel par agenda et par minute, même concurrents. */
async function claimRefresh(
  db: Db,
  userId: string,
  subscriptionId: string,
  now: Date,
): Promise<void> {
  const threshold = new Date(now.getTime() - AGENDA_IMPORT_COOLDOWN_SECONDS * 1000);
  const { count } = await db.calendarSubscription.updateMany({
    where: {
      id: subscriptionId,
      ownerId: userId,
      OR: [{ lastFetchedAt: null }, { lastFetchedAt: { lt: threshold } }],
    },
    data: { lastFetchedAt: now },
  });
  if (count > 0) return;
  const exists = await db.calendarSubscription.count({
    where: { id: subscriptionId, ownerId: userId },
  });
  throw exists > 0 ? agendaConflict("REFRESH_TOO_SOON") : new ORPCError("NOT_FOUND");
}

async function recordFailure(
  db: Db,
  subscriptionId: string,
  reason: ImportFailureReason,
): Promise<never> {
  await db.calendarSubscription.updateMany({
    where: { id: subscriptionId },
    data: { lastError: reason },
  });
  throw importFailure(reason);
}

export async function refreshImport(
  db: Db,
  deps: ImportsDeps,
  userId: string,
  subscriptionId: string,
): Promise<ImportSubscriptionOutput> {
  await claimRefresh(db, userId, subscriptionId, deps.now());
  const stored = await db.calendarSubscription.findUnique({
    where: { id: subscriptionId },
    select: { urlEncrypted: true },
  });
  const link = deps.secretBox.open(stored?.urlEncrypted ?? "", subscriptionId);
  if (link === null) return recordFailure(db, subscriptionId, "LINK_UNREADABLE");
  const read = await readEntries(deps, link);
  if ("reason" in read) return recordFailure(db, subscriptionId, read.reason);
  const { entries } = read;
  return db.$transaction(
    async (tx) => {
      await lockUser(tx, userId);
      await applyEntries(tx, userId, subscriptionId, entries);
      const row = await tx.calendarSubscription.update({
        where: { id: subscriptionId },
        data: { lastError: null },
        select: subscriptionSelect,
      });
      return toOutput(row);
    },
    { timeout: WRITE_TIMEOUT_MS },
  );
}

export async function deleteImport(db: Db, userId: string, subscriptionId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.agendaEntry.deleteMany({
      where: { ownerId: userId, source: importSourceOf(subscriptionId) },
    });
    await tx.calendarSubscription.deleteMany({ where: { id: subscriptionId, ownerId: userId } });
  });
}
