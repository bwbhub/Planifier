import type { TaskOutput } from "@planifier/api-contract";
import type { RecurrenceFrequency } from "@planifier/constants/todo";

import { WEEKDAY_LABELS } from "@/lib/labels";

type Recurrence = NonNullable<TaskOutput["recurrence"]>;

/** Unité de chaque rythme, au singulier et au pluriel. */
export const RECURRENCE_UNITS: Record<
  RecurrenceFrequency,
  { one: string; many: string; feminine: boolean }
> = {
  DAILY: { one: "jour", many: "jours", feminine: false },
  WEEKLY: { one: "semaine", many: "semaines", feminine: true },
  MONTHLY: { one: "mois", many: "mois", feminine: false },
  YEARLY: { one: "an", many: "ans", feminine: false },
};

/** « lundis », « lundis et jeudis », « lundis, mercredis et vendredis ». */
function listOf(words: readonly string[]): string {
  const last = words.at(-1);
  if (last === undefined) return "";
  return words.length === 1 ? last : `${words.slice(0, -1).join(", ")} et ${last}`;
}

/** « Tous les mardis », « Toutes les 2 semaines, le lundi et le jeudi » : une règle à jours de la semaine. */
function weekdaysLabel({ interval, weekdays = [] }: Recurrence): string {
  if (interval === 1) return `Tous les ${listOf(weekdays.map((day) => WEEKDAY_LABELS[day].many))}`;
  const days = listOf(weekdays.map((day) => `le ${WEEKDAY_LABELS[day].one}`));
  return `Toutes les ${String(interval)} semaines, ${days}`;
}

/** « Toutes les semaines », « Tous les 3 jours », « Tous les mardis ». */
export function recurrenceLabel(rule: Recurrence): string {
  const { frequency, interval, weekdays } = rule;
  if (weekdays !== undefined && weekdays.length > 0) return weekdaysLabel(rule);
  const unit = RECURRENCE_UNITS[frequency];
  const every = unit.feminine ? "Toutes les" : "Tous les";
  return interval === 1 ? `${every} ${unit.many}` : `${every} ${String(interval)} ${unit.many}`;
}
