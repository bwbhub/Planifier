import {
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_LOCATION_MAX_LENGTH,
  EVENT_MAX_GUESTS,
  EVENT_MAX_PARTICIPANTS,
  EVENT_ROLES,
  EVENT_TITLE_MAX_LENGTH,
  PARTICIPANT_STATUSES,
  RESPONSE_STATUSES,
} from "@planifier/constants/events";
import { daysBetween, WHEN_MAX_DAYS } from "@planifier/constants/days";
import { LIST_TINTS } from "@planifier/constants/todo";
import { z } from "zod";

import { PAGE_MAX_LIMIT } from "../../_shared/page.schemas";
import { personSchema } from "../../_shared/person.schemas";
import { allDayFields, daySchema, spansAtMost, timedFields } from "../../_shared/when.schemas";
import { eventIdSchema, spaceIdSchema } from "../events.schemas";

const titleSchema = z.string().trim().min(1).max(EVENT_TITLE_MAX_LENGTH);
/** Pas de description ni de lieu : champ absent (création) ou `null` (modification), jamais une chaîne vide. */
const descriptionSchema = z.string().trim().min(1).max(EVENT_DESCRIPTION_MAX_LENGTH);
const locationSchema = z.string().trim().min(1).max(EVENT_LOCATION_MAX_LENGTH);
const tintSchema = z.enum(LIST_TINTS);
const maxParticipantsSchema = z.int().min(1).max(EVENT_MAX_PARTICIPANTS);

/** Sans fin choisie, la fin est celle du jour de début, calculée par l'appareil : un jour (24 h) au plus. */
const OPEN_END_MAX_DAYS = 1;

/**
 * Date à l'écriture : horaire (instants, `openEnd` quand l'hôte n'a pas choisi de fin) ou à la journée (jours, sans
 * fuseau, `endDay` absent : un seul jour). Le serveur ne connaît pas le fuseau : l'appareil calcule les instants.
 */
const timedInputSchema = z
  .strictObject({ ...timedFields, openEnd: z.boolean().default(false) })
  .refine(({ startsAt, endsAt }) => startsAt < endsAt, "La fin doit suivre le début.")
  .refine(
    ({ startsAt, endsAt }) => spansAtMost(startsAt.getTime(), endsAt.getTime(), WHEN_MAX_DAYS),
    "Événement trop long.",
  )
  .refine(
    ({ startsAt, endsAt, openEnd }) =>
      !openEnd || spansAtMost(startsAt.getTime(), endsAt.getTime(), OPEN_END_MAX_DAYS),
    "Sans fin choisie, l'événement ne dépasse pas un jour.",
  );

const allDayInputSchema = z
  .strictObject({ ...allDayFields, endDay: daySchema.optional() })
  .refine(
    ({ startDay, endDay }) => endDay === undefined || startDay <= endDay,
    "La fin doit suivre le début.",
  )
  .refine(
    ({ startDay, endDay }) => endDay === undefined || daysBetween(startDay, endDay) < WHEN_MAX_DAYS,
    "Événement trop long.",
  );

export const eventWhenInputSchema = z.discriminatedUnion("allDay", [
  timedInputSchema,
  allDayInputSchema,
]);

/** En sortie : la forme seule. `openEnd` : fin non choisie, `endsAt` est la fin du jour de début. */
export const eventWhenSchema = z.discriminatedUnion("allDay", [
  z.strictObject({ ...timedFields, openEnd: z.boolean() }),
  z.strictObject(allDayFields),
]);
export type EventWhenOutput = z.infer<typeof eventWhenSchema>;

const spaceRefSchema = z.strictObject({ id: spaceIdSchema, name: z.string() });

const roleSchema = z.enum(EVENT_ROLES);
const statusSchema = z.enum(PARTICIPANT_STATUSES);

// --- Liste -----------------------------------------------------------------------------------------------------

export const LIST_PERIODS = ["upcoming", "past"] as const;

/**
 * Événements visibles de l'appelant, à venir (pas encore finis, dont ceux en cours) ou passés. « Maintenant » et le
 * jour civil sont dits par l'appareil, qui connaît le fuseau.
 */
export const listEventsInputSchema = z.strictObject({
  period: z.enum(LIST_PERIODS),
  now: z.date(),
  today: daySchema,
  limit: z.int().min(1).max(PAGE_MAX_LIMIT).default(PAGE_MAX_LIMIT),
  /** `nextCursor` de la page précédente : opaque. */
  cursor: z.string().min(1).max(200).optional(),
});

const MAX_PREVIEW = 3;

/** Un événement de la liste. */
export const eventSummarySchema = z.strictObject({
  id: eventIdSchema,
  title: z.string(),
  when: eventWhenSchema,
  location: z.string().nullable(),
  tint: tintSchema,
  space: spaceRefSchema.nullable(),
  /** Rôle de l'appelant ; null : il voit l'événement par son Espace ou par une invitation. */
  myRole: roleSchema.nullable(),
  /** Réponse de l'appelant ; `PENDING` : invité, pas encore répondu ; null : vu par son Espace, sans invitation. */
  myStatus: statusSchema.nullable(),
  goingCount: z.int(),
  /** Quelques personnes qui y vont ; vide quand l'appelant ne voit pas la liste des invités. */
  goingPreview: z.array(personSchema).max(MAX_PREVIEW),
});

export const listEventsOutputSchema = z.strictObject({
  items: z.array(eventSummarySchema).max(PAGE_MAX_LIMIT),
  /** null : dernière page. */
  nextCursor: z.string().nullable(),
});

// --- Détail ----------------------------------------------------------------------------------------------------

