import type { EventWhenInput, EventWhenOutput } from "@planifier/api-contract";
import { dayToUtcDate, utcDateToDay } from "@planifier/constants/days";
import type { Prisma } from "@planifier/db";
import { type EventWhen, startKeyOf } from "@planifier/domain-events/when";

export const whenSelect = {
  startsAt: true,
  endsAt: true,
  openEnd: true,
  startDay: true,
  endDay: true,
} as const satisfies Prisma.EventSelect;

type WhenRow = Prisma.EventGetPayload<{ select: typeof whenSelect }>;

/** Date lue en base. La contrainte `events_when_check` garantit l'une des deux formes : autre chose est une donnée corrompue. */
export function toEventWhen({ startsAt, endsAt, openEnd, startDay, endDay }: WhenRow): EventWhen {
  if (startsAt !== null && endsAt !== null) return { allDay: false, startsAt, endsAt, openEnd };
  if (startDay !== null && endDay !== null) {
    return { allDay: true, startDay: utcDateToDay(startDay), endDay: utcDateToDay(endDay) };
  }
  throw new Error("Événement sans date en base.");
}

/** Écriture ⇒ forme complète : à la journée sans dernier jour, l'événement dure un jour. */
export function normalizeWhen(when: EventWhenInput): EventWhen {
  if (when.allDay) {
    return { allDay: true, startDay: when.startDay, endDay: when.endDay ?? when.startDay };
  }
  return { allDay: false, startsAt: when.startsAt, endsAt: when.endsAt, openEnd: when.openEnd };
}

/** Colonnes d'une forme, celles de l'autre à null (changer de forme ne laisse rien derrière) ; `startKey` suit. */
export function whenColumns(when: EventWhen) {
  const shared = { startKey: startKeyOf(when) };
  return when.allDay
    ? {
        ...shared,
        startsAt: null,
        endsAt: null,
        openEnd: false,
        startDay: dayToUtcDate(when.startDay),
        endDay: dayToUtcDate(when.endDay),
      }
    : {
        ...shared,
        startsAt: when.startsAt,
        endsAt: when.endsAt,
        openEnd: when.openEnd,
        startDay: null,
        endDay: null,
      };
}

/** Sortie du contrat : même forme que le domaine. */
export function toWhenOutput(when: EventWhen): EventWhenOutput {
  return when;
}
