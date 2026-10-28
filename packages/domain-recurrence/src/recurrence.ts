import { dayToUtcDate, utcDateToDay } from "@planifier/constants/days";
import type { RecurrenceFrequency } from "@planifier/constants/todo";

/** Règle de répétition d'une tâche : tous les `interval` jours, semaines, mois ou ans (ADR 0017). */
export interface Recurrence {
  frequency: RecurrenceFrequency;
  interval: number;
}

const MS_PER_DAY = 86_400_000;

function addDays(day: string, days: number): string {
  return utcDateToDay(new Date(dayToUtcDate(day).getTime() + days * MS_PER_DAY));
}

/** `months` mois après `day` ; un jour absent du mois d'arrivée (31, 29 février) devient son dernier jour. */
function addMonths(day: string, months: number): string {
  const date = dayToUtcDate(day);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return utcDateToDay(target);
}

/** `k`-ième occurrence après `anchor` : calculée depuis l'ancre, jamais de proche en proche (pas de glissement). */
function occurrence(anchor: string, { frequency, interval }: Recurrence, k: number): string {
  switch (frequency) {
    case "DAILY":
      return addDays(anchor, k * interval);
    case "WEEKLY":
      return addDays(anchor, 7 * k * interval);
    case "MONTHLY":
      return addMonths(anchor, k * interval);
    case "YEARLY":
      return addMonths(anchor, 12 * k * interval);
  }
}

/**
 * Prochaine échéance quand on coche une tâche répétée : première occurrence **strictement après aujourd'hui**, comptée
 * depuis l'échéance actuelle (ou depuis aujourd'hui si la tâche n'en a pas). Une tâche cochée en retard saute les
 * occurrences passées au lieu de les rattraper une à une.
 */
export function nextDueDate(rule: Recurrence, dueDay: string | null, todayDay: string): string {
  const anchor = dueDay ?? todayDay;
  // Estimation basse du rang à atteindre, puis avance : borne le nombre de tours même après un long retard.
  const lagDays = Math.max(
    0,
    (dayToUtcDate(todayDay).getTime() - dayToUtcDate(anchor).getTime()) / MS_PER_DAY,
  );
  const periodDays =
    { DAILY: 1, WEEKLY: 7, MONTHLY: 31, YEARLY: 366 }[rule.frequency] * rule.interval;
  let k = Math.max(1, Math.floor(lagDays / periodDays));
  while (occurrence(anchor, rule, k) <= todayDay) k += 1;
  return occurrence(anchor, rule, k);
}
