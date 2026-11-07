// Jour civil `AAAA-MM-JJ` (échéance) : sans heure ni fuseau. Lu et écrit en UTC pour ne jamais glisser d'un jour.

/** Jour `AAAA-MM-JJ` ⇒ `Date` à minuit UTC (forme d'une colonne `DATE` lue par Prisma). */
export function dayToUtcDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

/** `Date` à minuit UTC ⇒ jour `AAAA-MM-JJ`. */
export function utcDateToDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const MS_PER_DAY = 86_400_000;

/** `days` jours après `day` (négatif : avant). */
export function addDays(day: string, days: number): string {
  return utcDateToDay(new Date(dayToUtcDate(day).getTime() + days * MS_PER_DAY));
}

/** Nombre de jours de `from` à `to` (négatif si `to` est avant). */
export function daysBetween(from: string, to: string): number {
  return Math.round((dayToUtcDate(to).getTime() - dayToUtcDate(from).getTime()) / MS_PER_DAY);
}

/**
 * Jours de la semaine, lundi en premier (la semaine commence le lundi). Une liste de jours se range toujours dans cet
 * ordre.
 */
export const WEEKDAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** Rang du jour dans la semaine, lundi = 0 (la semaine commence le lundi). */
export function weekdayIndex(day: string): number {
  return (dayToUtcDate(day).getUTCDay() + 6) % 7;
}

/** Jour de la semaine d'un jour civil. */
export function weekdayOf(day: string): Weekday {
  const weekday = WEEKDAYS[weekdayIndex(day)];
  if (weekday === undefined) throw new Error(`Jour de la semaine introuvable pour ${day}.`);
  return weekday;
}
