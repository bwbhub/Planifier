import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createSpace, createTestUser } from "../todo/todo.testing";
import { addInvite, addParticipant, asUser, event, makeEvent } from "./events.testing";

// Événements : droits par rôle et par chemin d'accès (participant, e-mail, Espace). Base réelle.
const { db, reset } = createTestDatabase();

let alice: SessionUser;
let bob: SessionUser;
let carol: SessionUser;
let dave: SessionUser;
let erin: SessionUser;
let frank: SessionUser;
let eventId: string;
let version: number;

const notFound = { code: "NOT_FOUND" };
const forbidden = { code: "FORBIDDEN" };

/** Version actuelle : les écritures du test précédent la font avancer. */
async function currentVersion() {
  return (await db.event.findUniqueOrThrow({ where: { id: eventId }, select: { version: true } }))
    .version;
}

/** Appelle chaque procédure visant l'événement et rend le code d'erreur de chacune (ou « ok »). */
async function outcomes(user: SessionUser) {
  const ctx = asUser(db, user);
  const target = { eventId };
  const attempts = {
    get: () => call(event.get, target, ctx),
    update: async () =>
      call(event.update, { eventId, version: await currentVersion(), title: "Autre" }, ctx),
    setSpace: async () =>
      call(event.setSpace, { eventId, version: await currentVersion(), spaceId: null }, ctx),
    respond: () => call(event.respond, { eventId, status: "MAYBE" }, ctx),
    participants: () => call(event.participants, target, ctx),
    setRole: () => call(event.setRole, { eventId, userId: dave.id, role: "ORGANIZER" }, ctx),
    removeParticipant: () => call(event.removeParticipant, { eventId, userId: dave.id }, ctx),
    delete: () => call(event.delete, target, ctx),
  };
  const result: Record<string, string> = {};
  for (const [name, attempt] of Object.entries(attempts)) {
    result[name] = await attempt().then(
      () => "ok",
      (error: unknown) => (error instanceof Error && "code" in error ? String(error.code) : "?"),
    );
  }
  return result;
}

beforeEach(async () => {
  await reset();
  alice = await createTestUser(db, "alice");
  bob = await createTestUser(db, "bob");
  carol = await createTestUser(db, "carol");
  dave = await createTestUser(db, "dave");
  erin = await createTestUser(db, "erin");
  frank = await createTestUser(db, "frank");
  ({ id: eventId, version } = await makeEvent(db, alice));
  await addParticipant(db, eventId, bob, { role: "ORGANIZER" });
  await addParticipant(db, eventId, carol, { role: "GUEST", status: "PENDING" });
});

afterAll(async () => {
  await db.$disconnect();
});

describe("événements : droits par rôle", () => {
  it("laisse le propriétaire tout faire", async () => {
    // `dave` ne participe pas : les actions sur lui disent NOT_FOUND, ce qui prouve qu'elles sont permises.
    expect(await outcomes(alice)).toEqual({
      get: "ok",
      update: "ok",
      setSpace: "ok",
      respond: "ok",
      participants: "ok",
      setRole: "NOT_FOUND",
      removeParticipant: "NOT_FOUND",
      delete: "ok",
    });
  });

  it("laisse un co-organisateur modifier et retirer, sans supprimer, nommer ni changer l'Espace", async () => {
    expect(await outcomes(bob)).toEqual({
      get: "ok",
      update: "ok",
      setSpace: "FORBIDDEN",
      respond: "ok",
      participants: "ok",
      setRole: "FORBIDDEN",
      removeParticipant: "NOT_FOUND",
      delete: "FORBIDDEN",
    });
  });

  it("laisse un invité lire et répondre, rien de plus", async () => {
    expect(await outcomes(carol)).toEqual({
      get: "ok",
      update: "FORBIDDEN",
      setSpace: "FORBIDDEN",
      respond: "ok",
      participants: "ok",
      setRole: "FORBIDDEN",
      removeParticipant: "FORBIDDEN",
      delete: "FORBIDDEN",
    });
  });

  it("n'accorde rien à un étranger : l'événement n'existe pas pour lui", async () => {
    const gone = Object.fromEntries(
      [
        "get",
        "update",
        "setSpace",
        "respond",
        "participants",
        "setRole",
        "removeParticipant",
        "delete",
      ].map((name) => [name, "NOT_FOUND"]),
    );
    expect(await outcomes(dave)).toEqual(gone);
  });
});

describe("événements : accès sans participation", () => {
  it("laisse un invité par e-mail voir et répondre, sans plus", async () => {
    await addInvite(db, eventId, alice, { email: frank.email });
    expect(await outcomes(frank)).toMatchObject({
      get: "ok",
      respond: "ok",
      participants: "ok",
      update: "FORBIDDEN",
      setRole: "FORBIDDEN",
      delete: "FORBIDDEN",
    });
  });

  it("laisse un membre de l'Espace voir l'événement en lecture seule", async () => {
    const { id: spaceId } = await createSpace(db, alice, [erin], ["EVENTS"]);
    await call(event.setSpace, { eventId, version, spaceId }, asUser(db, alice));
    const seen = await call(event.get, { eventId }, asUser(db, erin));
    expect(seen.myRole).toBeNull();
    expect(seen.can).toEqual({
      edit: false,
      invite: false,
      propose: false,
      delete: false,
      react: false,
      comment: false,
      seeGuests: true,
      changeSpace: false,
    });
    await expect(
      call(event.respond, { eventId, status: "GOING" }, asUser(db, erin)),
    ).rejects.toMatchObject(forbidden);
  });

  it("cache l'événement aux membres d'un Espace qui restreint sa visibilité ou sans Événements", async () => {
    const { id: spaceId } = await createSpace(db, alice, [erin], ["EVENTS"]);
    await call(event.setSpace, { eventId, version, spaceId }, asUser(db, alice));
    await db.space.update({ where: { id: spaceId }, data: { restrictVisibility: true } });
    await expect(call(event.get, { eventId }, asUser(db, erin))).rejects.toMatchObject(notFound);
    await db.space.update({
      where: { id: spaceId },
      data: { restrictVisibility: false, modules: ["TODO"] },
    });
    await expect(call(event.get, { eventId }, asUser(db, erin))).rejects.toMatchObject(notFound);
  });
});
