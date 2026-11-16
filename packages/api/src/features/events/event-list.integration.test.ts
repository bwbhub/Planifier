import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createSpace, createTestUser } from "../todo/todo.testing";
import {
  addInvite,
  addParticipant,
  asUser,
  event,
  makeEvent,
  NOW,
  TODAY,
  WEEKEND,
} from "./events.testing";

// Événements : liste (visibilité, à venir ou passé, ordre, pages). Base réelle.
const { db, reset } = createTestDatabase();

let alice: SessionUser;
let bob: SessionUser;
let carol: SessionUser;
let dave: SessionUser;

const timed = (start: string, end: string, openEnd = false) =>
  ({ allDay: false, startsAt: new Date(start), endsAt: new Date(end), openEnd }) as const;
const allDay = (day: string) => ({ allDay: true, startDay: day, endDay: day }) as const;

function list(
  user: SessionUser,
  period: "upcoming" | "past",
  extra: { limit?: number; cursor?: string } = {},
) {
  return call(event.list, { period, now: NOW, today: TODAY, ...extra }, asUser(db, user));
}

const titles = (items: readonly { title: string }[]) => items.map(({ title }) => title);

beforeEach(async () => {
  await reset();
  alice = await createTestUser(db, "alice");
  bob = await createTestUser(db, "bob");
  carol = await createTestUser(db, "carol");
  dave = await createTestUser(db, "dave");
});

afterAll(async () => {
  await db.$disconnect();
});

describe("événements : à venir ou passé", () => {
  beforeEach(async () => {
    const make = (title: string, when: Parameters<typeof makeEvent>[2] = {}) =>
      makeEvent(db, alice, { title, ...when });
    await make("Passé horaire", { when: timed("2026-11-10T19:00:00Z", "2026-11-10T22:00:00Z") });
    await make("Passé journée", { when: allDay("2026-11-19") });
    await make("Journée du jour", { when: allDay(TODAY) });
    await make("En cours", { when: timed("2026-11-20T10:00:00Z", "2026-11-20T15:00:00Z") });
    await make("Soirée", {});
    await make("Sans fin choisie", {
      when: timed("2026-11-28T20:00:00Z", "2026-11-29T00:00:00Z", true),
    });
    await make("Week-end", { when: WEEKEND });
  });

  it("met à venir ce qui n'est pas fini, un événement en cours compris, le plus proche d'abord", async () => {
    const { items } = await list(alice, "upcoming");
    expect(titles(items)).toEqual([
      "Journée du jour",
      "En cours",
      "Soirée",
      "Sans fin choisie",
      "Week-end",
    ]);
  });

  it("met passé ce qui est fini, le plus récent d'abord", async () => {
    const { items } = await list(alice, "past");
    expect(titles(items)).toEqual(["Passé journée", "Passé horaire"]);
  });

  it("garde un événement qui finit à l'instant même dans les passés", async () => {
    await makeEvent(db, alice, {
      title: "Finit maintenant",
      when: timed("2026-11-20T11:00:00Z", NOW.toISOString()),
    });
    expect(titles((await list(alice, "past")).items)).toContain("Finit maintenant");
    expect(titles((await list(alice, "upcoming")).items)).not.toContain("Finit maintenant");
  });

  it("pagine par curseur sans trou ni doublon, dans les deux sens", async () => {
    for (const period of ["upcoming", "past"] as const) {
      const all = titles((await list(alice, period)).items);
      const seen: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await list(alice, period, {
          limit: 2,
          ...(cursor === undefined ? {} : { cursor }),
        });
        expect(page.items.length).toBeLessThanOrEqual(2);
        seen.push(...titles(page.items));
        cursor = page.nextCursor ?? undefined;
      } while (cursor !== undefined);
      expect(seen).toEqual(all);
    }
  });

  it("refuse un curseur fabriqué", async () => {
    await expect(list(alice, "upcoming", { cursor: "n'importe quoi" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("départage deux événements qui commencent au même instant par leur identifiant", async () => {
    await makeEvent(db, alice, { title: "Jumeau A" });
    await makeEvent(db, alice, { title: "Jumeau B" });
    const first = await list(alice, "upcoming", { limit: 4 });
    const second = await list(alice, "upcoming", { limit: 4, cursor: first.nextCursor ?? "" });
    const ids = [...first.items, ...second.items].map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("événements : ce que la liste montre", () => {
  it("montre ce où l'on participe, où l'on est invité par e-mail et ce que l'Espace montre, rien d'autre", async () => {
    const mine = await makeEvent(db, alice, { title: "Le mien" });
    const invited = await makeEvent(db, bob, { title: "Invitation" });
    await addInvite(db, invited.id, bob, { email: carol.email });
    const { id: spaceId } = await createSpace(db, bob, [carol], ["EVENTS"]);
    await makeEvent(db, bob, { title: "De l'Espace", spaceId });
    await makeEvent(db, bob, { title: "Privé de Bob" });
    expect(titles((await list(alice, "upcoming")).items)).toEqual(["Le mien"]);
    const seen = await list(carol, "upcoming");
    expect(titles(seen.items).sort()).toEqual(["De l'Espace", "Invitation"]);
    expect(seen.items.find(({ title }) => title === "Invitation")).toMatchObject({
      myRole: null,
      myStatus: "PENDING",
    });
    expect(seen.items.find(({ title }) => title === "De l'Espace")).toMatchObject({
      myRole: null,
      myStatus: null,
    });
    expect(mine.id).toBeDefined();
    expect(await list(dave, "upcoming")).toEqual({ items: [], nextCursor: null });
  });

  it("rend ma réponse et mon rôle, le nombre de personnes qui y vont et quelques noms", async () => {
    const made = await makeEvent(db, alice);
    await addParticipant(db, made.id, bob, { role: "GUEST", status: "GOING" });
    await addParticipant(db, made.id, carol, { role: "GUEST", status: "MAYBE" });
    await addInvite(db, made.id, alice, { email: "visiteur@example.test", response: "GOING" });
    const { items } = await list(bob, "upcoming");
    expect(items[0]).toMatchObject({
      myRole: "GUEST",
      myStatus: "GOING",
      goingCount: 3,
      owner: { name: "alice" },
    });
    expect(items[0]?.goingPreview.map(({ name }) => name).sort()).toEqual(["alice", "bob"]);
  });

  it("ne montre pas les noms à un invité quand la liste des invités est masquée, mais toujours aux organisateurs", async () => {
    const made = await makeEvent(db, alice, { isGuestListVisible: false });
    await addParticipant(db, made.id, bob, { role: "GUEST", status: "GOING" });
    expect((await list(bob, "upcoming")).items[0]).toMatchObject({
      goingCount: 2,
      goingPreview: [],
    });
    expect((await list(alice, "upcoming")).items[0]?.goingPreview).toHaveLength(2);
  });

  it("ne rend jamais plus de trois noms", async () => {
    const made = await makeEvent(db, alice);
    for (const name of ["bob", "carol", "dave"]) {
      const user = await db.user.findUniqueOrThrow({ where: { email: `${name}@example.test` } });
      await db.eventParticipant.create({
        data: { eventId: made.id, userId: user.id, role: "GUEST", status: "GOING" },
      });
    }
    const [first] = (await list(alice, "upcoming")).items;
    expect(first).toMatchObject({ goingCount: 4 });
    expect(first?.goingPreview).toHaveLength(3);
  });
});
