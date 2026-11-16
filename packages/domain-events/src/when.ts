import { dayToUtcDate } from "@planifier/constants/days";

/**
 * Date d'un événement, comme `when` d'une entrée d'agenda : horaire (instants) ou à la journée (jours civils, sans
 * fuseau), jamais les deux. `openEnd` : l'hôte n'a pas choisi de fin, `endsAt` est la fin du jour de début (calculée
 * par l'appareil, qui connaît le fuseau).
 */
export type EventWhen =
  | { allDay: false; startsAt: Date; endsAt: Date; openEnd: boolean }
  | { allDay: true; startDay: string; endDay: string };

/** Clé de tri et de pagination (`Event.startKey`) : le début, ou minuit UTC du premier jour. */
export function startKeyOf(when: EventWhen): Date {
  return when.allDay ? dayToUtcDate(when.startDay) : when.startsAt;
}

/**
 * « À venir » : pas encore fini. Un événement en cours l'est encore ; un événement à la journée l'est jusqu'à la fin
 * de son dernier jour. `now` et `today` (jour civil de l'appareil) viennent de l'appelant.
 */
export function isUpcoming(when: EventWhen, { now, today }: { now: Date; today: string }): boolean {
  return when.allDay ? when.endDay >= today : when.endsAt.getTime() > now.getTime();
}
