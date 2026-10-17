import type { Db } from "../factory";
import { SEED_IDS } from "./ids";

const START = new Date("2030-06-15T10:00:00.000Z");
const END = new Date("2030-06-16T18:00:00.000Z");

// Comme un événement créé par le service : le créateur est participant OWNER, avec des réglages.
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
] as const;

const SETTINGS = [
  { id: SEED_IDS.eventSettings, eventId: SEED_IDS.spaceEvent },
  { id: SEED_IDS.personalEventSettings, eventId: SEED_IDS.personalEvent },
];

/** Un événement d'Espace avec ses participants, un événement personnel, une invitation et un commentaire important. */
export async function seedEvents(db: Db) {
  const shared = {
    title: "Week-end à la mer",
    location: "Biarritz",
    startDate: START,
    endDate: END,
    ownerId: SEED_IDS.alice,
    spaceId: SEED_IDS.space,
  };
  await db.event.upsert({
    where: { id: SEED_IDS.spaceEvent },
    create: { id: SEED_IDS.spaceEvent, ...shared },
    update: shared,
  });

  const personal = { title: "Dentiste", startDate: START, ownerId: SEED_IDS.alice, spaceId: null };
  await db.event.upsert({
    where: { id: SEED_IDS.personalEvent },
    create: { id: SEED_IDS.personalEvent, ...personal },
    update: personal,
  });

  for (const { id, ...data } of PARTICIPANTS) {
    await db.eventParticipant.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  for (const { id, eventId } of SETTINGS) {
    await db.eventSettings.upsert({ where: { id }, create: { id, eventId }, update: {} });
  }

  const invite = {
    token: "seed-invite-token",
    email: "dave@example.test",
    inviterId: SEED_IDS.alice,
  };
  await db.invite.upsert({
    where: { id: SEED_IDS.eventInvite },
    create: { id: SEED_IDS.eventInvite, eventId: SEED_IDS.spaceEvent, ...invite },
    update: invite,
  });

  const comment = {
    text: "On part à 9 h, pensez au maillot !",
    isImportant: true,
    userId: SEED_IDS.alice,
  };
  await db.comment.upsert({
    where: { id: SEED_IDS.eventComment },
    create: { id: SEED_IDS.eventComment, eventId: SEED_IDS.spaceEvent, ...comment },
    update: comment,
  });
}
