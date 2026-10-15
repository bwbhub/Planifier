import type { Db } from "../factory";
import { SEED_IDS } from "./ids";

const START = new Date("2030-06-15T10:00:00.000Z");
const END = new Date("2030-06-16T18:00:00.000Z");

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

  const participants = [
    { id: SEED_IDS.participantAlice, userId: SEED_IDS.alice, role: "OWNER", status: "GOING" },
    { id: SEED_IDS.participantBob, userId: SEED_IDS.bob, role: "ORGANIZER", status: "GOING" },
    { id: SEED_IDS.participantChloe, userId: SEED_IDS.chloe, role: "GUEST", status: "PENDING" },
  ] as const;
  for (const { id, ...data } of participants) {
    await db.eventParticipant.upsert({
      where: { id },
      create: { id, eventId: SEED_IDS.spaceEvent, ...data },
      update: data,
    });
  }

  await db.eventSettings.upsert({
    where: { id: SEED_IDS.eventSettings },
    create: { id: SEED_IDS.eventSettings, eventId: SEED_IDS.spaceEvent },
    update: {},
  });

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
