import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { TODO_LIST_MAX_TASKS, TODO_MAX_LISTS } from "@planifier/constants/todo";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { ApiContext } from "../../procedures";
import { createRateLimiter, PLAN_RATE_LIMIT } from "../../rate-limit";
import { router } from "../../router";

// Base réelle dédiée en `_test` (`createTestDatabase`), vidée avant chaque test. Lancement : `pnpm test:integration`.
const { db, reset } = createTestDatabase();
const { lists, tasks } = router.todo;

let alice: SessionUser;
let bob: SessionUser;

/** Contexte d'une requête de `user` (null : sans session) ; limiteur neuf, aucun état partagé. */
function asUser(user: SessionUser | null): { context: ApiContext } {
  return {
    context: {
      requestId: "test",
      clientIp: "192.0.2.1",
      consumeRateLimit: createRateLimiter(PLAN_RATE_LIMIT),
      getSessionUser: () => Promise.resolve(user),
      getDb: () => db,
    },
  };
}

async function createUser(name: string): Promise<SessionUser> {
  return db.user.create({
    data: { name, email: `${name}@example.test`, emailVerified: true },
    select: { id: true, name: true, email: true, preferredTheme: true },
  });
}

const createAliceList = () =>
  call(lists.create, { name: "Maison", tint: "general" }, asUser(alice));

async function createAliceTask() {
  const list = await createAliceList();
  const task = await call(tasks.create, { listId: list.id, title: "Courses" }, asUser(alice));
  return { list, task };
}

beforeEach(async () => {
  await reset();
  alice = await createUser("alice");
  bob = await createUser("bob");
});

afterAll(async () => {
  await db.$disconnect();
});

describe("todo.lists (base réelle)", () => {
  it("crée une liste et la rend à son propriétaire seulement", async () => {
    const list = await createAliceList();
    expect(list).toMatchObject({ name: "Maison", tint: "general", version: 1, openTaskCount: 0 });
    await expect(call(lists.list, {}, asUser(alice))).resolves.toEqual({ items: [list] });
    await expect(call(lists.list, {}, asUser(bob))).resolves.toEqual({ items: [] });
  });

  it("compte les tâches non cochées", async () => {
    const { list, task } = await createAliceTask();
    await call(tasks.create, { listId: list.id, title: "Linge" }, asUser(alice));
    await call(tasks.setDone, { taskId: task.id, done: true }, asUser(alice));
    const { items } = await call(lists.list, {}, asUser(alice));
    expect(items[0]?.openTaskCount).toBe(1);
  });

  it("modifie nom et teinte, puis refuse une version périmée", async () => {
    const list = await createAliceList();
    const updated = await call(
      lists.update,
      { listId: list.id, version: 1, name: "Chez nous", tint: "couple" },
      asUser(alice),
    );
    expect(updated).toMatchObject({ name: "Chez nous", tint: "couple", version: 2 });
    await expect(
      call(lists.update, { listId: list.id, version: 1, name: "Autre" }, asUser(alice)),
    ).rejects.toMatchObject({ code: "CONFLICT", data: { reason: "STALE_VERSION" } });
  });

  it("supprime une liste avec ses tâches", async () => {
    const { list, task } = await createAliceTask();
    await expect(call(lists.delete, { listId: list.id }, asUser(alice))).resolves.toEqual({});
    await expect(db.task.findUnique({ where: { id: task.id } })).resolves.toBeNull();
  });

  it("refuse une liste de plus que la borne", async () => {
    await db.todoList.createMany({
      data: Array.from({ length: TODO_MAX_LISTS }, (_, index) => ({
        name: `Liste ${String(index)}`,
        ownerId: alice.id,
      })),
    });
    await expect(createAliceList()).rejects.toMatchObject({
      code: "CONFLICT",
      data: { reason: "TOO_MANY_LISTS" },
    });
  });
});

