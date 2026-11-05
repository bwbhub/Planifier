import {
  AGENDA_DESCRIPTION_MAX_LENGTH,
  AGENDA_LOCATION_MAX_LENGTH,
  AGENDA_MAX_ENTRY_DAYS,
  AGENDA_MAX_PARTICIPANTS,
  AGENDA_PARTICIPANT_MAX_LENGTH,
  AGENDA_MAX_WINDOW_DAYS,
  AGENDA_TITLE_MAX_LENGTH,
} from "@planifier/constants/agenda";
import { daysBetween, MS_PER_DAY } from "@planifier/constants/days";
import { LIST_TINTS } from "@planifier/constants/todo";
import { z } from "zod";

import { PAGE_MAX_LIMIT } from "../../_shared/page.schemas";
import { personSchema } from "../../_shared/person.schemas";
import { entryIdSchema, entryTargetSchema, spaceIdSchema, taskIdSchema } from "../agenda.schemas";

const titleSchema = z.string().trim().min(1).max(AGENDA_TITLE_MAX_LENGTH);
/** Pas de description ni de lieu : champ absent (création) ou `null` (modification), jamais une chaîne vide. */
const descriptionSchema = z.string().trim().min(1).max(AGENDA_DESCRIPTION_MAX_LENGTH);
const locationSchema = z.string().trim().min(1).max(AGENDA_LOCATION_MAX_LENGTH);
/** Noms en texte libre, sans compte : rien n'est envoyé à personne. Chaque nom une fois ; `[]` : personne. */
const participantsSchema = z
  .array(z.string().trim().min(1).max(AGENDA_PARTICIPANT_MAX_LENGTH))
  .max(AGENDA_MAX_PARTICIPANTS)
  .refine((names) => new Set(names).size === names.length, "Chaque participant une seule fois.");
const tintSchema = z.enum(LIST_TINTS);
/** Jour `AAAA-MM-JJ`, sans heure ni fuseau. */
const daySchema = z.iso.date();

const spansAtMost = (startMs: number, endMs: number, days: number) =>
  endMs - startMs <= days * MS_PER_DAY;

const timedFields = { allDay: z.literal(false), startsAt: z.date(), endsAt: z.date() };
/** `endDay` inclus : une entrée d'un jour a `startDay` égal à `endDay`. */
const allDayFields = { allDay: z.literal(true), startDay: daySchema, endDay: daySchema };

const timedInputSchema = z
  .strictObject(timedFields)
  .refine(({ startsAt, endsAt }) => startsAt < endsAt, "La fin doit suivre le début.")
  .refine(
    ({ startsAt, endsAt }) =>
      spansAtMost(startsAt.getTime(), endsAt.getTime(), AGENDA_MAX_ENTRY_DAYS),
    "Entrée trop longue.",
  );

const allDayInputSchema = z
  .strictObject(allDayFields)
  .refine(({ startDay, endDay }) => startDay <= endDay, "La fin doit suivre le début.")
  .refine(
    ({ startDay, endDay }) => daysBetween(startDay, endDay) < AGENDA_MAX_ENTRY_DAYS,
    "Entrée trop longue.",
  );

/** Horaire (instants) ou à la journée (jours, sans fuseau) : une entrée n'a jamais les deux. */
const whenInputSchema = z.discriminatedUnion("allDay", [timedInputSchema, allDayInputSchema]);

/** En sortie, la forme seule : une borne d'écriture ne doit pas rendre illisible une entrée importée, plus longue. */
const agendaWhenSchema = z.discriminatedUnion("allDay", [
  z.strictObject(timedFields),
  z.strictObject(allDayFields),
]);

/**
 * Période affichée, dite dans les deux formes : le serveur ne connaît pas le fuseau de l'utilisateur, l'appareil
 * calcule. `from` inclus, `to` exclu pour les entrées horaires ; `fromDay` et `toDay` inclus pour celles à la journée.
 */
const entriesWindowFields = { from: z.date(), to: z.date(), fromDay: daySchema, toDay: daySchema };

const pageFields = {
  limit: z.int().min(1).max(PAGE_MAX_LIMIT).default(PAGE_MAX_LIMIT),
  /** `nextCursor` de la page précédente. */
  cursor: entryIdSchema.optional(),
};

export type EntriesWindow = z.infer<z.ZodObject<typeof entriesWindowFields>>;

