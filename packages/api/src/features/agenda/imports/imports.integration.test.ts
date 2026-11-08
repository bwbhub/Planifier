import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { router } from "../../../router";
import { createTestUser, requestAs } from "../../todo/todo.testing";
import { FeedFetchError } from "./feed-errors";
import type { ImportsDeps } from "./imports-deps";
import { testImportsDeps } from "./imports.testing";

// Agendas importés : droits, upsert sans doublon, secrets, délai entre lectures. Base réelle (`pnpm test:integration`).
const { db, reset } = createTestDatabase();
const { imports, entries } = router.agenda;

const LINK = "https://calendar.google.com/calendar/ical/abc/private-secret123/basic.ics";
const NOW = new Date("2026-11-08T12:00:00Z");

let alice: SessionUser;
let bob: SessionUser;
let clock: Date;
/** Flux servi au prochain appel ; une `FeedFetchError` simule un échec de lecture. */
let feed: string | FeedFetchError;

const deps = (): ImportsDeps =>
  testImportsDeps({
    now: () => clock,
    fetchFeed: () => (typeof feed === "string" ? Promise.resolve(feed) : Promise.reject(feed)),
  });
// Une même boîte à secrets pour tout le fichier : un lien chiffré à la création doit se rouvrir à l'actualisation.
const shared = deps();
const asUser = (user: SessionUser) => requestAs(db, user, { ...shared, now: () => clock });

const notFound = { code: "NOT_FOUND" };

function event(uid: string, summary: string, start = "20261110T090000Z", end = "20261110T100000Z") {
  return `BEGIN:VEVENT\r\nUID:${uid}\r\nSUMMARY:${summary}\r\nDTSTART:${start}\r\nDTEND:${end}\r\nEND:VEVENT`;
}
const calendar = (...events: string[]) =>
  ["BEGIN:VCALENDAR", "VERSION:2.0", ...events, "END:VCALENDAR", ""].join("\r\n");

const importedTitles = async (ownerId: string) =>
  (
    await db.agendaEntry.findMany({
      where: { ownerId, source: { not: null } },
      orderBy: { title: "asc" },
    })
  ).map((row) => row.title);

beforeEach(async () => {
  await reset();
  alice = await createTestUser(db, "alice");
  bob = await createTestUser(db, "bob");
  clock = NOW;
  feed = calendar(event("a@g", "Dentiste"), event("b@g", "Réunion"));
});

afterAll(async () => {
  await db.$disconnect();
});

describe("agenda.imports : création", () => {
  it("lit le lien, importe les entrées cachées de la vue fusionnée, et ne rend jamais le lien", async () => {
    const created = await call(imports.create, { label: "Google", url: LINK }, asUser(alice));

    expect(created).toMatchObject({ label: "Google", lastError: null, lastFetchedAt: NOW });
    expect(JSON.stringify(created)).not.toContain("secret123");
    expect(created.urlHint).toBe("calendar.google.com");
    expect(await importedTitles(alice.id)).toEqual(["Dentiste", "Réunion"]);
    const rows = await db.agendaEntry.findMany({ where: { ownerId: alice.id } });
    expect(rows.every((row) => row.hidden && row.source === `ical:${created.id}`)).toBe(true);
  });

  it("garde le lien chiffré en base, jamais en clair", async () => {
    await call(imports.create, { label: "Google", url: LINK }, asUser(alice));

    const stored = await db.calendarSubscription.findFirstOrThrow();
    expect(stored.urlEncrypted).not.toContain("google");
    expect(stored.urlEncrypted).not.toContain("secret123");
    expect(stored.urlHint).toBe("calendar.google.com");
  });

  it("n'enregistre rien quand le lien échoue, et dit pourquoi", async () => {
    feed = new FeedFetchError("FEED_UNREACHABLE");
    const failure = call(imports.create, { label: "x", url: LINK }, asUser(alice));

    await expect(failure).rejects.toMatchObject({
      code: "BAD_REQUEST",
      data: { reason: "FEED_UNREACHABLE" },
    });
    expect(await db.calendarSubscription.count()).toBe(0);
    expect(await db.agendaEntry.count()).toBe(0);
  });

  it("refuse ce qui n'est pas un agenda", async () => {
    feed = "<html>connexion</html>";

    await expect(
      call(imports.create, { label: "x", url: LINK }, asUser(alice)),
    ).rejects.toMatchObject({
      data: { reason: "FEED_UNREADABLE" },
    });
    expect(await db.calendarSubscription.count()).toBe(0);
  });

  it("limite le nombre d'agendas importés", async () => {
    for (let index = 0; index < 5; index += 1) {
      await call(imports.create, { label: `Agenda ${String(index)}`, url: LINK }, asUser(alice));
    }

    await expect(
      call(imports.create, { label: "6e", url: LINK }, asUser(alice)),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      data: { reason: "TOO_MANY_IMPORTS" },
    });
  });
});

