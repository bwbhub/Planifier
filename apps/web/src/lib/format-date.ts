const SAME_YEAR = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });
const OTHER_YEAR = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Jour lisible (« 3 juillet ») ; l'année seulement si ce n'est pas celle de `now`. */
export function formatDay(date: Date, now: Date = new Date()): string {
  return (date.getFullYear() === now.getFullYear() ? SAME_YEAR : OTHER_YEAR).format(date);
}

const TIME = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

/** Heure lisible (« 14:02 »). */
export function formatTime(date: Date): string {
  return TIME.format(date);
}