/** Ce que l'appelant peut faire de cet événement : l'interface n'a pas à recalculer ses droits. */
const abilitiesSchema = z.strictObject({
  edit: z.boolean(),
  invite: z.boolean(),
  /** Un invité qui ne peut pas inviter directement propose quelqu'un. */
  propose: z.boolean(),
  delete: z.boolean(),
  react: z.boolean(),
  comment: z.boolean(),
  seeGuests: z.boolean(),
  changeSpace: z.boolean(),
});

export const eventDetailSchema = z.strictObject({
  ...eventSummarySchema.omit({ goingPreview: true }).shape,
  description: z.string().nullable(),
  version: z.int(),
  isGuestListVisible: z.boolean(),
  allowGuestInvite: z.boolean(),
  maxParticipants: z.int().nullable(),
  /** null : le propriétaire a supprimé son compte. */
  owner: personSchema.nullable(),
  /** Plus de place pour « J'y vais ». */
  isFull: z.boolean(),
  can: abilitiesSchema,
});

// --- Écritures -------------------------------------------------------------------------------------------------

const settingsFields = {
  /** Les invités voient qui vient (les organisateurs, toujours) ; absent : oui. */
  isGuestListVisible: z.boolean().optional(),
  /** Un invité invite directement au lieu de proposer ; absent : non. */
  allowGuestInvite: z.boolean().optional(),
};

export const createEventInputSchema = z.strictObject({
  title: titleSchema,
  when: eventWhenInputSchema,
  description: descriptionSchema.optional(),
  location: locationSchema.optional(),
  tint: tintSchema,
  /** Espace dont l'appelant est membre, Événements activé ; absent : événement personnel et privé. */
  spaceId: spaceIdSchema.optional(),
  maxParticipants: maxParticipantsSchema.optional(),
  ...settingsFields,
});

/** Champs modifiés : au moins un ; `null` efface. `version` lue avec l'événement (concurrence optimiste). */
export const updateEventInputSchema = z
  .strictObject({
    eventId: eventIdSchema,
    version: z.int().min(1),
    title: titleSchema.optional(),
    when: eventWhenInputSchema.optional(),
    description: descriptionSchema.nullable().optional(),
    location: locationSchema.nullable().optional(),
    tint: tintSchema.optional(),
    maxParticipants: maxParticipantsSchema.nullable().optional(),
    ...settingsFields,
  })
  .refine(
    (input) =>
      Object.entries(input).some(
        ([key, value]) => key !== "eventId" && key !== "version" && value !== undefined,
      ),
    "Aucun champ à modifier.",
  );

/** Rattacher à un Espace ou, avec `null`, détacher : propriétaire seulement. */
export const setEventSpaceInputSchema = z.strictObject({
  eventId: eventIdSchema,
  version: z.int().min(1),
  spaceId: spaceIdSchema.nullable(),
});

export const respondInputSchema = z.strictObject({
  eventId: eventIdSchema,
  status: z.enum(RESPONSE_STATUSES),
});

export const respondOutputSchema = z.strictObject({ myRole: roleSchema, myStatus: statusSchema });

// --- Participants ----------------------------------------------------------------------------------------------

export const participantRowSchema = z.strictObject({
  userId: z.uuid(),
  name: z.string(),
  role: roleSchema,
  status: statusSchema,
});

/** Invitation sans réponse d'un compte : l'adresse n'est rendue qu'aux organisateurs. */
export const invitationRowSchema = z.strictObject({
  id: z.uuid(),
  email: z.string(),
  /** Réponse donnée par le lien, sans compte ; `PENDING` : pas répondu. */
  response: statusSchema,
  sentAt: z.date(),
  /** Le lien de l'invitation a expiré : à renvoyer. */
  linkExpired: z.boolean(),
});

const countsSchema = z.strictObject({
  GOING: z.int(),
  MAYBE: z.int(),
  NOT_GOING: z.int(),
  PENDING: z.int(),
});

export const participantsOutputSchema = z.strictObject({
  /** Participants et invitations confondus, par réponse : visible de tous ceux qui voient l'événement. */
  counts: countsSchema,
  /** Vide quand l'appelant ne voit pas la liste des invités. */
  participants: z.array(participantRowSchema).max(EVENT_MAX_GUESTS),
  /** Seulement pour les organisateurs. */
  invitations: z.array(invitationRowSchema).max(EVENT_MAX_GUESTS),
});

export const setRoleInputSchema = z.strictObject({
  eventId: eventIdSchema,
  userId: z.uuid(),
  role: z.enum(["ORGANIZER", "GUEST"]),
});

export const removeParticipantInputSchema = z.strictObject({
  eventId: eventIdSchema,
  userId: z.uuid(),
});

export type EventSummaryOutput = z.infer<typeof eventSummarySchema>;
export type EventDetailOutput = z.infer<typeof eventDetailSchema>;
export type ListEventsInput = z.output<typeof listEventsInputSchema>;
export type ListEventsOutput = z.infer<typeof listEventsOutputSchema>;
export type CreateEventInput = z.output<typeof createEventInputSchema>;
export type UpdateEventInput = z.output<typeof updateEventInputSchema>;
export type SetEventSpaceInput = z.output<typeof setEventSpaceInputSchema>;
export type RespondInput = z.output<typeof respondInputSchema>;
export type RespondOutput = z.infer<typeof respondOutputSchema>;
export type ParticipantsOutput = z.infer<typeof participantsOutputSchema>;
export type SetRoleInput = z.output<typeof setRoleInputSchema>;
export type RemoveParticipantInput = z.output<typeof removeParticipantInputSchema>;
export type EventWhenInput = z.output<typeof eventWhenInputSchema>;