describe("agenda.imports : actualisation", () => {
  async function createAndAge() {
    const created = await call(imports.create, { label: "Google", url: LINK }, asUser(alice));
    clock = new Date(NOW.getTime() + 120_000);
    return created;
  }

  it("met à jour sans doublon, crée les nouvelles et retire les disparues", async () => {
    const created = await createAndAge();
    const before = await db.agendaEntry.findFirstOrThrow({ where: { title: "Dentiste" } });
    feed = calendar(
      event("a@g", "Dentiste (déplacé)", "20261111T090000Z", "20261111T100000Z"),
      event("c@g", "Nouveau"),
    );

    await call(imports.refresh, { subscriptionId: created.id }, asUser(alice));

    expect(await importedTitles(alice.id)).toEqual(["Dentiste (déplacé)", "Nouveau"]);
    const after = await db.agendaEntry.findFirstOrThrow({ where: { sourceUid: "a@g" } });
    expect(after.id).toBe(before.id);
    expect(after.version).toBe(before.version + 1);
  });

  it("relue à l'identique, ne change rien", async () => {
    const created = await createAndAge();
    const before = await db.agendaEntry.findMany({ orderBy: { title: "asc" } });

    await call(imports.refresh, { subscriptionId: created.id }, asUser(alice));

    expect(await db.agendaEntry.findMany({ orderBy: { title: "asc" } })).toEqual(before);
  });

  it("ignore ce que Planifier a lui-même exporté", async () => {
    const created = await createAndAge();
    feed = calendar(event("a@g", "Dentiste"), event("zzz@planifier", "Renvoyé par Google"));

    await call(imports.refresh, { subscriptionId: created.id }, asUser(alice));

    expect(await importedTitles(alice.id)).toEqual(["Dentiste"]);
  });

  it("refuse une deuxième lecture dans la minute", async () => {
    const created = await call(imports.create, { label: "Google", url: LINK }, asUser(alice));
    clock = new Date(NOW.getTime() + 30_000);

    await expect(
      call(imports.refresh, { subscriptionId: created.id }, asUser(alice)),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      data: { reason: "REFRESH_TOO_SOON" },
    });
  });

  it("garde les entrées et note l'échec quand la source ne répond plus", async () => {
    const created = await createAndAge();
    feed = new FeedFetchError("FEED_TOO_LARGE");

    await expect(
      call(imports.refresh, { subscriptionId: created.id }, asUser(alice)),
    ).rejects.toMatchObject({
      data: { reason: "FEED_TOO_LARGE" },
    });

    expect(await importedTitles(alice.id)).toEqual(["Dentiste", "Réunion"]);
    const { items } = await call(imports.list, {}, asUser(alice));
    expect(items[0]).toMatchObject({ lastError: "FEED_TOO_LARGE" });
  });

  it("signale un lien enregistré illisible (autre clé)", async () => {
    const created = await call(imports.create, { label: "Google", url: LINK }, asUser(alice));
    clock = new Date(NOW.getTime() + 120_000);
    const otherKey = requestAs(db, alice, testImportsDeps({ now: () => clock }));

    await expect(
      call(imports.refresh, { subscriptionId: created.id }, otherKey),
    ).rejects.toMatchObject({
      data: { reason: "LINK_UNREADABLE" },
    });
  });
});

describe("agenda.imports : droits et suppression", () => {
  it("ne montre, n'actualise ni ne supprime l'agenda d'un autre : il n'existe pas pour lui", async () => {
    const created = await call(imports.create, { label: "Google", url: LINK }, asUser(alice));
    clock = new Date(NOW.getTime() + 120_000);

    expect((await call(imports.list, {}, asUser(bob))).items).toEqual([]);
    await expect(
      call(imports.refresh, { subscriptionId: created.id }, asUser(bob)),
    ).rejects.toMatchObject(notFound);
    await expect(
      call(imports.delete, { subscriptionId: created.id }, asUser(bob)),
    ).rejects.toMatchObject(notFound);
    expect(await db.calendarSubscription.count()).toBe(1);
    expect(await importedTitles(alice.id)).toHaveLength(2);
  });

  it("retire l'agenda et toutes ses entrées, sans toucher aux autres entrées", async () => {
    const created = await call(imports.create, { label: "Google", url: LINK }, asUser(alice));
    await call(
      entries.create,
      {
        title: "À moi",
        tint: "general",
        when: { allDay: true, startDay: "2026-11-10", endDay: "2026-11-10" },
      },
      asUser(alice),
    );

    await call(imports.delete, { subscriptionId: created.id }, asUser(alice));

    expect(await db.calendarSubscription.count()).toBe(0);
    expect((await db.agendaEntry.findMany()).map((row) => row.title)).toEqual(["À moi"]);
  });

  it("supprime l'agenda importé avec le compte", async () => {
    await call(imports.create, { label: "Google", url: LINK }, asUser(alice));

    await db.user.delete({ where: { id: alice.id } });

    expect(await db.calendarSubscription.count()).toBe(0);
    expect(await db.agendaEntry.count()).toBe(0);
  });

  it("rend les entrées importées en lecture seule : ni modification ni suppression", async () => {
    await call(imports.create, { label: "Google", url: LINK }, asUser(alice));
    const { items } = await call(
      entries.list,
      {
        from: new Date("2026-11-09T00:00:00Z"),
        to: new Date("2026-11-12T00:00:00Z"),
        fromDay: "2026-11-09",
        toDay: "2026-11-11",
      },
      asUser(alice),
    );
    const [entry] = items;

    expect(entry?.imported).toBe(true);
    const conflict = { code: "CONFLICT", data: { reason: "IMPORTED_ENTRY" } };
    await expect(
      call(entries.update, { entryId: entry?.id ?? "", version: 1, title: "Autre" }, asUser(alice)),
    ).rejects.toMatchObject(conflict);
    await expect(
      call(entries.delete, { entryId: entry?.id ?? "" }, asUser(alice)),
    ).rejects.toMatchObject(conflict);
  });
});
