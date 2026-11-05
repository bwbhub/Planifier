import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { router } from "../../router";
import { createSpace, createTestUser, requestAs } from "../todo/todo.testing";

// Agenda : droits, vue fusionnée, période, concurrence. Base réelle (`pnpm test:integration`).
const { db, reset } = createTestDatabase();
const { entries } = router.agenda;
const { lists, tasks } = router.todo;

let alice: SessionUser;
let bob: SessionUser;
let carol: SessionUser;
let spaceId: string;

const asUser = (user: SessionUser) => requestAs(db, user);
const forbidden = { code: "FORBIDDEN" };
const notFound = { code: "NOT_FOUND" };

const TIMED = {
  allDay: false,
  startsAt: new Date("2026-11-05T09:00:00Z"),
  endsAt: new Date("2026-11-05T10:00:00Z"),
} as const;

const WINDOW = {
  from: new Date("2026-11-02T00:00:00Z"),
  to: new Date("2026-11-09T00:00:00Z"),
  fromDay: "2026-11-02",
  toDay: "2026-11-08",
};

function createEntry(
  owner: SessionUser,
  fields: { hidden?: boolean; title?: string; participants?: string[] } = {},
) {
  return call(
    entries.create,
    { title: "Dentiste", tint: "general", when: TIMED, ...fields },
    asUser(owner),
  );
}

function createTimed(title: string, startsAt: string, endsAt: string) {
  const when = { allDay: false, startsAt: new Date(startsAt), endsAt: new Date(endsAt) } as const;
  return call(entries.create, { title, tint: "general", when }, asUser(alice));
}

function createAllDay(title: string, startDay: string, endDay: string) {
  const when = { allDay: true, startDay, endDay } as const;
  return call(entries.create, { title, tint: "general", when }, asUser(alice));
}

const titles = (items: readonly { title: string }[]) => items.map(({ title }) => title).sort();

beforeEach(async () => {
  await reset();
  alice = await createTestUser(db, "alice");
  bob = await createTestUser(db, "bob");
  carol = await createTestUser(db, "carol");
  ({ id: spaceId } = await createSpace(db, alice, [bob], ["AGENDA"]));
});

afterAll(async () => {
  await db.$disconnect();
});

describe("agenda : mes entrées (base réelle)", () => {
  it("crée et lit une entrée horaire et une entrée à la journée", async () => {
    const timed = await createEntry(alice);
    const allDay = await createAllDay("Week-end", "2026-11-07", "2026-11-08");
    expect(allDay.when).toEqual({ allDay: true, startDay: "2026-11-07", endDay: "2026-11-08" });
    await expect(call(entries.list, WINDOW, asUser(alice))).resolves.toEqual({
      items: [timed, allDay],
      nextCursor: null,
    });
  });

  it("garde une entrée à cheval sur la période et écarte celles d'à côté", async () => {
    await createTimed("À cheval", "2026-11-01T23:00:00Z", "2026-11-02T01:00:00Z");
    await createTimed("Finit au début", "2026-11-01T22:00:00Z", "2026-11-02T00:00:00Z");
    await createTimed("Commence à la fin", "2026-11-09T00:00:00Z", "2026-11-09T01:00:00Z");
    await createAllDay("Dernier jour", "2026-11-08", "2026-11-10");
    await createAllDay("Lendemain", "2026-11-09", "2026-11-09");
    const { items } = await call(entries.list, WINDOW, asUser(alice));
    expect(titles(items)).toEqual(["Dernier jour", "À cheval"]);
  });

  it("pagine les entrées de la période", async () => {
    const first = await createEntry(alice, { title: "Un" });
    const second = await createEntry(alice, { title: "Deux" });
    const page = await call(entries.list, { ...WINDOW, limit: 1 }, asUser(alice));
    expect(page).toEqual({ items: [first], nextCursor: first.id });
    await expect(
      call(entries.list, { ...WINDOW, cursor: first.id }, asUser(alice)),
    ).resolves.toEqual({ items: [second], nextCursor: null });
  });

  it("ne rend jamais les entrées d'un autre dans mon agenda", async () => {
    await createEntry(bob);
    await expect(call(entries.list, WINDOW, asUser(alice))).resolves.toMatchObject({ items: [] });
  });
});

