import { z } from "zod";

import { daySchema } from "../_shared/when.schemas";

/** Identifiants générés par la base (`uuid(7)`). */
export const eventIdSchema = z.uuid();
export const spaceIdSchema = z.uuid();

/** Entrée d'une procédure qui ne vise qu'un événement. */
export const eventTargetSchema = z.strictObject({ eventId: eventIdSchema });

/**
 * Raisons d'un `CONFLICT` du module Événements, pour que l'interface dise quoi faire : `STALE_VERSION` (modifié
 * entre-temps, recharger), `EVENT_FULL` (plus de place pour « J'y vais »), `EVENTS_DISABLED` (le module Événements
 * n'est pas activé dans l'Espace visé).
 */
export const EVENT_CONFLICT_REASONS = ["STALE_VERSION", "EVENT_FULL", "EVENTS_DISABLED"] as const;
export type EventConflictReason = (typeof EVENT_CONFLICT_REASONS)[number];

/** Données d'un `CONFLICT` Événements : lues par le client avec ce schéma. */
export const eventConflictDataSchema = z.strictObject({ reason: z.enum(EVENT_CONFLICT_REASONS) });

/** Erreurs typées des procédures Événements : `CONFLICT` porte toujours sa raison. */
export const EVENT_ERRORS = { CONFLICT: { data: eventConflictDataSchema } };

/** Date d'un message « Changement », en texte : une colonne JSON ne garde pas les `Date`. */
const changeWhenSchema = z.discriminatedUnion("allDay", [
  z.strictObject({
    allDay: z.literal(false),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    openEnd: z.boolean(),
  }),
  z.strictObject({ allDay: z.literal(true), startDay: daySchema, endDay: daySchema }),
]);

/**
 * Contenu d'un commentaire `CHANGE` (colonne `comments.change`) : champ important modifié (CONTEXT.md : lieu, date,
 * heure). Versionné : validé à l'écriture et à la lecture.
 */
export const eventChangeSchema = z.discriminatedUnion("field", [
  z.strictObject({
    schemaVersion: z.literal(1),
    field: z.literal("when"),
    from: changeWhenSchema,
    to: changeWhenSchema,
  }),
  z.strictObject({
    schemaVersion: z.literal(1),
    field: z.literal("location"),
    from: z.string().nullable(),
    to: z.string().nullable(),
  }),
]);
export type EventChange = z.infer<typeof eventChangeSchema>;
