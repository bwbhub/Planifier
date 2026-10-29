import type { TaskOutput } from "@planifier/api-contract";
import type { RecurrenceFrequency } from "@planifier/constants/todo";

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

/** « Toutes les semaines », « Tous les 3 jours ». */
export function recurrenceLabel({ frequency, interval }: Recurrence): string {
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
