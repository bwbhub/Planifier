import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createSpace, createTestUser } from "../todo/todo.testing";
import { addInvite, addParticipant, asUser, event, makeEvent } from "./events.testing";

// Événements : participants (ce que chacun voit), rôles et retraits. Base réelle.
const { db, reset } = createTestDatabase();

let alice: SessionUser;
let bob: SessionUser;
let carol: SessionUser;
let dave: SessionUser;
let eventId: string;

const forbidden = { code: "FORBIDDEN" };
const notFound = { code: "NOT_FOUND" };

const participants = (user: SessionUser) => call(event.participants, { eventId }, asUser(db, user));

beforeEach(async () => {
  await reset();
  alice = await createTestUser(db, "alice");
  bob = await createTestUser(db, "bob");
  carol = await createTestUser(db, "carol");
  dave = await createTestUser(db, "dave");
  ({ id: eventId } = await makeEvent(db, alice));
  await addParticipant(db, eventId, bob, { role: "ORGANIZER" });
  await addParticipant(db, eventId, carol, { role: "GUEST", status: "MAYBE" });
  await addInvite(db, eventId, alice, { email: "paul@example.test" });
  await addInvite(db, eventId, alice, {
    email: "ines@example.test",
    response: "GOING",
    expiresAt: new Date("2020-01-01T00:00:00Z"),
  });
});

afterAll(async () => {
  await db.$disconnect();
});

describe("événements : liste des participants", () => {
  it("rend aux organisateurs les personnes par rôle puis par arrivée, et les invitations avec adresse", async () => {
    const seen = await participants(alice);
    expect(seen.counts).toEqual({ GOING: 3, MAYBE: 1, NOT_GOING: 0, PENDING: 1 });
    expect(seen.participants.map(({ name, role, status }) => [name, role, status])).toEqual([
      ["alice", "OWNER", "GOING"],
      ["bob", "ORGANIZER", "GOING"],
      ["carol", "GUEST", "MAYBE"],
    ]);
    expect(
      seen.invitations.map(({ email, response, linkExpired }) => [email, response, linkExpired]),
    ).toEqual([
      ["paul@example.test", "PENDING", false],
      ["ines@example.test", "GOING", true],
    ]);
  });

  it("rend aux invités les personnes mais jamais les adresses des invitations", async () => {
    const seen = await participants(carol);
    expect(seen.participants).toHaveLength(3);
    expect(seen.invitations).toEqual([]);
    expect(seen.counts).toEqual({ GOING: 3, MAYBE: 1, NOT_GOING: 0, PENDING: 1 });
  });

  it("ne rend que les comptes quand la liste des invités est masquée, aux invités comme aux membres de l'Espace", async () => {
    await db.event.update({ where: { id: eventId }, data: { isGuestListVisible: false } });
    const { id: spaceId } = await createSpace(db, alice, [dave], ["EVENTS"]);
    await db.event.update({ where: { id: eventId }, data: { spaceId } });
    for (const user of [carol, dave]) {
      const seen = await participants(user);
      expect(seen.participants).toEqual([]);
      expect(seen.invitations).toEqual([]);
      expect(seen.counts.GOING).toBe(3);
    }
    expect((await participants(bob)).participants).toHaveLength(3);
  });

  it("n'existe pas pour un étranger", async () => {
    await expect(participants(dave)).rejects.toMatchObject(notFound);
  });
});

describe("événements : rôles et retraits", () => {
  it("nomme puis retire un co-organisateur, propriétaire seulement", async () => {
    await call(event.setRole, { eventId, userId: carol.id, role: "ORGANIZER" }, asUser(db, alice));
    expect((await call(event.get, { eventId }, asUser(db, carol))).can.edit).toBe(true);
    await call(event.setRole, { eventId, userId: carol.id, role: "GUEST" }, asUser(db, alice));
    expect((await call(event.get, { eventId }, asUser(db, carol))).can.edit).toBe(false);
  });

  it("ne touche ni au propriétaire ni à soi-même, et pas à qui ne participe pas", async () => {
    await expect(
      call(event.setRole, { eventId, userId: alice.id, role: "GUEST" }, asUser(db, alice)),
    ).rejects.toMatchObject(forbidden);
    await expect(
      call(event.setRole, { eventId, userId: dave.id, role: "ORGANIZER" }, asUser(db, alice)),
    ).rejects.toMatchObject(notFound);
  });

  it("laisse le propriétaire retirer un co-organisateur ou un invité, la place se libère", async () => {
    await call(event.removeParticipant, { eventId, userId: bob.id }, asUser(db, alice));
    await call(event.removeParticipant, { eventId, userId: carol.id }, asUser(db, alice));
    expect(await db.eventParticipant.count({ where: { eventId } })).toBe(1);
    await expect(call(event.get, { eventId }, asUser(db, bob))).rejects.toMatchObject(notFound);
  });

  it("laisse un co-organisateur retirer un invité, pas le propriétaire ni un autre co-organisateur ni soi", async () => {
    await call(event.removeParticipant, { eventId, userId: carol.id }, asUser(db, bob));
    await expect(
      call(event.removeParticipant, { eventId, userId: alice.id }, asUser(db, bob)),
    ).rejects.toMatchObject(forbidden);
    await expect(
      call(event.removeParticipant, { eventId, userId: bob.id }, asUser(db, bob)),
    ).rejects.toMatchObject(forbidden);
    await addParticipant(db, eventId, dave, { role: "ORGANIZER" });
    await expect(
      call(event.removeParticipant, { eventId, userId: dave.id }, asUser(db, bob)),
    ).rejects.toMatchObject(forbidden);
  });

  it("refuse à un invité de retirer quiconque", async () => {
    await expect(
      call(event.removeParticipant, { eventId, userId: bob.id }, asUser(db, carol)),
    ).rejects.toMatchObject(forbidden);
  });
});
