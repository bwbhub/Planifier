import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { TODO_LIST_MAX_TASKS } from "@planifier/constants/todo";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { router } from "../../router";
import { createList, createSpace, createTestUser, requestAs, WEEKLY } from "./todo.testing";

// Envoyer une tâche dans une autre liste : droits des deux listes, sous-tâches, assigné, bornes, versions. Base réelle.
const { db, reset } = createTestDatabase();
const { lists, tasks } = router.todo;

let alice: SessionUser;
let bob: SessionUser;
let spaceId: string;

const asUser = (user: SessionUser) => requestAs(db, user);
const notFound = { code: "NOT_FOUND" };
const forbidden = { code: "FORBIDDEN" };
const conflict = (reason: string) => ({ code: "CONFLICT", data: { reason } });

const move = (user: SessionUser, taskId: string, version: number, listId: string) =>
  call(tasks.move, { taskId, version, listId }, asUser(user));
const listOf = async (taskId: string) =>
  (await db.task.findUniqueOrThrow({ where: { id: taskId }, select: { listId: true } })).listId;

/** Deuxième liste perso d'Alice. */
const createOtherList = (user: SessionUser) =>
  call(lists.create, { name: "Boulot", tint: "work" }, asUser(user));

beforeEach(async () => {
  await reset();
  alice = await createTestUser(db, "alice");
  bob = await createTestUser(db, "bob");
  ({ id: spaceId } = await createSpace(db, alice, [bob]));
});

afterAll(async () => {
  await db.$disconnect();
});

describe("todo.tasks.move (base réelle)", () => {
  it("envoie la tâche et ses sous-tâches dans l'autre liste, version avancée", async () => {
    const from = await createList(db, alice);
    const to = await createOtherList(alice);
    const task = await call(tasks.create, { listId: from.id, title: "Voyage" }, asUser(alice));
    const child = await call(
      tasks.create,
      { listId: from.id, title: "Billets", parentId: task.id },
      asUser(alice),
    );

    const moved = await move(alice, task.id, task.version, to.id);

    expect(moved).toMatchObject({ id: task.id, listId: to.id, version: task.version + 1 });
    expect(await listOf(child.id)).toBe(to.id);
    expect((await call(tasks.list, { listId: from.id }, asUser(alice))).items).toEqual([]);
  });

  it("garde l'état de la tâche : cochée, échéance, répétition", async () => {
    const from = await createList(db, alice);
    const to = await createOtherList(alice);
    const task = await call(
      tasks.create,
      { listId: from.id, title: "Poubelles", dueDate: "2026-12-01", recurrence: WEEKLY },
      asUser(alice),
    );
    await call(tasks.setDone, { taskId: task.id, done: true }, asUser(alice));
    const done = (await call(tasks.list, { listId: from.id }, asUser(alice))).items[0];

    const moved = await move(alice, task.id, done?.version ?? 0, to.id);

    expect(moved.dueDate).toBe("2026-12-01");
    expect(moved.recurrence).toMatchObject(WEEKLY);
    expect(moved.completedAt).not.toBeNull();
    expect(moved.completedBy).toEqual({ userId: alice.id, name: "alice" });
  });

  it("est rejouable : déjà dans la liste, rien n'est écrit", async () => {
    const list = await createList(db, alice);
    const task = await call(tasks.create, { listId: list.id, title: "Pain" }, asUser(alice));

    const same = await move(alice, task.id, task.version, list.id);

    expect(same.version).toBe(task.version);
  });

  it("refuse une version périmée, sans rien déplacer", async () => {
    const from = await createList(db, alice);
    const to = await createOtherList(alice);
    const task = await call(tasks.create, { listId: from.id, title: "Pain" }, asUser(alice));
    await call(
      tasks.update,
      { taskId: task.id, version: task.version, title: "Pain complet" },
      asUser(alice),
    );

    await expect(move(alice, task.id, task.version, to.id)).rejects.toMatchObject(
      conflict("STALE_VERSION"),
    );
    expect(await listOf(task.id)).toBe(from.id);
  });
});

