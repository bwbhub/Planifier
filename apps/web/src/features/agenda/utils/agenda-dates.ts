import type { AgendaView } from "@planifier/constants/agenda";
import { dayToUtcDate } from "@planifier/constants/days";

import { today } from "@/lib/format-date";

const utc = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: "UTC" });

const WEEKDAY_SHORT = utc({ weekday: "short" });
const FULL_DAY = utc({ weekday: "long", day: "numeric", month: "long" });
const DAY_MONTH_YEAR = utc({ day: "numeric", month: "long", year: "numeric" });
const DAY_MONTH = utc({ day: "numeric", month: "long" });
const MONTH_YEAR = utc({ month: "long", year: "numeric" });
const DAY_NUMBER = utc({ day: "numeric" });

const capitalized = (text: string) => text.charAt(0).toLocaleUpperCase("fr") + text.slice(1);

/** Une heure après `time` (`HH:MM`), sans passer minuit : « 14:30 » ⇒ « 15:30 », « 23:30 » ⇒ « 23:59 ». */
export function hourAfter(time: string): string {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours >= 23
    ? "23:59"
    : `${String(hours + 1).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** « Lun » : sans le point de l'abréviation. */
export function weekdayLabel(day: string): string {
  return capitalized(WEEKDAY_SHORT.format(dayToUtcDate(day)).replace(".", ""));
}

/** « lundi 12 octobre ». */
export function fullDayLabel(day: string): string {
  return FULL_DAY.format(dayToUtcDate(day));
}

/** « 12 octobre ». */
export function dayMonthLabel(day: string): string {
  return DAY_MONTH.format(dayToUtcDate(day));
}

export function dayNumber(day: string): string {
  return DAY_NUMBER.format(dayToUtcDate(day));
}

/** Période affichée : « Jeudi 15 octobre », « 12 au 18 octobre 2026 », « Octobre 2026 ». */
export function periodLabel(view: AgendaView, days: readonly string[], day: string): string {
  const first = days[0] ?? day;
  const last = days.at(-1) ?? day;
  switch (view) {
    case "DAY":
      return capitalized(fullDayLabel(day));
    case "WEEK": {
      const start = first.slice(0, 7) === last.slice(0, 7) ? dayNumber(first) : null;
      const from = start ?? dayMonthLabel(first);
      return `${from} au ${DAY_MONTH_YEAR.format(dayToUtcDate(last))}`;
    }
    case "MONTH":
      return capitalized(MONTH_YEAR.format(dayToUtcDate(day)));
  }
}

/** Valeur d'un champ `datetime-local` : heure de l'appareil, à la minute. */
export function toLocalInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${today(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
