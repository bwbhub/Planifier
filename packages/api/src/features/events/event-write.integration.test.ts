import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createSpace, createTestUser } from "../todo/todo.testing";
import {
  addInvite,
  addParticipant,
  asUser,
  EVENING,
  event,
  makeEvent,
  WEEKEND,
} from "./events.testing";

// Événements : création, modification (messages « Changement »), Espace, suppression. Base réelle.
const { db, reset } = createTestDatabase();

let alice: SessionUser;
let bob: SessionUser;
let erin: SessionUser;

const conflict = (reason: string) => ({ code: "CONFLICT", data: { reason } });

const changes = (eventId: string) =>
  db.comment.findMany({
    where: { eventId, kind: "CHANGE" },
    orderBy: { id: "asc" },
    select: { change: true, text: true, isImportant: true, userId: true },
  });

beforeEach(async () => {
  await reset();
  alice = await createTestUser(db, "alice");
  bob = await createTestUser(db, "bob");
  erin = await createTestUser(db, "erin");
});

afterAll(async () => {
  await db.$disconnect();
});

describe("événements : création", () => {
  it("crée un événement personnel : le créateur en est le propriétaire et y va", async () => {
    const made = await makeEvent(db, alice, {
      location: "Chez Julien",
      description: "Un plat chacun",
    });
    expect(made).toMatchObject({
      title: "Anniversaire",
      location: "Chez Julien",
      description: "Un plat chacun",
      space: null,
      myRole: "OWNER",
      myStatus: "GOING",
      goingCount: 1,
      isGuestListVisible: true,
      allowGuestInvite: false,
      maxParticipants: null,
      isFull: false,
      owner: { name: "alice" },
      version: 1,
    });
    expect(made.when).toEqual(EVENING);
  });

  it("crée un événement à la journée sans dernier jour : un seul jour", async () => {
    const made = await makeEvent(db, alice, { when: { allDay: true, startDay: "2026-12-13" } });
    expect(made.when).toEqual({ allDay: true, startDay: "2026-12-13", endDay: "2026-12-13" });
  });

  it("garde le fait que la fin n'a pas été choisie", async () => {
    const when = {
      allDay: false,
      startsAt: new Date("2026-11-28T20:00:00Z"),
      endsAt: new Date("2026-11-29T00:00:00Z"),
      openEnd: true,
    } as const;
    expect((await makeEvent(db, alice, { when })).when).toEqual(when);
  });

  it("écrit la clé de tri : le début, ou minuit UTC du premier jour", async () => {
    const timed = await makeEvent(db, alice);
    const day = await makeEvent(db, alice, { when: WEEKEND });
    const keys = await db.event.findMany({
      where: { id: { in: [timed.id, day.id] } },
      select: { id: true, startKey: true },
    });
    expect(new Map(keys.map(({ id, startKey }) => [id, startKey.toISOString()]))).toEqual(
      new Map([
        [timed.id, "2026-11-22T19:30:00.000Z"],
        [day.id, "2026-12-13T00:00:00.000Z"],
      ]),
    );
  });

  it("rattache à un Espace dont on est membre avec Événements activé", async () => {
    const { id: spaceId } = await createSpace(db, alice, [bob], ["EVENTS"]);
    const made = await makeEvent(db, bob, { spaceId });
    expect(made.space).toEqual({ id: spaceId, name: "Coloc" });
  });

  it("refuse un Espace sans Événements (CONFLICT) et un Espace dont on n'est pas membre (NOT_FOUND)", async () => {
    const { id: todoOnly } = await createSpace(db, alice, [bob], ["TODO"]);
    await expect(makeEvent(db, bob, { spaceId: todoOnly })).rejects.toMatchObject(
      conflict("EVENTS_DISABLED"),
    );
    const { id: others } = await createSpace(db, alice, [], ["EVENTS"]);
    await expect(makeEvent(db, bob, { spaceId: others })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("événements : modification", () => {
  it("modifie les champs et fait avancer la version, sans message pour le titre ni les infos", async () => {
    const made = await makeEvent(db, alice);
    const updated = await call(
      event.update,
      {
        eventId: made.id,
        version: 1,
        title: "Nouveau titre",
        description: "Nouvelles infos",
        tint: "trip",
        maxParticipants: 12,
        allowGuestInvite: true,
      },
      asUser(db, alice),
    );
    expect(updated).toMatchObject({
      title: "Nouveau titre",
      description: "Nouvelles infos",
      tint: "trip",
      maxParticipants: 12,
      allowGuestInvite: true,
      version: 2,
    });
    expect(await changes(made.id)).toEqual([]);
  });

  it("efface la description, le lieu et les places avec null", async () => {
    const made = await makeEvent(db, alice, {
      location: "Chez Julien",
      description: "Infos",
      maxParticipants: 5,
    });
    const updated = await call(
      event.update,
      { eventId: made.id, version: 1, description: null, location: null, maxParticipants: null },
      asUser(db, alice),
    );
    expect(updated).toMatchObject({ description: null, location: null, maxParticipants: null });
  });
});

describe("événements : messages « Changement »", () => {
  it("écrit un message « Changement » par champ important modifié, signé par qui a modifié", async () => {
    const made = await makeEvent(db, alice, { location: "Chez Julien" });
    await addParticipant(db, made.id, bob, { role: "ORGANIZER" });
    await call(
      event.update,
      {
        eventId: made.id,
        version: 1,
        location: "Au parc",
        when: { allDay: true, startDay: "2026-12-13" },
      },
      asUser(db, bob),
    );
    const rows = await changes(made.id);
    expect(rows.map(({ change }) => change)).toEqual([
      {
        schemaVersion: 1,
        field: "when",
        from: {
          allDay: false,
          startsAt: "2026-11-22T19:30:00.000Z",
          endsAt: "2026-11-22T23:30:00.000Z",
          openEnd: false,
        },
        to: { allDay: true, startDay: "2026-12-13", endDay: "2026-12-13" },
      },
      { schemaVersion: 1, field: "location", from: "Chez Julien", to: "Au parc" },
    ]);
    expect(
      rows.every(
        ({ text, isImportant, userId }) => text === null && !isImportant && userId === bob.id,
      ),
    ).toBe(true);
  });

  it("n'écrit rien quand la date et le lieu sont renvoyés tels quels", async () => {
    const made = await makeEvent(db, alice, { location: "Chez Julien" });
    await call(
      event.update,
      { eventId: made.id, version: 1, location: "Chez Julien", when: EVENING, title: "Autre" },
      asUser(db, alice),
    );
    expect(await changes(made.id)).toEqual([]);
  });

  it("refuse une version périmée sans rien écrire, ni message", async () => {
    const made = await makeEvent(db, alice);
    await call(event.update, { eventId: made.id, version: 1, title: "Premier" }, asUser(db, alice));
    await expect(
      call(
        event.update,
        { eventId: made.id, version: 1, title: "Second", location: "Ailleurs" },
        asUser(db, alice),
      ),
    ).rejects.toMatchObject(conflict("STALE_VERSION"));
    expect(await changes(made.id)).toEqual([]);
    expect((await call(event.get, { eventId: made.id }, asUser(db, alice))).title).toBe("Premier");
  });
});

describe("événements : Espace et suppression", () => {
  it("rattache puis détache un événement, version à l'appui", async () => {
    const { id: spaceId } = await createSpace(db, alice, [bob], ["EVENTS"]);
    const made = await makeEvent(db, alice);
    const attached = await call(
      event.setSpace,
      { eventId: made.id, version: 1, spaceId },
      asUser(db, alice),
    );
    expect(attached).toMatchObject({ space: { id: spaceId }, version: 2 });
    const detached = await call(
      event.setSpace,
      { eventId: made.id, version: 2, spaceId: null },
      asUser(db, alice),
    );
    expect(detached).toMatchObject({ space: null, version: 3 });
    await expect(
      call(event.setSpace, { eventId: made.id, version: 2, spaceId }, asUser(db, alice)),
    ).rejects.toMatchObject(conflict("STALE_VERSION"));
  });

  it("refuse un Espace sans Événements ou dont le propriétaire n'est pas membre", async () => {
    const { id: todoOnly } = await createSpace(db, alice, [], ["TODO"]);
    const { id: others } = await createSpace(db, erin, [], ["EVENTS"]);
    const made = await makeEvent(db, alice);
    await expect(
      call(event.setSpace, { eventId: made.id, version: 1, spaceId: todoOnly }, asUser(db, alice)),
    ).rejects.toMatchObject(conflict("EVENTS_DISABLED"));
    await expect(
      call(event.setSpace, { eventId: made.id, version: 1, spaceId: others }, asUser(db, alice)),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("supprime l'événement avec participants, invitations et commentaires", async () => {
    const made = await makeEvent(db, alice);
    await addParticipant(db, made.id, bob, { role: "GUEST" });
    await addInvite(db, made.id, alice, { email: "visiteur@example.test" });
    await call(
      event.update,
      { eventId: made.id, version: 1, location: "Ailleurs" },
      asUser(db, alice),
    );
    await call(event.delete, { eventId: made.id }, asUser(db, alice));
    expect(await db.event.count()).toBe(0);
    expect(await db.eventParticipant.count()).toBe(0);
    expect(await db.invite.count()).toBe(0);
    expect(await db.comment.count()).toBe(0);
    await expect(call(event.get, { eventId: made.id }, asUser(db, bob))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