describe("todo.tasks.move : refus (base réelle)", () => {
  it("ne déplace pas une sous-tâche seule", async () => {
    const from = await createList(db, alice);
    const to = await createOtherList(alice);
    const task = await call(tasks.create, { listId: from.id, title: "Voyage" }, asUser(alice));
    const child = await call(
      tasks.create,
      { listId: from.id, title: "Billets", parentId: task.id },
      asUser(alice),
    );

    await expect(move(alice, child.id, child.version, to.id)).rejects.toMatchObject(
      conflict("SUBTASK_MOVE"),
    );
  });

  it("refuse une liste cible pleine, sous-tâches comprises", async () => {
    const from = await createList(db, alice);
    const to = await createOtherList(alice);
    const task = await call(tasks.create, { listId: from.id, title: "Voyage" }, asUser(alice));
    await call(
      tasks.create,
      { listId: from.id, title: "Billets", parentId: task.id },
      asUser(alice),
    );
    await db.task.createMany({
      data: Array.from({ length: TODO_LIST_MAX_TASKS - 1 }, (_, index) => ({
        title: `T${String(index)}`,
        listId: to.id,
      })),
    });

    await expect(move(alice, task.id, task.version, to.id)).rejects.toMatchObject(
      conflict("LIST_FULL"),
    );
    expect(await listOf(task.id)).toBe(from.id);
  });
});

describe("todo.tasks.move : droits et assigné (base réelle)", () => {
  it("liste cible d'un autre : NOT_FOUND ; en lecture seule : FORBIDDEN", async () => {
    const mine = await createList(db, bob);
    const task = await call(tasks.create, { listId: mine.id, title: "Pain" }, asUser(bob));
    const privateList = await createOtherList(alice);
    const shown = await call(
      lists.create,
      { name: "Cadeaux", tint: "general", readOnlySpaceId: spaceId },
      asUser(alice),
    );

    await expect(move(bob, task.id, task.version, privateList.id)).rejects.toMatchObject(notFound);
    await expect(move(bob, task.id, task.version, shown.id)).rejects.toMatchObject(forbidden);
    expect(await listOf(task.id)).toBe(mine.id);
  });

  it("tâche d'une liste en lecture seule : FORBIDDEN ; d'un autre : NOT_FOUND", async () => {
    const shown = await call(
      lists.create,
      { name: "Cadeaux", tint: "general", readOnlySpaceId: spaceId },
      asUser(alice),
    );
    const task = await call(tasks.create, { listId: shown.id, title: "Livre" }, asUser(alice));
    const bobs = await createList(db, bob);
    const carol = await createTestUser(db, "carol");

    await expect(move(bob, task.id, task.version, bobs.id)).rejects.toMatchObject(forbidden);
    await expect(move(carol, task.id, task.version, bobs.id)).rejects.toMatchObject(notFound);
  });

  it("retire l'assigné qui n'est pas membre de l'Espace de la cible, sous-tâches comprises", async () => {
    const shared = await call(
      lists.create,
      { name: "Courses", tint: "couple", spaceId },
      asUser(alice),
    );
    const personal = await createOtherList(alice);
    const task = await call(
      tasks.create,
      { listId: shared.id, title: "Pain", assigneeId: bob.id },
      asUser(alice),
    );
    const child = await call(
      tasks.create,
      { listId: shared.id, title: "Baguette", parentId: task.id, assigneeId: bob.id },
      asUser(alice),
    );

    const moved = await move(alice, task.id, task.version, personal.id);

    expect(moved.assignee).toBeNull();
    const row = await db.task.findUniqueOrThrow({ where: { id: child.id } });
    expect(row.assigneeId).toBeNull();
  });

  it("garde l'assigné qui est membre de l'Espace de la cible", async () => {
    const shared = await call(
      lists.create,
      { name: "Courses", tint: "couple", spaceId },
      asUser(alice),
    );
    const other = await call(
      lists.create,
      { name: "Maison", tint: "general", spaceId },
      asUser(alice),
    );
    const task = await call(
      tasks.create,
      { listId: shared.id, title: "Pain", assigneeId: bob.id },
      asUser(alice),
    );

    const moved = await move(alice, task.id, task.version, other.id);

    expect(moved.assignee).toEqual({ userId: bob.id, name: "bob" });
  });
});
