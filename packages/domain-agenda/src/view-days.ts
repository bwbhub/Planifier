import type { AgendaView } from "@planifier/constants/agenda";
import { addDays, daysBetween, dayToUtcDate, utcDateToDay } from "@planifier/constants/days";

const DAYS_PER_WEEK = 7;

/** Lundi de la semaine de `day`. */
function weekStart(day: string): string {
  const sundayFirst = dayToUtcDate(day).getUTCDay();
  return addDays(day, -((sundayFirst + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK));
}

function consecutiveDays(first: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addDays(first, index));
}

function monthBounds(day: string): { first: string; last: string } {
  const date = dayToUtcDate(day);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return {
    first: utcDateToDay(new Date(Date.UTC(year, month, 1))),
    last: utcDateToDay(new Date(Date.UTC(year, month + 1, 0))),
  };
}

/** Jours affichés autour de `day` : le jour, sa semaine (du lundi), ou les semaines entières de son mois. */
export function viewDays(view: AgendaView, day: string): string[] {
  switch (view) {
    case "DAY":
      return [day];
    case "WEEK":
      return consecutiveDays(weekStart(day), DAYS_PER_WEEK);
    case "MONTH": {
      const { first, last } = monthBounds(day);
      const start = weekStart(first);
      const end = addDays(weekStart(last), DAYS_PER_WEEK - 1);
      return consecutiveDays(start, daysBetween(start, end) + 1);
    }
  }
}

/** Même quantième `months` mois plus loin ; un jour absent du mois d'arrivée devient son dernier jour. */
function shiftMonths(day: string, months: number): string {
  const date = dayToUtcDate(day);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const { last } = monthBounds(utcDateToDay(target));
  target.setUTCDate(Math.min(date.getUTCDate(), dayToUtcDate(last).getUTCDate()));
  return utcDateToDay(target);
}

/** Jour de la période suivante (`1`) ou précédente (`-1`). */
export function stepDay(view: AgendaView, day: string, direction: 1 | -1): string {
  switch (view) {
    case "DAY":
      return addDays(day, direction);
    case "WEEK":
      return addDays(day, direction * DAYS_PER_WEEK);
    case "MONTH":
      return shiftMonths(day, direction);
  }
}
