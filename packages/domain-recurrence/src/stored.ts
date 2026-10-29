import { RECURRENCE_FREQUENCIES, RECURRENCE_MAX_INTERVAL } from "@planifier/constants/todo";
import { z } from "zod";

import type { Recurrence } from "./recurrence";

/** Forme stockée d'une règle (colonne JSON `tasks.recurrence`), versionnée pour pouvoir évoluer (jours de semaine…). */
const storedRecurrenceSchema = z.strictObject({
  schemaVersion: z.literal(1),
  frequency: z.enum(RECURRENCE_FREQUENCIES),
  interval: z.int().min(1).max(RECURRENCE_MAX_INTERVAL),
});

export type StoredRecurrence = z.infer<typeof storedRecurrenceSchema>;

/** Règle ⇒ forme stockée. */
export function toStoredRecurrence({ frequency, interval }: Recurrence): StoredRecurrence {
  return { schemaVersion: 1, frequency, interval };
}

/**
 * Colonne lue ⇒ règle ; `null` (colonne vide) ⇒ `null`. Une valeur hors schéma est une donnée corrompue : erreur,
 * jamais une règle devinée.
 */
export function fromStoredRecurrence(value: unknown): Recurrence | null {
  if (value === null) return null;
  const { frequency, interval } = storedRecurrenceSchema.parse(value);
  return { frequency, interval };
}
