const DAY_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** Jour `AAAA-MM-JJ` en toutes lettres (« 5 novembre »), lu en UTC pour ne jamais glisser d'un jour. */
export function formatDueDate(day: string): string {
  return DAY_FORMAT.format(new Date(`${day}T00:00:00Z`));
}
