import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { TODAY_SECTION_MAX } from "@planifier/constants/todo";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { router } from "../../router";
import { createList, createSpace, createTestUser, requestAs } from "./todo.testing";

// Tâches de l'écran Aujourd'hui : droits (listes perso, assignées dans une liste partagée) et bornes. Base réelle.
const { db, reset } = createTestDatabase();
const { lists, tasks } = router.todo;

const TODAY = "2026-11-10";

let alice: SessionUser;
let bob: SessionUser;
let carol: SessionUser;
let spaceId: string;

const asUser = (user: SessionUser) => requestAs(db, user);
const today = (user: SessionUser) => call(tasks.today, { date: TODAY }, asUser(user));
const titles = (items: { title: string }[]) => items.map(({ title }) => title);

beforeEach(async () => {
  await reset();
  alice = await createTestUser(db, "alice");
  bob = await createTestUser(db, "bob");
  carol = await createTestUser(db, "carol");
  ({ id: spaceId } = await createSpace(db, alice, [bob]));
});

afterAll(async () => {
  await db.$disconnect();
});

describe("todo.tasks.today : sections (base réelle)", () => {
  it("range les tâches : du jour (par heure), en cours (sans date), en retard (la plus ancienne d'abord)", async () => {
    const list = await createList(db, alice);
    const add = (title: string, dueDate?: string, dueTime?: string) =>
      call(tasks.create, { listId: list.id, title, dueDate, dueTime }, asUser(alice));
    await add("Sans heure", TODAY);
    await add("Soir", TODAY, "18:00");
    await add("Matin", TODAY, "09:00");
    await add("En cours");
    await add("Hier", "2026-11-09");
    await add("Avant-hier", "2026-11-08");
    await add("Demain", "2026-11-11");

    const result = await today(alice);
    expect(titles(result.dueToday.items)).toEqual(["Matin", "Soir", "Sans heure"]);
    expect(titles(result.ongoing.items)).toEqual(["En cours"]);
    expect(titles(result.overdue.items)).toEqual(["Avant-hier", "Hier"]);
    expect(result.overdue.total).toBe(2);
    expect(result.dueToday.items[0]?.list).toMatchObject({ id: list.id, name: "Maison" });
  });

  it("laisse de côté les tâches cochées et les sous-tâches", async () => {
    const list = await createList(db, alice);
    const done = await call(tasks.create, { listId: list.id, title: "Faite" }, asUser(alice));
    await call(tasks.setDone, { taskId: done.id, done: true }, asUser(alice));
    const parent = await call(tasks.create, { listId: list.id, title: "Parent" }, asUser(alice));
    await call(
      tasks.create,
      { listId: list.id, parentId: parent.id, title: "Sous-tâche" },
      asUser(alice),
    );
    expect(titles((await today(alice)).ongoing.items)).toEqual(["Parent"]);
  });

  it("borne chaque section et dit le total", async () => {
    const list = await createList(db, alice);
    for (let index = 0; index < TODAY_SECTION_MAX + 3; index += 1) {
      await call(tasks.create, { listId: list.id, title: `T${String(index)}` }, asUser(alice));
    }
    const { ongoing } = await today(alice);
    expect(ongoing.items).toHaveLength(TODAY_SECTION_MAX);
    expect(ongoing.total).toBe(TODAY_SECTION_MAX + 3);
  });
});

describe("todo.tasks.today : droits (base réelle)", () => {
  it("ne montre que mes listes perso : jamais celles des autres, ni même montrées en lecture seule", async () => {
    const mine = await createList(db, alice);
    await call(tasks.create, { listId: mine.id, title: "À moi" }, asUser(alice));
    const theirs = await createList(db, bob);
    await call(tasks.create, { listId: theirs.id, title: "À Bob" }, asUser(bob));
    await call(
      lists.update,
      { listId: theirs.id, version: theirs.version, readOnlySpaceId: spaceId },
      asUser(bob),
    );
    expect(titles((await today(alice)).ongoing.items)).toEqual(["À moi"]);
  });

  it("montre, dans une liste partagée, les tâches assignées à moi seulement", async () => {
    const shared = await call(
      lists.create,
      { name: "Vacances", tint: "couple", spaceId },
      asUser(alice),
    );
    const add = (title: string, assigneeId?: string) =>
      call(tasks.create, { listId: shared.id, title, assigneeId }, asUser(alice));
    await add("Pour Bob", bob.id);
    await add("Pour Alice", alice.id);
    await add("Pour personne");

    const forBob = await today(bob);
    expect(titles(forBob.ongoing.items)).toEqual(["Pour Bob"]);
    expect(forBob.ongoing.items[0]?.assignee).toEqual({ userId: bob.id, name: bob.name });
    expect(forBob.ongoing.items[0]?.list).toMatchObject({ id: shared.id, name: "Vacances" });
    expect(titles((await today(alice)).ongoing.items)).toEqual(["Pour Alice"]);
  });

  it("ne montre rien d'une liste partagée à quelqu'un qui n'est pas de l'Espace", async () => {
    const shared = await call(
      lists.create,
      { name: "Vacances", tint: "couple", spaceId },
      asUser(alice),
    );
    await call(
      tasks.create,
      { listId: shared.id, title: "Pour Alice", assigneeId: alice.id },
      asUser(alice),
    );
    const result = await today(carol);
    expect(result.ongoing).toEqual({ items: [], total: 0 });
    expect(result.dueToday.total + result.overdue.total).toBe(0);
  });
});
