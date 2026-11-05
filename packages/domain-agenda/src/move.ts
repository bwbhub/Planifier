import { addDays, daysBetween } from "@planifier/constants/days";

/** Horaire d'une entrée : deux instants, ou des jours `AAAA-MM-JJ` inclus. */
export type EntryWhen =
  | { allDay: false; startsAt: Date; endsAt: Date }
  | { allDay: true; startDay: string; endDay: string };

/** Point d'une grille : un jour et, dans les heures, une minute à l'horloge ; `null` : la ligne des journées. */
export interface GridPoint {
  day: string;
  minute: number | null;
}

/**
 * Horaire d'une entrée prise en `from` et posée en `to` : elle se décale d'autant, durée gardée. Prise par son milieu
 * ou par le deuxième jour d'une entrée sur plusieurs jours, elle ne saute donc pas. Le décalage se fait à l'horloge
 * de l'appareil : un changement d'heure ne la décale pas d'une heure ; une heure qui n'existe pas (02:30 au passage à
 * l'heure d'été) devient l'heure suivante. `null` : la cible n'est pas de sa forme (créneau horaire hors des heures,
 * entrée à la journée dans les heures), ou rien ne change.
 */
export function shiftedWhen(when: EntryWhen, from: GridPoint, to: GridPoint): EntryWhen | null {
  const days = daysBetween(from.day, to.day);
  if (when.allDay) {
    if (from.minute !== null || to.minute !== null || days === 0) return null;
    return {
      allDay: true,
      startDay: addDays(when.startDay, days),
      endDay: addDays(when.endDay, days),
    };
  }
  if (from.minute === null || to.minute === null) return null;
  const minutes = to.minute - from.minute;
  if (days === 0 && minutes === 0) return null;
  const { startsAt, endsAt } = when;
  const moved = new Date(
    startsAt.getFullYear(),
    startsAt.getMonth(),
    startsAt.getDate() + days,
    startsAt.getHours(),
    startsAt.getMinutes() + minutes,
    startsAt.getSeconds(),
    startsAt.getMilliseconds(),
  );
  return {
    allDay: false,
    startsAt: moved,
    endsAt: new Date(moved.getTime() + endsAt.getTime() - startsAt.getTime()),
  };
}