describe("agenda : modifier et valider (base réelle)", () => {
  it("passe d'horaire à la journée sans rien laisser derrière", async () => {
    const entry = await createEntry(alice);
    const when = { allDay: true, startDay: "2026-11-05", endDay: "2026-11-05" } as const;
    const updated = await call(
      entries.update,
      { entryId: entry.id, version: entry.version, when, location: "Ici" },
      asUser(alice),
    );
    expect(updated).toMatchObject({ when, location: "Ici", version: entry.version + 1 });
    const cleared = await call(
      entries.update,
      { entryId: entry.id, version: updated.version, location: null },
      asUser(alice),
    );
    expect(cleared).toMatchObject({ when, location: null });
  });

  it("refuse une version périmée", async () => {
    const entry = await createEntry(alice);
    await call(
      entries.update,
      { entryId: entry.id, version: entry.version, title: "Un" },
      asUser(alice),
    );
    await expect(
      call(
        entries.update,
        { entryId: entry.id, version: entry.version, title: "Deux" },
        asUser(alice),
      ),
    ).rejects.toMatchObject({ code: "CONFLICT", data: { reason: "STALE_VERSION" } });
  });

  it("refuse une fin avant le début et une période trop longue", async () => {
    await expect(
      call(
        entries.create,
        {
          title: "Non",
          tint: "general",
          when: { allDay: false, startsAt: TIMED.endsAt, endsAt: TIMED.startsAt },
        },
        asUser(alice),
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      call(
        entries.list,
        { ...WINDOW, to: new Date("2027-11-09T00:00:00Z"), toDay: "2027-11-08" },
        asUser(alice),
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("garantit en base qu'une entrée a une seule forme", async () => {
    const entry = await createEntry(alice);
    await expect(
      db.agendaEntry.update({
        where: { id: entry.id },
        data: { startDay: new Date("2026-11-05T00:00:00Z") },
      }),
    ).rejects.toThrow();
  });

  it("n'importe pas deux fois la même source", async () => {
    const imported = {
      ownerId: alice.id,
      title: "Importée",
      startDay: new Date("2026-11-05T00:00:00Z"),
      endDay: new Date("2026-11-05T00:00:00Z"),
      source: "flux",
      sourceUid: "uid-1",
    };
    await db.agendaEntry.create({ data: imported });
    await expect(db.agendaEntry.create({ data: imported })).rejects.toThrow();
  });
});

describe("agenda : participants en texte libre (base réelle)", () => {
  it("remplace les participants, et `[]` les retire", async () => {
    const entry = await createEntry(alice, { participants: ["Marie"] });
    const updated = await call(
      entries.update,
      { entryId: entry.id, version: entry.version, participants: ["Léo", "Sarah"] },
      asUser(alice),
    );
    expect(updated.participants).toEqual(["Léo", "Sarah"]);
    const cleared = await call(
      entries.update,
      { entryId: entry.id, version: updated.version, participants: [] },
      asUser(alice),
    );
    expect(cleared.participants).toEqual([]);
  });

  it("refuse deux fois le même participant", async () => {
    await expect(createEntry(alice, { participants: ["Marie", "Marie"] })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});

describe("agenda : vue fusionnée d'un Espace (base réelle)", () => {
  it("montre titre, horaire, lieu, participants et nom des membres, rien de plus", async () => {
    const entry = await createEntry(alice, { participants: ["Marie", "Léo"] });
    const { items } = await call(entries.listInSpace, { ...WINDOW, spaceId }, asUser(bob));
    expect(items).toEqual([
      {
        id: entry.id,
        title: entry.title,
        location: null,
        participants: ["Marie", "Léo"],
        when: entry.when,
        owner: { userId: alice.id, name: "alice" },
      },
    ]);
  });

  it("cache entièrement une entrée masquée, même à son propriétaire", async () => {
    await createEntry(alice, { hidden: true });
    for (const user of [alice, bob]) {
      await expect(
        call(entries.listInSpace, { ...WINDOW, spaceId }, asUser(user)),
      ).resolves.toEqual({ items: [], nextCursor: null });
    }
  });

  it("ne montre pas qui n'est pas membre de l'Espace", async () => {
    await createEntry(carol);
    await expect(
      call(entries.listInSpace, { ...WINDOW, spaceId }, asUser(alice)),
    ).resolves.toMatchObject({ items: [] });
  });

  it("répond NOT_FOUND à qui n'est pas membre", async () => {
    await expect(
      call(entries.listInSpace, { ...WINDOW, spaceId }, asUser(carol)),
    ).rejects.toMatchObject(notFound);
  });

  it("refuse un Espace sans Agenda", async () => {
    const { id } = await createSpace(db, alice, [bob], ["TODO"]);
    await expect(
      call(entries.listInSpace, { ...WINDOW, spaceId: id }, asUser(alice)),
    ).rejects.toMatchObject({ code: "CONFLICT", data: { reason: "AGENDA_DISABLED" } });
  });

  it("ne montre à chacun que ses entrées quand l'Espace restreint sa visibilité", async () => {
    await db.space.update({ where: { id: spaceId }, data: { restrictVisibility: true } });
    await createEntry(alice, { title: "D'Alice" });
    await createEntry(bob, { title: "De Bob" });
    const { items } = await call(entries.listInSpace, { ...WINDOW, spaceId }, asUser(bob));
    expect(titles(items)).toEqual(["De Bob"]);
  });

  it("ne montre plus le membre parti, ni à lui les autres", async () => {
    await createEntry(alice);
    await createEntry(bob);
    await call(router.spaces.space.leave, { spaceId }, asUser(bob));
    const { items } = await call(entries.listInSpace, { ...WINDOW, spaceId }, asUser(alice));
    expect(items.map(({ owner }) => owner.userId)).toEqual([alice.id]);
    await expect(
      call(entries.listInSpace, { ...WINDOW, spaceId }, asUser(bob)),
    ).rejects.toMatchObject(notFound);
  });
});

describe("agenda : écrire dans l'entrée d'un autre (base réelle)", () => {
  it("répond FORBIDDEN au membre qui la voit", async () => {
    const entry = await createEntry(alice);
    await expect(
      call(entries.update, { entryId: entry.id, version: 1, title: "Non" }, asUser(bob)),
    ).rejects.toMatchObject(forbidden);
    await expect(call(entries.delete, { entryId: entry.id }, asUser(bob))).rejects.toMatchObject(
      forbidden,
    );
  });

  it.each([
    ["sans Espace commun", () => carol, false],
    ["sur une entrée masquée", () => bob, true],
  ])("répond NOT_FOUND %s", async (_, user, hidden) => {
    const entry = await createEntry(alice, { hidden });
    await expect(call(entries.delete, { entryId: entry.id }, asUser(user()))).rejects.toMatchObject(
      notFound,
    );
  });

  it("répond NOT_FOUND quand l'Espace commun restreint sa visibilité ou n'a pas Agenda", async () => {
    const entry = await createEntry(alice);
    await db.space.update({ where: { id: spaceId }, data: { restrictVisibility: true } });
    await expect(call(entries.delete, { entryId: entry.id }, asUser(bob))).rejects.toMatchObject(
      notFound,
    );
    await db.space.update({
      where: { id: spaceId },
      data: { restrictVisibility: false, modules: ["TODO"] },
    });
    await expect(call(entries.delete, { entryId: entry.id }, asUser(bob))).rejects.toMatchObject(
      notFound,
    );
  });

  it("laisse supprimer son entrée", async () => {
    const entry = await createEntry(alice);
    await call(entries.delete, { entryId: entry.id }, asUser(alice));
    await expect(call(entries.list, WINDOW, asUser(alice))).resolves.toMatchObject({ items: [] });
  });
});

describe("agenda : créneau lié à une tâche (base réelle)", () => {
  async function createTask(owner: SessionUser) {
    const list = await call(lists.create, { name: "Liste", tint: "general" }, asUser(owner));
    return call(tasks.create, { listId: list.id, title: "Tâche" }, asUser(owner));
  }

  it("lie une tâche sans jamais la cocher, et garde l'entrée si elle part", async () => {
    const task = await createTask(alice);
    const entry = await call(
      entries.create,
      { title: "Créneau", tint: "general", when: TIMED, taskId: task.id },
      asUser(alice),
    );
    expect(entry.taskId).toBe(task.id);
    await expect(
      db.task.findUniqueOrThrow({ where: { id: task.id }, select: { completedAt: true } }),
    ).resolves.toEqual({ completedAt: null });
    await call(tasks.delete, { taskId: task.id }, asUser(alice));
    await expect(call(entries.list, WINDOW, asUser(alice))).resolves.toMatchObject({
      items: [{ id: entry.id, taskId: null }],
    });
  });

  it("refuse la tâche d'un autre comme si elle n'existait pas", async () => {
    const task = await createTask(bob);
    await expect(
      call(
        entries.create,
        { title: "Créneau", tint: "general", when: TIMED, taskId: task.id },
        asUser(alice),
      ),
    ).rejects.toMatchObject(notFound);
    const entry = await createEntry(alice);
    await expect(
      call(entries.update, { entryId: entry.id, version: 1, taskId: task.id }, asUser(alice)),
    ).rejects.toMatchObject(notFound);
  });
});
