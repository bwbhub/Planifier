import type { AgendaEntryOutput, EntriesWindow } from "@planifier/api-contract";
import { dayToUtcDate } from "@planifier/constants/days";

import { formatDay, formatTime } from "@/lib/format-date";

import { TODAY_LABELS } from "../labels";

const LONG_DAY = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** « Jeudi 15 octobre » (jour `AAAA-MM-JJ`). */
export function longDayLabel(day: string): string {
  const text = LONG_DAY.format(dayToUtcDate(day));
  return text.charAt(0).toLocaleUpperCase("fr") + text.slice(1);
}

/** Période d'une journée de l'appareil, dans les deux formes du contrat de l'agenda. */
export function dayWindow(day: string): EntriesWindow {
  const from = new Date(`${day}T00:00`);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  return { from, to, fromDay: day, toDay: day };
}

/** « 09:00 – 10:00 » ou « Toute la journée ». */
export function slotTimeLabel(entry: AgendaEntryOutput): string {
  const { when } = entry;
  if (when.allDay) return TODAY_LABELS.allDay;
  return `${formatTime(when.startsAt)} – ${formatTime(when.endsAt)}`;
}

/** Entrées du jour : « toute la journée » d'abord, puis par heure de début. Les masquées restent : ce sont les miennes. */
export function sortedSlots(entries: readonly AgendaEntryOutput[]): AgendaEntryOutput[] {
  const startOf = ({ when }: AgendaEntryOutput) => (when.allDay ? 0 : when.startsAt.getTime());
  return [...entries].sort((a, b) => startOf(a) - startOf(b));
}

/** « 3 novembre » : le jour d'une tâche en retard. */
export function overdueDayLabel(day: string): string {
  return formatDay(new Date(`${day}T00:00`));
}
