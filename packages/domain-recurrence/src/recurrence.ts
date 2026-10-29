import { addDays, daysBetween, dayToUtcDate, utcDateToDay } from "@planifier/constants/days";
import type { RecurrenceFrequency } from "@planifier/constants/todo";

/** Règle de répétition d'une tâche : tous les `interval` jours, semaines, mois ou ans (ADR 0017). */
export interface Recurrence {
  frequency: RecurrenceFrequency;
  interval: number;
}

/** Pas d'un rythme, en jours ou en mois : seule table à compléter pour un nouveau rythme. */
const STEPS: Record<RecurrenceFrequency, { days: number } | { months: number }> = {
  DAILY: { days: 1 },
  WEEKLY: { days: 7 },
  MONTHLY: { months: 1 },
  YEARLY: { months: 12 },
};

/** Borne haute d'un mois en jours, pour estimer un rang sans le dépasser. */
const MAX_DAYS_PER_MONTH = 31;

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
  const step = STEPS[frequency];
  return "days" in step
    ? addDays(anchor, step.days * interval * k)
    : addMonths(anchor, step.months * interval * k);
}

function maxPeriodDays({ frequency, interval }: Recurrence): number {
  const step = STEPS[frequency];
  return ("days" in step ? step.days : step.months * MAX_DAYS_PER_MONTH) * interval;
}

/**
 * Série d'une tâche répétée : `anchor`, jour depuis lequel elle compte (garde le 31 ou le 29 février d'origine même
 * après un mois plus court), `null` tant qu'aucune occurrence n'a été faite ; `due`, échéance actuelle.
 */
export interface Series {
  anchor: string | null;
  due: string | null;
}

/** Ancre effective d'une série : celle gardée, sinon l'échéance, sinon aujourd'hui. */
export function seriesAnchor({ anchor, due }: Series, todayDay: string): string {
  return anchor ?? due ?? todayDay;
}

/**
 * Prochaine échéance quand on coche une tâche répétée : première occurrence de la série **strictement après
 * aujourd'hui et après l'échéance actuelle**. Une tâche cochée en retard saute les occurrences passées ; cochée en
 * avance, elle passe à la suivante de son échéance.
 */
export function nextDueDate(rule: Recurrence, series: Series, todayDay: string): string {
  const anchor = seriesAnchor(series, todayDay);
  const after = series.due !== null && series.due > todayDay ? series.due : todayDay;
  // Estimation basse du rang à atteindre, puis avance : borne le nombre de tours même après un long retard.
  let k = Math.max(1, Math.floor(daysBetween(anchor, after) / maxPeriodDays(rule)));
  while (occurrence(anchor, rule, k) <= after) k += 1;
  return occurrence(anchor, rule, k);
}
