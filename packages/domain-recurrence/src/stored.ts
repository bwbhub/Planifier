import {
  RECURRENCE_FREQUENCIES,
  RECURRENCE_MAX_INTERVAL,
  WEEKDAYS,
} from "@planifier/constants/todo";
import { z } from "zod";

import type { Recurrence } from "./recurrence";

/**
 * Forme stockée d'une règle (colonne JSON `tasks.recurrence`), versionnée pour pouvoir évoluer. Version 1 : rythme et
 * intervalle. Version 2 : s'y ajoutent les jours de la semaine (« tous les mardis »). Les deux se lisent ; on écrit
 * toujours la plus récente.
 */
const baseFields = {
  frequency: z.enum(RECURRENCE_FREQUENCIES),
  interval: z.int().min(1).max(RECURRENCE_MAX_INTERVAL),
};

const storedRecurrenceSchema = z.discriminatedUnion("schemaVersion", [
  z.strictObject({ schemaVersion: z.literal(1), ...baseFields }),
  z.strictObject({
    schemaVersion: z.literal(2),
    ...baseFields,
    weekdays: z.array(z.enum(WEEKDAYS)).min(1).max(WEEKDAYS.length).optional(),
  }),
]);

export type StoredRecurrence = z.infer<typeof storedRecurrenceSchema>;

/** Jours rangés dans l'ordre de la semaine, sans doublon : une seule écriture pour une même règle. */
function orderedWeekdays(weekdays: readonly (typeof WEEKDAYS)[number][]) {
  return WEEKDAYS.filter((weekday) => weekdays.includes(weekday));
}

/** Règle ⇒ forme stockée (dernière version). */
export function toStoredRecurrence({
  frequency,
  interval,
  weekdays,
}: Recurrence): StoredRecurrence {
  return {
    schemaVersion: 2,
    frequency,
    interval,
    ...(weekdays === undefined || weekdays.length === 0
      ? {}
      : { weekdays: orderedWeekdays(weekdays) }),
  };
}

/**
 * Colonne lue ⇒ règle ; `null` (colonne vide) ⇒ `null`. Une valeur hors schéma est une donnée corrompue : erreur,
 * jamais une règle devinée.
 */
export function fromStoredRecurrence(value: unknown): Recurrence | null {
  if (value === null) return null;
  const stored = storedRecurrenceSchema.parse(value);
  if (stored.schemaVersion === 1) return { frequency: stored.frequency, interval: stored.interval };
  return {
    frequency: stored.frequency,
    interval: stored.interval,
    ...(stored.weekdays === undefined ? {} : { weekdays: stored.weekdays }),
  };
}
