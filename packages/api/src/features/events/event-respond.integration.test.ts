import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createTestUser } from "../todo/todo.testing";
import { addInvite, addParticipant, asUser, event, makeEvent } from "./events.testing";

// Événements : réponses (invité par e-mail, places, concurrence). Base réelle.
const { db, reset } = createTestDatabase();

let alice: SessionUser;
let bob: SessionUser;
let carol: SessionUser;
let dave: SessionUser;
let eventId: string;

const full = { code: "CONFLICT", data: { reason: "EVENT_FULL" } };

const respond = (user: SessionUser, status: "GOING" | "MAYBE" | "NOT_GOING") =>
  call(event.respond, { eventId, status }, asUser(db, user));

beforeEach(async () => {
  await reset();
  alice = await createTestUser(db, "alice");
  bob = await createTestUser(db, "bob");
  carol = await createTestUser(db, "carol");
  dave = await createTestUser(db, "dave");
  ({ id: eventId } = await makeEvent(db, alice));
});

afterAll(async () => {
  await db.$disconnect();
});

describe("événements : répondre", () => {
  it("change la réponse d'un participant, et le propriétaire répond aussi", async () => {
    await addParticipant(db, eventId, bob, { role: "GUEST", status: "PENDING" });
    await expect(respond(bob, "MAYBE")).resolves.toEqual({ myRole: "GUEST", myStatus: "MAYBE" });
    await expect(respond(alice, "NOT_GOING")).resolves.toEqual({
      myRole: "OWNER",
      myStatus: "NOT_GOING",
    });
    expect((await call(event.get, { eventId }, asUser(db, bob))).myStatus).toBe("MAYBE");
  });

  it("fait d'un invité par e-mail un participant à sa première réponse, l'invitation disparaît", async () => {
    await addInvite(db, eventId, alice, { email: carol.email });
    await expect(respond(carol, "GOING")).resolves.toEqual({ myRole: "GUEST", myStatus: "GOING" });
    expect(await db.invite.count()).toBe(0);
    expect(
      await db.eventParticipant.count({ where: { eventId, userId: carol.id, status: "GOING" } }),
    ).toBe(1);
    expect((await call(event.get, { eventId }, asUser(db, carol))).goingCount).toBe(2);
  });

  it("reprend la réponse donnée sans compte par le lien, et ne la compte qu'une fois", async () => {
    const invite = await addInvite(db, eventId, alice, { email: carol.email, response: "GOING" });
    const seen = await call(event.get, { eventId }, asUser(db, carol));
    expect(seen).toMatchObject({ myStatus: "GOING", goingCount: 2 });
    await respond(carol, "GOING");
    expect(await db.invite.findUnique({ where: { id: invite.id } })).toBeNull();
    expect((await call(event.get, { eventId }, asUser(db, carol))).goingCount).toBe(2);
  });

  it("refuse à qui n'est ni participant ni invité (NOT_FOUND)", async () => {
    await expect(respond(dave, "GOING")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("ne reconnaît pas une invitation faite à une autre adresse", async () => {
    await addInvite(db, eventId, alice, { email: "autre@example.test" });
    await expect(respond(carol, "GOING")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("événements : places", () => {
  beforeEach(async () => {
    await call(event.update, { eventId, version: 1, maxParticipants: 2 }, asUser(db, alice));
    await addParticipant(db, eventId, bob, { role: "GUEST", status: "PENDING" });
    await addParticipant(db, eventId, carol, { role: "GUEST", status: "PENDING" });
  });

  it("refuse « J'y vais » quand l'événement est complet, pas « Peut-être » ni « Non »", async () => {
    await respond(bob, "GOING");
    expect(await call(event.get, { eventId }, asUser(db, carol))).toMatchObject({
      isFull: true,
      goingCount: 2,
    });
    await expect(respond(carol, "GOING")).rejects.toMatchObject(full);
    await expect(respond(carol, "MAYBE")).resolves.toMatchObject({ myStatus: "MAYBE" });
    await expect(respond(carol, "NOT_GOING")).resolves.toMatchObject({ myStatus: "NOT_GOING" });
  });

  it("garde sa place à qui y allait déjà, même plafond abaissé", async () => {
    await respond(bob, "GOING");
    await call(event.update, { eventId, version: 2, maxParticipants: 1 }, asUser(db, alice));
    await expect(respond(bob, "GOING")).resolves.toMatchObject({ myStatus: "GOING" });
  });

  it("libère la place quand quelqu'un répond autre chose", async () => {
    await respond(bob, "GOING");
    await respond(alice, "MAYBE");
    await expect(respond(carol, "GOING")).resolves.toMatchObject({ myStatus: "GOING" });
  });

  it("compte les invités sans compte qui y vont par leur lien", async () => {
    await addInvite(db, eventId, alice, { email: "visiteur@example.test", response: "GOING" });
    expect((await call(event.get, { eventId }, asUser(db, bob))).isFull).toBe(true);
    await expect(respond(bob, "GOING")).rejects.toMatchObject(full);
  });

  it("ne dépasse jamais les places quand deux réponses arrivent en même temps", async () => {
    await respond(alice, "NOT_GOING");
    await call(event.update, { eventId, version: 2, maxParticipants: 1 }, asUser(db, alice));
    const results = await Promise.allSettled([respond(bob, "GOING"), respond(carol, "GOING")]);
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(await db.eventParticipant.count({ where: { eventId, status: "GOING" } })).toBe(1);
  });
});
