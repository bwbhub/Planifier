import type { TaskOutput } from "@planifier/api-contract";
import type { RecurrenceFrequency } from "@planifier/constants/todo";

import { WEEKDAY_LABELS } from "@/lib/labels";

type Recurrence = NonNullable<TaskOutput["recurrence"]>;

/** Choix « Répéter » du formulaire ; `NONE` : tâche non répétée. */
export const REPEAT_OPTIONS = [
  { value: "NONE", label: "Jamais" },
  { value: "DAILY", label: "Chaque jour" },
  { value: "WEEKLY", label: "Chaque semaine" },
  { value: "MONTHLY", label: "Chaque mois" },
  { value: "YEARLY", label: "Chaque année" },
] as const satisfies readonly { value: RecurrenceFrequency | "NONE"; label: string }[];

const UNITS: Record<RecurrenceFrequency, { one: string; many: string; feminine: boolean }> = {
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
  const unit = UNITS[frequency];
  const every = unit.feminine ? "Toutes les" : "Tous les";
  return interval === 1 ? `${every} ${unit.many}` : `${every} ${String(interval)} ${unit.many}`;
}

/**
 * Valeurs brutes du formulaire ⇒ règle à valider par le contrat ; `null` : « Jamais ». L'intervalle reste brut
 * (nombre ou `NaN`) : c'est le schéma Zod qui le refuse.
 */
export function recurrenceFromForm(
  data: FormData,
): { frequency: unknown; interval: number } | null {
  const frequency = data.get("repeat");
  if (frequency === null || frequency === "NONE") return null;
  return { frequency, interval: Number(data.get("interval")) };
}

/**
 * Ce que la modification envoie pour la répétition : `undefined` (rien) tant que le rythme et l'intervalle du formulaire
 * sont ceux de la tâche. Renvoyer la règle remettrait l'ancre de la série à zéro et effacerait les jours de la semaine,
 * que ce formulaire ne montre pas : rien ne doit changer à l'insu de l'utilisateur. `null` : il a choisi « Jamais ».
 */
export function recurrenceChange(
  current: Recurrence | null,
  fromForm: { frequency: unknown; interval: number } | null,
): { frequency: unknown; interval: number } | null | undefined {
  if (fromForm === null) return current === null ? undefined : null;
  const same =
    current !== null &&
    current.frequency === fromForm.frequency &&
    current.interval === fromForm.interval;
  return same ? undefined : fromForm;
}
