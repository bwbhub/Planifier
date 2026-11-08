const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const RELATIVE = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

/** Dernière lecture d'un agenda importé, dite simplement : « Actualisé il y a 3 heures ». */
export function fetchedLabel(lastFetchedAt: Date | null, now: Date = new Date()): string {
  if (lastFetchedAt === null) return "Pas encore actualisé";
  const age = Math.max(0, now.getTime() - lastFetchedAt.getTime());
  if (age < MINUTE_MS) return "Actualisé à l'instant";
  if (age < HOUR_MS) return `Actualisé ${RELATIVE.format(-Math.floor(age / MINUTE_MS), "minute")}`;
  if (age < DAY_MS) return `Actualisé ${RELATIVE.format(-Math.floor(age / HOUR_MS), "hour")}`;
  return `Actualisé ${RELATIVE.format(-Math.floor(age / DAY_MS), "day")}`;
}