describe("todo.tasks (base réelle)", () => {
  it("crée une tâche avec description et échéance, au jour près", async () => {
    const list = await createAliceList();
    const task = await call(
      tasks.create,
      { listId: list.id, title: " Facture ", description: "  ", dueDate: "2026-11-05" },
      asUser(alice),
    );
    expect(task).toMatchObject({
      title: "Facture",
      description: null,
      dueDate: "2026-11-05",
      completedAt: null,
      version: 1,
    });
  });

  it("liste les tâches à faire d'abord, puis les cochées", async () => {
    const { list, task } = await createAliceTask();
    const second = await call(tasks.create, { listId: list.id, title: "Linge" }, asUser(alice));
    await call(tasks.setDone, { taskId: task.id, done: true }, asUser(alice));
    const { items } = await call(tasks.list, { listId: list.id }, asUser(alice));
    expect(items.map(({ id }) => id)).toEqual([second.id, task.id]);
  });

  it("cocher est rejouable et garde la date de la première coche ; décocher l'efface", async () => {
    const { task } = await createAliceTask();
    const first = await call(tasks.setDone, { taskId: task.id, done: true }, asUser(alice));
    const again = await call(tasks.setDone, { taskId: task.id, done: true }, asUser(alice));
    expect(first.completedAt).toBeInstanceOf(Date);
    expect(again.completedAt).toEqual(first.completedAt);
    // Cocher ne périme pas une modification en cours.
    expect(again.version).toBe(task.version);
    const undone = await call(tasks.setDone, { taskId: task.id, done: false }, asUser(alice));
    expect(undone.completedAt).toBeNull();
  });

  it("modifie, efface l'échéance, puis refuse une version périmée", async () => {
    const list = await createAliceList();
    const task = await call(
      tasks.create,
      { listId: list.id, title: "Courses", dueDate: "2026-11-01" },
      asUser(alice),
    );
    const updated = await call(
      tasks.update,
      { taskId: task.id, version: 1, title: "Grosses courses", dueDate: null },
      asUser(alice),
    );
    expect(updated).toMatchObject({ title: "Grosses courses", dueDate: null, version: 2 });
    await expect(
      call(tasks.update, { taskId: task.id, version: 1, title: "Autre" }, asUser(alice)),
    ).rejects.toMatchObject({ code: "CONFLICT", data: { reason: "STALE_VERSION" } });
  });

  it("supprime une tâche", async () => {
    const { list, task } = await createAliceTask();
    await expect(call(tasks.delete, { taskId: task.id }, asUser(alice))).resolves.toEqual({});
    await expect(call(tasks.list, { listId: list.id }, asUser(alice))).resolves.toEqual({
      items: [],
    });
  });

  it("refuse une tâche de plus que la borne", async () => {
    const list = await createAliceList();
    await db.task.createMany({
      data: Array.from({ length: TODO_LIST_MAX_TASKS }, (_, index) => ({
        listId: list.id,
        title: `Tâche ${String(index)}`,
      })),
    });
    await expect(
      call(tasks.create, { listId: list.id, title: "Une de trop" }, asUser(alice)),
    ).rejects.toMatchObject({ code: "CONFLICT", data: { reason: "LIST_FULL" } });
  });
});

describe("todo : droits (base réelle)", () => {
  it("sans session : UNAUTHORIZED", async () => {
    await expect(call(lists.list, {}, asUser(null))).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("la liste d'un autre n'existe pas : NOT_FOUND sur chaque procédure gardée", async () => {
    const { list, task } = await createAliceTask();
    const asBob = asUser(bob);
    const attempts = [
      call(lists.update, { listId: list.id, version: 1, name: "Pris" }, asBob),
      call(lists.delete, { listId: list.id }, asBob),
      call(tasks.list, { listId: list.id }, asBob),
      call(tasks.create, { listId: list.id, title: "Intrus" }, asBob),
      call(tasks.update, { taskId: task.id, version: 1, title: "Pris" }, asBob),
      call(tasks.setDone, { taskId: task.id, done: true }, asBob),
      call(tasks.delete, { taskId: task.id }, asBob),
    ];
    for (const attempt of attempts) {
      await expect(attempt).rejects.toMatchObject({ code: "NOT_FOUND" });
    }
    // Rien n'a changé.
    await expect(call(tasks.list, { listId: list.id }, asUser(alice))).resolves.toEqual({
      items: [task],
    });
  });

  it("liste ou tâche inconnue : NOT_FOUND", async () => {
    const unknown = "00000000-0000-7000-8000-000000000999";
    await expect(call(tasks.list, { listId: unknown }, asUser(alice))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      call(tasks.setDone, { taskId: unknown, done: true }, asUser(alice)),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
