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

/** Aujourd'hui, jour `AAAA-MM-JJ` de l'appareil (le jour que l'utilisateur vit, pas celui d'UTC). */
export function today(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${String(now.getFullYear())}-${month}-${day}`;
}

/** Jour en toutes lettres (« 5 novembre ») ; l'année n'apparaît que si ce n'est pas celle de `todayDay`. */
export function formatDueDate(day: string, todayDay: string): string {
  const sameYear = day.slice(0, 4) === todayDay.slice(0, 4);
  return (sameYear ? DAY_MONTH : DAY_MONTH_YEAR).format(dayToUtcDate(day));
}

/** Échéance passée : jour strictement avant aujourd'hui (les jours `AAAA-MM-JJ` se comparent comme du texte). */
export function isPastDue(day: string, todayDay: string): boolean {
  return day < todayDay;
}
