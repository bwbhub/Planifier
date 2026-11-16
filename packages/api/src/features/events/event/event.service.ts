import { ORPCError } from "@orpc/server";
import type {
  CreateEventInput,
  EventDetailOutput,
  SetEventSpaceInput,
  UpdateEventInput,
} from "@planifier/api-contract";
import type { Db, DbTransaction, Prisma } from "@planifier/db";
import { importantChanges } from "@planifier/domain-events/changes";

import { toChangeJson } from "../event-change";
import { eventConflict } from "../event-errors";
import { lockEvent } from "../event-lock";
import { normalizeWhen, toEventWhen, whenColumns, whenSelect } from "../event-when";
import { readDetail } from "./event-detail";

/** Personne qui lit : son identifiant et l'adresse e-mail de sa session (pour retrouver ses invitations). */
export interface Caller {
  userId: string;
  email: string;
}

/** Espace où rattacher un événement : l'appelant en est membre (sinon il n'existe pas pour lui), Événements y est activé. */
async function assertEventsSpace(tx: DbTransaction, userId: string, spaceId: string) {
  const membership = await tx.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId } },
    select: { space: { select: { modules: true } } },
  });
  if (membership === null) throw new ORPCError("NOT_FOUND");
  if (!membership.space.modules.includes("EVENTS")) throw eventConflict("EVENTS_DISABLED");
}

export async function getEvent(
  db: Db,
  caller: Caller,
  eventId: string,
): Promise<EventDetailOutput> {
  return readDetail(db, caller, eventId);
}

export async function createEvent(
  db: Db,
  caller: Caller,
  input: CreateEventInput,
): Promise<EventDetailOutput> {
  const { userId } = caller;
  return db.$transaction(async (tx) => {
    if (input.spaceId !== undefined) await assertEventsSpace(tx, userId, input.spaceId);
    const event = await tx.event.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        location: input.location ?? null,
        tint: input.tint,
        maxParticipants: input.maxParticipants ?? null,
        ...(input.isGuestListVisible === undefined
          ? {}
          : { isGuestListVisible: input.isGuestListVisible }),
        ...(input.allowGuestInvite === undefined
          ? {}
          : { allowGuestInvite: input.allowGuestInvite }),
        ...whenColumns(normalizeWhen(input.when)),
        ownerId: userId,
        spaceId: input.spaceId ?? null,
        participants: { create: { userId, role: "OWNER", status: "GOING" } },
      },
      select: { id: true },
    });
    return readDetail(tx, caller, event.id);
  });
}

/** Colonnes modifiées. Champ absent : inchangé (Prisma refuse `undefined` explicite avec `exactOptionalPropertyTypes`). */
function eventChanges(input: UpdateEventInput): Prisma.EventUncheckedUpdateManyInput {
  const { title, description, location, tint, maxParticipants, when } = input;
  const { isGuestListVisible, allowGuestInvite } = input;
  return {
    ...(title === undefined ? {} : { title }),
    ...(description === undefined ? {} : { description }),
    ...(location === undefined ? {} : { location }),
    ...(tint === undefined ? {} : { tint }),
    ...(maxParticipants === undefined ? {} : { maxParticipants }),
    ...(isGuestListVisible === undefined ? {} : { isGuestListVisible }),
    ...(allowGuestInvite === undefined ? {} : { allowGuestInvite }),
    ...(when === undefined ? {} : whenColumns(normalizeWhen(when))),
  };
}

/** Écrit si `version` est la bonne ; 0 ligne : disparu (NOT_FOUND) ou modifié entre-temps (STALE_VERSION). */
async function writeVersioned(
  tx: DbTransaction,
  { eventId, version }: { eventId: string; version: number },
  data: Prisma.EventUncheckedUpdateManyInput,
): Promise<void> {
  const { count } = await tx.event.updateMany({
    where: { id: eventId, version },
    data: { ...data, version: { increment: 1 } },
  });
  if (count > 0) return;
  const exists = (await tx.event.count({ where: { id: eventId } })) > 0;
  throw exists ? eventConflict("STALE_VERSION") : new ORPCError("NOT_FOUND");
}

/**
 * Sous le verrou de l'événement : changer la date ou le lieu écrit, dans la même transaction, un message « Changement »
 * par champ important modifié (sans notification : le modèle de notifications n'existe pas encore).
 */
export async function updateEvent(
  db: Db,
  caller: Caller,
  input: UpdateEventInput,
): Promise<EventDetailOutput> {
  const { eventId } = input;
  const { userId } = caller;
  return db.$transaction(async (tx) => {
    await lockEvent(tx, eventId);
    const before = await tx.event.findUniqueOrThrow({
      where: { id: eventId },
      select: { ...whenSelect, location: true },
    });
    await writeVersioned(tx, input, eventChanges(input));
    const changes = importantChanges(
      { when: toEventWhen(before), location: before.location },
      {
        when: input.when === undefined ? toEventWhen(before) : normalizeWhen(input.when),
        location: input.location === undefined ? before.location : input.location,
      },
    );
    if (changes.length > 0) {
      await tx.comment.createMany({
        data: changes.map((change) => ({
          eventId,
          userId,
          kind: "CHANGE" as const,
          change: toChangeJson(change),
        })),
      });
    }
    return readDetail(tx, caller, eventId);
  });
}

/** Rattacher à un Espace (membre, Événements activé) ou, avec `null`, détacher. Propriétaire seulement (garde). */
export async function setEventSpace(
  db: Db,
  caller: Caller,
  input: SetEventSpaceInput,
): Promise<EventDetailOutput> {
  return db.$transaction(async (tx) => {
    await lockEvent(tx, input.eventId);
    if (input.spaceId !== null) await assertEventsSpace(tx, caller.userId, input.spaceId);
    await writeVersioned(tx, input, { spaceId: input.spaceId });
    return readDetail(tx, caller, input.eventId);
  });
}

/** Cascade : participants, invitations, propositions et commentaires partent avec l'événement. */
export async function deleteEvent(db: Db, eventId: string): Promise<void> {
  await db.event.deleteMany({ where: { id: eventId } });
}
