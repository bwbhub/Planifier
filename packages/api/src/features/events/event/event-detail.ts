import { ORPCError } from "@orpc/server";
import type { EventDetailOutput } from "@planifier/api-contract";
import { isListTint } from "@planifier/constants/todo";
import type { Db, DbTransaction, Prisma } from "@planifier/db";
import { hasRoomFor } from "@planifier/domain-events/capacity";

import { toPerson } from "../../_shared/list-access";
import { abilitiesOf, eventAccessSelect, toEventCaller } from "../event-access";
import { toEventWhen, whenSelect } from "../event-when";

/** Tout ce que lit le détail d'un événement et les droits de `userId` (e-mail de sa session : `email`). */
export function detailSelect(userId: string, email: string) {
  return {
    id: true,
    title: true,
    description: true,
    location: true,
    tint: true,
    version: true,
    maxParticipants: true,
    owner: { select: { id: true, name: true } },
    ...whenSelect,
    ...eventAccessSelect(userId, email),
    _count: {
      select: {
        participants: { where: { status: "GOING" } },
        invites: { where: { response: "GOING" } },
      },
    },
  } as const satisfies Prisma.EventSelect;
}

type DetailRow = Prisma.EventGetPayload<{ select: ReturnType<typeof detailSelect> }>;

/** Chaîne libre en base : une valeur inconnue est une donnée corrompue, pas un événement à deviner. */
export function tintOf({ id, tint }: { id: string; tint: string }) {
  if (!isListTint(tint)) throw new Error(`Teinte d'événement inconnue en base (${id}).`);
  return tint;
}

/** Participants et invités sans compte qui ont répondu « J'y vais » par leur lien. */
export function goingOf({ _count }: { _count: { participants: number; invites: number } }): number {
  return _count.participants + _count.invites;
}

export function toDetail(row: DetailRow): EventDetailOutput {
  const caller = toEventCaller(row);
  const going = goingOf(row);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    when: toEventWhen(row),
    tint: tintOf(row),
    space: row.space === null ? null : { id: row.space.id, name: row.space.name },
    myRole: caller.access.role,
    myStatus: caller.status,
    goingCount: going,
    version: row.version,
    isGuestListVisible: row.isGuestListVisible,
    allowGuestInvite: row.allowGuestInvite,
    maxParticipants: row.maxParticipants,
    owner: row.owner === null ? null : toPerson(row.owner),
    isFull: !hasRoomFor({ max: row.maxParticipants, going, wasGoing: false }),
    can: abilitiesOf(caller.access),
  };
}

/** Détail lu pour l'appelant ; événement disparu entre-temps ⇒ NOT_FOUND. */
export async function readDetail(
  db: Db | DbTransaction,
  { userId, email }: { userId: string; email: string },
  eventId: string,
): Promise<EventDetailOutput> {
  const row = await db.event.findUnique({
    where: { id: eventId },
    select: detailSelect(userId, email),
  });
  if (row === null) throw new ORPCError("NOT_FOUND");
  return toDetail(row);
}
