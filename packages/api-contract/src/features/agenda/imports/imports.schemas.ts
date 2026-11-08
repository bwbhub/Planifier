import { AGENDA_IMPORT_SOURCE_PREFIX } from "@planifier/constants/agenda";
import { z } from "zod";

import { subscriptionIdSchema } from "../agenda.schemas";

/**
 * Raisons d'un échec de lecture d'un agenda importé, pour que l'interface dise quoi faire : `LINK_INVALID` (lien
 * refusé : pas un lien d'agenda d'un service admis), `FEED_UNREACHABLE` (le service n'a pas répondu comme attendu),
 * `FEED_TOO_LARGE` (agenda trop gros), `FEED_UNREADABLE` (la réponse n'est pas un agenda), `LINK_UNREADABLE` (lien
 * enregistré illisible : le recoller).
 */
export const IMPORT_FAILURE_REASONS = [
  "LINK_INVALID",
  "FEED_UNREACHABLE",
  "FEED_TOO_LARGE",
  "FEED_UNREADABLE",
  "LINK_UNREADABLE",
] as const;
export type ImportFailureReason = (typeof IMPORT_FAILURE_REASONS)[number];

export const importFailureSchema = z.strictObject({ reason: z.enum(IMPORT_FAILURE_REASONS) });

const labelSchema = z.string().trim().min(1).max(60);
/** Lien privé collé tel quel : borné ici, contrôlé en profondeur par le serveur (hôtes admis, adresses publiques). */
const linkSchema = z.string().trim().min(1).max(2048);

export const createImportInputSchema = z.strictObject({ label: labelSchema, url: linkSchema });
export const importTargetSchema = z.strictObject({ subscriptionId: subscriptionIdSchema });
export const listImportsInputSchema = z.strictObject({});

/** Agenda importé tel que l'écran le montre : jamais le lien, seulement de quoi le reconnaître. */
export const importSubscriptionSchema = z.strictObject({
  id: subscriptionIdSchema,
  label: z.string(),
  /** Hôte du lien (`calendar.google.com`), pour reconnaître lequel c'est : le reste du lien est un secret. */
  urlHint: z.string(),
  lastFetchedAt: z.date().nullable(),
  /** Raison de l'échec de la dernière lecture, null si elle a réussi. */
  lastError: z.enum(IMPORT_FAILURE_REASONS).nullable(),
});

export const listImportsOutputSchema = z.strictObject({
  items: z.array(importSubscriptionSchema),
});

export type CreateImportInput = z.output<typeof createImportInputSchema>;
export type ImportSubscriptionOutput = z.infer<typeof importSubscriptionSchema>;
export type ListImportsOutput = z.infer<typeof listImportsOutputSchema>;

/** `source` d'une entrée importée par cet agenda. */
export function importSourceOf(subscriptionId: string): string {
  return `${AGENDA_IMPORT_SOURCE_PREFIX}${subscriptionId}`;
}
