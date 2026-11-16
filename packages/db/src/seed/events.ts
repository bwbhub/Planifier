import { createHash } from "node:crypto";

import type { Db } from "../factory";
import { SEED_IDS } from "./ids";

const day = (value: string) => new Date(`${value}T00:00:00Z`);
const instant = (value: string) => new Date(`${value}Z`);

/** Les trois formes d'une date d'événement (comme `when` d'une entrée d'agenda). */
const allDay = (start: string, end: string) => ({
  startsAt: null,
  endsAt: null,
  openEnd: false,
  startDay: day(start),
  endDay: day(end),
  startKey: day(start),
});
const timed = (start: string, end: string) => ({
  startsAt: instant(start),
  endsAt: instant(end),
  openEnd: false,
  startDay: null,
  endDay: null,
  startKey: instant(start),
});
/** Sans fin choisie : fin du jour de début. */
const timedOpenEnd = (start: string, end: string) => ({ ...timed(start, end), openEnd: true });

const EVENTS = [
  // Événement d'Espace, à la journée sur deux jours.
  {
    id: SEED_IDS.spaceEvent,
    title: "Week-end au chalet",
    location: "Les Contamines",
    description: "On loue le chalet du samedi au dimanche.",
    tint: "trip",
    ownerId: SEED_IDS.alice,
    spaceId: SEED_IDS.space,
    ...allDay("2026-12-13", "2026-12-14"),
  },
  // spaceId null : événement personnel et privé (ADR 0009).
  {
    id: SEED_IDS.personalEvent,
    title: "Anniversaire de Camille",
    location: "Chez Julien",
    description: "Surprise : ne rien dire avant 20 h.",
    tint: "couple",
    ownerId: SEED_IDS.alice,
    spaceId: null,
    ...timed("2026-11-22T19:30:00", "2026-11-22T23:30:00"),
  },
  {
    id: SEED_IDS.openEndEvent,
    title: "Apéro chez Bob",
    location: null,
    description: null,
    tint: "general",
    ownerId: SEED_IDS.bob,
    spaceId: SEED_IDS.space,
    ...timedOpenEnd("2026-11-28T20:00:00", "2026-11-29T00:00:00"),
  },
  {
    id: SEED_IDS.pastEvent,
    title: "Pique-nique d'automne",
    location: "Parc de la Tête d'Or",
    description: null,
    tint: "work",
    ownerId: SEED_IDS.alice,
    spaceId: SEED_IDS.space,
    ...allDay("2026-10-18", "2026-10-18"),
  },
] as const;

// Comme un événement créé par le service : le créateur est participant OWNER.
const PARTICIPANTS = [
  {
    id: SEED_IDS.participantAlice,
    eventId: SEED_IDS.spaceEvent,
    userId: SEED_IDS.alice,
    role: "OWNER",
    status: "GOING",
  },
  {
    id: SEED_IDS.participantBob,
    eventId: SEED_IDS.spaceEvent,
    userId: SEED_IDS.bob,
    role: "ORGANIZER",
    status: "GOING",
  },
  {
    id: SEED_IDS.participantChloe,
    eventId: SEED_IDS.spaceEvent,
    userId: SEED_IDS.chloe,
    role: "GUEST",
    status: "PENDING",
  },
  {
    id: SEED_IDS.participantAlicePersonal,
    eventId: SEED_IDS.personalEvent,
    userId: SEED_IDS.alice,
    role: "OWNER",
    status: "GOING",
  },
  {
    id: SEED_IDS.participantBobOpenEnd,
    eventId: SEED_IDS.openEndEvent,
    userId: SEED_IDS.bob,
    role: "OWNER",
    status: "GOING",
  },
  {
    id: SEED_IDS.participantAliceOpenEnd,
    eventId: SEED_IDS.openEndEvent,
    userId: SEED_IDS.alice,
    role: "GUEST",
    status: "MAYBE",
  },
  {
    id: SEED_IDS.participantAlicePast,
    eventId: SEED_IDS.pastEvent,
    userId: SEED_IDS.alice,
    role: "OWNER",
    status: "GOING",
  },
] as const;

const COMMENTS = [
  {
    id: SEED_IDS.eventCommentChange,
    kind: "CHANGE",
    text: null,
    // Forme de `ImportantChange` (domain-events), dates en texte ; son schéma Zod arrive avec l'API des commentaires.
    change: {
      schemaVersion: 1,
      field: "when",
      from: { allDay: true, startDay: "2026-12-06", endDay: "2026-12-07" },
      to: { allDay: true, startDay: "2026-12-13", endDay: "2026-12-14" },
    },
    isImportant: false,
    userId: SEED_IDS.alice,
  },
  {
    id: SEED_IDS.eventComment,
    kind: "TEXT",
    text: "Décalé d'une semaine à cause de la neige. Dites-moi si ça ne va plus pour vous.",
    isImportant: true,
    userId: SEED_IDS.alice,
  },
  {
    id: SEED_IDS.eventCommentText,
    kind: "TEXT",
    text: "Toujours bon pour moi, je prends la voiture.",
    isImportant: false,
    userId: SEED_IDS.bob,
  },
] as const;

/**
 * Quatre événements (à la journée, horaire, sans fin choisie, passé), leurs participants, une invitation sans
 * compte et des commentaires. Chaque ligne est un upsert sur un id fixe : `create` pose l'id, `update` remet les
 * valeurs de démo.
 */
export async function seedEvents(db: Db) {
  for (const { id, ...data } of EVENTS) {
    await db.event.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  for (const { id, ...data } of PARTICIPANTS) {
    await db.eventParticipant.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  // Invitation sans compte : seule l'empreinte du jeton est gardée (celui-ci n'est pas utilisable hors démo).
  const invite = {
    tokenHash: createHash("sha256").update("seed-invite-token").digest("hex"),
    email: "dave@example.test",
    inviterId: SEED_IDS.alice,
    expiresAt: instant("2030-01-01T00:00:00"),
  };
  await db.invite.upsert({
    where: { id: SEED_IDS.eventInvite },
    create: { id: SEED_IDS.eventInvite, eventId: SEED_IDS.spaceEvent, ...invite },
    update: invite,
  });

  for (const { id, ...data } of COMMENTS) {
    await db.comment.upsert({
      where: { id },
      create: { id, eventId: SEED_IDS.spaceEvent, ...data },
      update: data,
    });
  }
}