function isBoundedWindow({ from, to, fromDay, toDay }: EntriesWindow) {
  return (
    from < to &&
    fromDay <= toDay &&
    spansAtMost(from.getTime(), to.getTime(), AGENDA_MAX_WINDOW_DAYS) &&
    daysBetween(fromDay, toDay) < AGENDA_MAX_WINDOW_DAYS
  );
}

const WINDOW_ERROR = `Période invalide, ${String(AGENDA_MAX_WINDOW_DAYS)} jours au plus.`;

export const listEntriesInputSchema = z
  .strictObject({ ...entriesWindowFields, ...pageFields })
  .refine(isBoundedWindow, WINDOW_ERROR);

export const listSpaceEntriesInputSchema = z
  .strictObject({ ...entriesWindowFields, ...pageFields, spaceId: spaceIdSchema })
  .refine(isBoundedWindow, WINDOW_ERROR);

export const createEntryInputSchema = z.strictObject({
  title: titleSchema,
  description: descriptionSchema.optional(),
  location: locationSchema.optional(),
  participants: participantsSchema.optional(),
  when: whenInputSchema,
  tint: tintSchema,
  /** Cachée de la vue fusionnée ; absent : visible, le choix par défaut d'un Espace. */
  hidden: z.boolean().optional(),
  /** Tâche que l'appelant peut lire : lien à sens unique, l'entrée ne coche rien. */
  taskId: taskIdSchema.optional(),
});

/** Champs modifiés : au moins un ; `null` efface. `version` lue avec l'entrée (concurrence optimiste). */
export const updateEntryInputSchema = z
  .strictObject({
    entryId: entryIdSchema,
    version: z.int().min(1),
    title: titleSchema.optional(),
    description: descriptionSchema.nullable().optional(),
    location: locationSchema.nullable().optional(),
    participants: participantsSchema.optional(),
    when: whenInputSchema.optional(),
    tint: tintSchema.optional(),
    hidden: z.boolean().optional(),
    taskId: taskIdSchema.nullable().optional(),
  })
  .refine(
    ({ title, description, location, participants, when, tint, hidden, taskId }) =>
      [title, description, location, participants, when, tint, hidden, taskId].some(
        (field) => field !== undefined,
      ),
    "Aucun champ à modifier.",
  );

export const deleteEntryInputSchema = entryTargetSchema;

const sharedEntryFields = {
  id: entryIdSchema,
  title: z.string(),
  location: z.string().nullable(),
  participants: z.array(z.string()),
  when: agendaWhenSchema,
};

/** Entrée de l'appelant. */
export const agendaEntrySchema = z.strictObject({
  ...sharedEntryFields,
  description: z.string().nullable(),
  tint: tintSchema,
  hidden: z.boolean(),
  taskId: taskIdSchema.nullable(),
  version: z.int(),
});

/** Entrée vue dans un Espace : titre, horaire, lieu et participants (maquette) ; le reste ne regarde que son propriétaire (données minimales). */
export const spaceEntrySchema = z.strictObject({
  ...sharedEntryFields,
  owner: personSchema,
});

const nextCursorSchema = entryIdSchema.nullable();

/** Entrées de la période, dans l'ordre de création : l'écran les place lui-même. */
export const listEntriesOutputSchema = z.strictObject({
  items: z.array(agendaEntrySchema).max(PAGE_MAX_LIMIT),
  /** null : dernière page. */
  nextCursor: nextCursorSchema,
});

export const listSpaceEntriesOutputSchema = z.strictObject({
  items: z.array(spaceEntrySchema).max(PAGE_MAX_LIMIT),
  /** null : dernière page. */
  nextCursor: nextCursorSchema,
});

export type AgendaWhen = z.infer<typeof agendaWhenSchema>;
export type AgendaEntryOutput = z.infer<typeof agendaEntrySchema>;
export type SpaceEntryOutput = z.infer<typeof spaceEntrySchema>;
export type ListEntriesOutput = z.infer<typeof listEntriesOutputSchema>;
export type ListSpaceEntriesOutput = z.infer<typeof listSpaceEntriesOutputSchema>;
export type ListEntriesInput = z.output<typeof listEntriesInputSchema>;
export type ListSpaceEntriesInput = z.output<typeof listSpaceEntriesInputSchema>;
export type CreateEntryInput = z.output<typeof createEntryInputSchema>;
export type UpdateEntryInput = z.output<typeof updateEntryInputSchema>;
