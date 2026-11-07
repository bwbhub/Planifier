import { dayToUtcDate } from "@planifier/constants/days";

const DAY_MONTH = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const DAY_MONTH_YEAR = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Jour en toutes lettres (« 5 novembre ») ; l'année n'apparaît que si ce n'est pas celle de `todayDay`. */
export function formatDueDate(day: string, todayDay: string): string {
  const sameYear = day.slice(0, 4) === todayDay.slice(0, 4);
  return (sameYear ? DAY_MONTH : DAY_MONTH_YEAR).format(dayToUtcDate(day));
}

/** Échéance passée : jour strictement avant aujourd'hui (les jours `AAAA-MM-JJ` se comparent comme du texte). */
export function isPastDue(day: string, todayDay: string): boolean {
  return day < todayDay;
}

/** Échéance telle qu'on la lit : « 5 novembre », ou « 5 novembre à 09:30 » avec une heure. */
export function dueLabel(day: string, time: string | null, todayDay: string): string {
  const label = formatDueDate(day, todayDay);
  return time === null ? label : `${label} à ${time}`;
}
