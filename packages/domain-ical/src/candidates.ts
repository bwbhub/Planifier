import { addDays, weekdayIndex } from "@planifier/constants/days";

import type { Rule } from "./recurrence-rule";

const pad = (value: number, width = 2) => String(value).padStart(width, "0");
const toDay = (year: number, month: number, day: number) =>
  `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

function parseDay(day: string): { year: number; month: number; dom: number } {
  const [year = 0, month = 0, dom = 0] = day.split("-").map(Number);
  return { year, month, dom };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function* daily(start: string, interval: number): Generator<string> {
  for (let step = 0; ; step += 1) yield addDays(start, step * interval);
}

function* weekly(start: string, { interval, byDay }: Rule): Generator<string> {
  const weekdays = byDay.length > 0 ? byDay : [weekdayIndex(start)];
  const firstMonday = addDays(start, -weekdayIndex(start));
  for (let step = 0; ; step += 1) {
    const monday = addDays(firstMonday, step * interval * 7);
    for (const weekday of weekdays) {
      const day = addDays(monday, weekday);
      if (day >= start) yield day;
    }
  }
}

function* monthly(start: string, { interval, byMonthDay }: Rule): Generator<string> {
  const { year, month, dom } = parseDay(start);
  const monthDays = byMonthDay.length > 0 ? byMonthDay : [dom];
  for (let step = 0; ; step += 1) {
    const index = month - 1 + step * interval;
    const y = year + Math.floor(index / 12);
    const m = (index % 12) + 1;
    for (const monthDay of monthDays) {
      // Un 31 n'existe pas tous les mois : ce mois-là est sauté (RFC 5545).
      if (monthDay > daysInMonth(y, m)) continue;
      const day = toDay(y, m, monthDay);
      if (day >= start) yield day;
    }
  }
}

function* yearly(start: string, { interval }: Rule): Generator<string> {
  const { year, month, dom } = parseDay(start);
  for (let step = 0; ; step += 1) {
    const y = year + step * interval;
    if (dom <= daysInMonth(y, month)) yield toDay(y, month, dom);
  }
}

/**
 * Jours candidats d'une règle, dans l'ordre, à partir de `start` (le premier jour de la série, toujours un
 * candidat). Flux sans fin : l'appelant l'arrête (`COUNT`, `UNTIL`, fenêtre, plafond).
 */
export function candidateDays(start: string, rule: Rule): Generator<string> {
  switch (rule.frequency) {
    case "DAILY":
      return daily(start, rule.interval);
    case "WEEKLY":
      return weekly(start, rule);
    case "MONTHLY":
      return monthly(start, rule);
    case "YEARLY":
      return yearly(start, rule);
  }
}
