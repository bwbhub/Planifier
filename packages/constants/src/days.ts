// Jour civil `AAAA-MM-JJ` (échéance) : sans heure ni fuseau. Lu et écrit en UTC pour ne jamais glisser d'un jour.

/** Jour `AAAA-MM-JJ` ⇒ `Date` à minuit UTC (forme d'une colonne `DATE` lue par Prisma). */
export function dayToUtcDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

/** `Date` à minuit UTC ⇒ jour `AAAA-MM-JJ`. */
export function utcDateToDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
