import type { TaskOutput } from "@planifier/api-contract";
import { RECURRENCE_FREQUENCIES, type RecurrenceFrequency } from "@planifier/constants/todo";

import { capitalized } from "@/lib/capitalize";
import { WEEKDAY_LABELS } from "@/lib/labels";

type Recurrence = NonNullable<TaskOutput["recurrence"]>;

/** Préréglages du champ « Répéter » ; `NONE` : tâche non répétée. */
export const REPEAT_PRESETS = [
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

/** Rythmes du choix personnalisé : « Toutes les [2] [Semaines] », dans l'ordre de `RECURRENCE_FREQUENCIES`. */
export const CUSTOM_FREQUENCY_OPTIONS = RECURRENCE_FREQUENCIES.map((value) => ({
  value,
  label: capitalized(UNITS[value].many),
}));

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

/** Règle lue du formulaire, avant validation par le contrat : rythme et jours encore bruts. */
export interface RecurrenceDraft {
  frequency: unknown;
  interval: number;
  weekdays?: unknown[];
}

/** Valeur du choix « Personnalisée… » dans le champ « Répéter ». */
export const CUSTOM_REPEAT = "custom";

/** Choix du champ « Répéter » : « Jamais » (`NONE`), un rythme tous les 1, ou la règle personnalisée. */
export type RepeatChoice = RecurrenceFrequency | "NONE" | typeof CUSTOM_REPEAT;

/** Choix du champ « Répéter » pour une règle : un préréglage (rythme, tous les 1, sans jours) ou la personnalisée. */
export function repeatChoiceOf(rule: Recurrence | null): RepeatChoice {
  if (rule === null) return "NONE";
  const plain = rule.interval === 1 && (rule.weekdays === undefined || rule.weekdays.length === 0);
  return plain ? rule.frequency : CUSTOM_REPEAT;
}

/**
 * Valeurs brutes du formulaire ⇒ règle à valider par le contrat ; `null` : « Jamais ». Un préréglage vaut « tous les
 * 1 » ; « Personnalisée… » lit rythme, intervalle et, rythme hebdomadaire, jours cochés. L'intervalle reste brut
 * (nombre ou `NaN`) : c'est le schéma Zod qui le refuse.
 */
export function recurrenceFromForm(data: FormData): RecurrenceDraft | null {
  const choice = data.get("repeat");
  if (choice === null || choice === "NONE") return null;
  if (choice !== CUSTOM_REPEAT) return { frequency: choice, interval: 1 };
  const frequency = data.get("customFrequency");
  const interval = Number(data.get("interval"));
  const weekdays = frequency === "WEEKLY" ? data.getAll("weekdays") : [];
  return weekdays.length === 0 ? { frequency, interval } : { frequency, interval, weekdays };
}

function sameWeekdays(a: readonly unknown[] = [], b: readonly unknown[] = []): boolean {
  return a.length === b.length && a.every((day) => b.includes(day));
}

/**
 * Ce que la modification envoie pour la répétition : `undefined` (rien) tant que le rythme, l'intervalle et les jours du
 * formulaire sont ceux de la tâche. Renvoyer la règle remettrait l'ancre de la série à zéro : rien ne doit changer à
 * l'insu de l'utilisateur. `null` : il a choisi « Jamais ».
 */
export function recurrenceChange(
  current: Recurrence | null,
  fromForm: RecurrenceDraft | null,
): RecurrenceDraft | null | undefined {
  if (fromForm === null) return current === null ? undefined : null;
  const same =
    current !== null &&
    current.frequency === fromForm.frequency &&
    current.interval === fromForm.interval &&
    sameWeekdays(current.weekdays, fromForm.weekdays);
  return same ? undefined : fromForm;
}
