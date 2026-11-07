import {
  addDays,
  daysBetween,
  dayToUtcDate,
  utcDateToDay,
  type Weekday,
  weekdayIndex,
  weekdayOf,
} from "@planifier/constants/days";
import type { RecurrenceFrequency } from "@planifier/constants/todo";

/**
 * Règle de répétition d'une tâche : tous les `interval` jours, semaines, mois ou ans (ADR 0017). `weekdays` (rythme
 * hebdomadaire seulement) : « tous les mardis », « un lundi sur deux » ; absent, la règle suit le jour de l'ancre.
 */
export interface Recurrence {
  frequency: RecurrenceFrequency;
  interval: number;
  weekdays?: Weekday[] | undefined;
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

/** Règle à jours de la semaine, ou `null` pour les autres. */
function weekdaysOf({ weekdays }: Recurrence): Weekday[] | null {
  return weekdays !== undefined && weekdays.length > 0 ? weekdays : null;
}

/** Premier jour strictement après `day` qui tombe un des `weekdays`, sans regard pour la parité des semaines. */
function firstWeekdayAfter(day: string, weekdays: readonly Weekday[]): string {
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = addDays(day, offset);
    if (weekdays.includes(weekdayOf(candidate))) return candidate;
  }
  throw new Error("Règle à jours de la semaine sans aucun jour.");
}

/**
 * Ancre effective d'une série : celle gardée, sinon l'échéance. Sans l'une ni l'autre, aujourd'hui ; pour une règle à
 * jours de la semaine, la **première occurrence** après aujourd'hui, qui fixe la parité des semaines (« un lundi sur
 * deux » compte depuis ce lundi-là, pas depuis le jour de la coche).
 */
export function seriesAnchor(rule: Recurrence, { anchor, due }: Series, todayDay: string): string {
  if (anchor !== null) return anchor;
  if (due !== null) return due;
  const weekdays = weekdaysOf(rule);
  return weekdays === null ? todayDay : firstWeekdayAfter(todayDay, weekdays);
}

/** Lundi de la semaine de `day` : les semaines se comptent d'un lundi à l'autre. */
function mondayOf(day: string): string {
  return addDays(day, -weekdayIndex(day));
}

/**
 * Première occurrence d'une règle à jours **strictement après** `after` : un des jours voulus, dans une semaine qui
 * tombe sur le rythme (`interval` semaines) compté depuis la semaine de l'ancre.
 */
function nextWeekdayOccurrence(
  weekdays: readonly Weekday[],
  interval: number,
  anchor: string,
  after: string,
): string {
  const anchorMonday = mondayOf(anchor);
  // Un cycle complet (interval semaines) suffit à retomber sur un jour voulu.
  for (let offset = 1; offset <= 7 * interval + 7; offset += 1) {
    const candidate = addDays(after, offset);
    const weeks = daysBetween(anchorMonday, mondayOf(candidate)) / 7;
    const onRhythm = ((weeks % interval) + interval) % interval === 0;
    if (onRhythm && weekdays.includes(weekdayOf(candidate))) return candidate;
  }
  throw new Error("Aucune occurrence trouvée pour une règle à jours de la semaine.");
}

/**
 * Prochaine échéance quand on coche une tâche répétée : première occurrence de la série **strictement après
 * aujourd'hui et après l'échéance actuelle**. Une tâche cochée en retard saute les occurrences passées ; cochée en
 * avance, elle passe à la suivante de son échéance.
 */
export function nextDueDate(rule: Recurrence, series: Series, todayDay: string): string {
  const anchor = seriesAnchor(rule, series, todayDay);
  const after = series.due !== null && series.due > todayDay ? series.due : todayDay;
  const weekdays = weekdaysOf(rule);
  if (weekdays !== null) return nextWeekdayOccurrence(weekdays, rule.interval, anchor, after);
  // Estimation basse du rang à atteindre, puis avance : borne le nombre de tours même après un long retard.
  let k = Math.max(1, Math.floor(daysBetween(anchor, after) / maxPeriodDays(rule)));
  while (occurrence(anchor, rule, k) <= after) k += 1;
  return occurrence(anchor, rule, k);
}
