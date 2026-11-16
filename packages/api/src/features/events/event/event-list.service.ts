import type { ListEventsInput, ListEventsOutput } from "@planifier/api-contract";
import { dayToUtcDate } from "@planifier/constants/days";
import type { Db, Prisma } from "@planifier/db";
import { canAccessEvent } from "@planifier/domain-access/event";

import { toPerson } from "../../_shared/list-access";
import { type Caller, eventAccessSelect, goingCountSelect, toEventCaller } from "../event-access";
import { decodeCursor, type EventCursor, encodeCursor } from "../event-cursor";
import { toEventWhen, whenSelect } from "../event-when";
import { goingOf, tintOf } from "./event-detail";

/** Personnes montrées sur une carte : quelques-unes parmi celles qui y vont. */
const PREVIEW_SIZE = 3;

function listSelect({ userId, email }: Caller) {
  return {
    id: true,
    title: true,
    location: true,
    tint: true,
    startKey: true,
    owner: { select: { id: true, name: true } },
    ...whenSelect,
    ...eventAccessSelect(userId, email),
    // Sa propre participation se lit à part (voir `listEvents`) : cette relation montre ceux qui y vont.
    participants: {
      where: { status: "GOING" },
      orderBy: { joinedAt: "asc" },
      take: PREVIEW_SIZE,
      select: { user: { select: { id: true, name: true } } },
    },
    ...goingCountSelect,
  } as const satisfies Prisma.EventSelect;
}

/** Événements que l'appelant voit : il participe, il est invité (même adresse e-mail) ou son Espace les lui montre. */
function visibleTo({ userId, email }: Caller): Prisma.EventWhereInput {
  return {
    OR: [
      { participants: { some: { userId } } },
      { invites: { some: { email } } },
      {
        space: {
          modules: { has: "EVENTS" },
          restrictVisibility: false,
          members: { some: { userId } },
        },
      },
    ],
  };
}

/**
 * À venir : pas encore fini (un événement en cours en fait partie) ; passé : fini. Écrit sans `NOT` : une colonne de
 * l'autre forme est NULL, et `NOT NULL` ne garderait aucune ligne.
 */
function inPeriod({ period, now, today }: ListEventsInput): Prisma.EventWhereInput {
  const day = dayToUtcDate(today);
  return period === "upcoming"
    ? { OR: [{ endsAt: { gt: now } }, { endDay: { gte: day } }] }
    : { OR: [{ endsAt: { lte: now } }, { endDay: { lt: day } }] };
}

function afterCursor(
  period: ListEventsInput["period"],
  cursor: EventCursor | undefined,
): Prisma.EventWhereInput {
  if (cursor === undefined) return {};
  const { startKey, id } = cursor;
  return period === "upcoming"
    ? { OR: [{ startKey: { gt: startKey } }, { startKey, id: { gt: id } }] }
    : { OR: [{ startKey: { lt: startKey } }, { startKey, id: { lt: id } }] };
}

/** Participations de l'appelant aux événements de la page. */
async function participationsOf(db: Db, userId: string, eventIds: readonly string[]) {
  const rows = await db.eventParticipant.findMany({
    where: { userId, eventId: { in: [...eventIds] } },
    select: { eventId: true, role: true, status: true },
  });
  return new Map(rows.map(({ eventId, role, status }) => [eventId, { role, status }]));
}

/** À venir : le plus proche d'abord ; passés : le plus récent d'abord. Curseur sur (clé de début, identifiant). */
export async function listEvents(
  db: Db,
  caller: Caller,
  input: ListEventsInput,
): Promise<ListEventsOutput> {
  const { period, limit, cursor } = input;
  const direction = period === "upcoming" ? "asc" : "desc";
  const rows = await db.event.findMany({
    where: {
      AND: [
        visibleTo(caller),
        inPeriod(input),
        afterCursor(period, cursor === undefined ? undefined : decodeCursor(cursor)),
      ],
    },
    orderBy: [{ startKey: direction }, { id: direction }],
    take: limit + 1,
    select: listSelect(caller),
  });
  const page = rows.slice(0, limit);
  const mine = await participationsOf(
    db,
    caller.userId,
    page.map(({ id }) => id),
  );
  const items = page.map((row) => {
    const participation = mine.get(row.id);
    const { access, status } = toEventCaller({
      ...row,
      participants: participation === undefined ? [] : [participation],
    });
    const seesGuests = canAccessEvent(access, "see_guest_list");
    return {
      id: row.id,
      title: row.title,
      when: toEventWhen(row),
      location: row.location,
      tint: tintOf(row),
      space: row.space === null ? null : { id: row.space.id, name: row.space.name },
      owner: row.owner === null ? null : toPerson(row.owner),
      myRole: access.role,
      myStatus: status,
      goingCount: goingOf(row),
      goingPreview: seesGuests ? row.participants.map(({ user }) => toPerson(user)) : [],
    };
  });
  const last = page.at(-1);
  return {
    items,
    nextCursor:
      rows.length > limit && last !== undefined
        ? encodeCursor({ startKey: last.startKey, id: last.id })
        : null,
  };
}
