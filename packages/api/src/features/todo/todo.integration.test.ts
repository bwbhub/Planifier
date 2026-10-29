import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { TODO_LIST_MAX_TASKS, TODO_MAX_LISTS } from "@planifier/constants/todo";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { router } from "../../router";
import { updateList } from "./lists/lists.service";
import { updateTask } from "./tasks/tasks.service";
import {
  createList,
  createListWithTask,
  createTestUser,
  requestAs,
  WEEKLY as weekly,
} from "./todo.testing";

// Base réelle dédiée en `_test` (`createTestDatabase`), vidée avant chaque test. Lancement : `pnpm test:integration`.
const { db, reset } = createTestDatabase();
const { lists, tasks } = router.todo;

let alice: SessionUser;
let bob: SessionUser;

const asUser = (user: SessionUser | null) => requestAs(db, user);
const createAliceList = () => createList(db, alice);
const createAliceTask = () => createListWithTask(db, alice);

beforeEach(async () => {
  await reset();
  alice = await createTestUser(db, "alice");
  bob = await createTestUser(db, "bob");
});

afterAll(async () => {
  await db.$disconnect();
});

describe("todo.lists (base réelle)", () => {
  it("crée une liste et la rend à son propriétaire seulement", async () => {
    const list = await createAliceList();
    expect(list).toMatchObject({
      name: "Maison",
      tint: "general",
      version: 1,
      openTaskCount: 0,
      space: null,
      can: { delete: true, share: true },
    });
    await expect(call(lists.list, {}, asUser(alice))).resolves.toEqual({
      items: [list],
      nextCursor: null,
    });
    await expect(call(lists.list, {}, asUser(bob))).resolves.toEqual({
      items: [],
      nextCursor: null,
    });
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
  it("crée une tâche nettoyée, avec description et échéance au jour près", async () => {
    const list = await createAliceList();
    const task = await call(
      tasks.create,
      { listId: list.id, title: " Facture ", description: " Avant le 5 ", dueDate: "2026-11-05" },
      asUser(alice),
    );
    expect(task).toMatchObject({
      title: "Facture",
      description: "Avant le 5",
      dueDate: "2026-11-05",
      completedAt: null,
      version: 1,
    });
  });

  it("liste les tâches par ordre de création, cochées comprises", async () => {
    const { list, task } = await createAliceTask();
    const second = await call(tasks.create, { listId: list.id, title: "Linge" }, asUser(alice));
    await call(tasks.setDone, { taskId: task.id, done: true }, asUser(alice));
    const { items } = await call(tasks.list, { listId: list.id }, asUser(alice));
    expect(items.map(({ id }) => id)).toEqual([task.id, second.id]);
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

describe("todo.tasks : sous-tâches (base réelle)", () => {
  it("crée une sous-tâche, cochée indépendamment de son parent", async () => {
    const { list, task } = await createAliceTask();
    const subtask = await call(
      tasks.create,
      { listId: list.id, parentId: task.id, title: "Pain" },
      asUser(alice),
    );
    expect(subtask.parentId).toBe(task.id);
    await call(tasks.setDone, { taskId: subtask.id, done: true }, asUser(alice));
    const { items } = await call(tasks.list, { listId: list.id }, asUser(alice));
    // Rien n'est coché d'office : le parent reste à faire.
    expect(items.find(({ id }) => id === task.id)?.completedAt).toBeNull();
  });

  it("ne compte pas les sous-tâches dans les tâches à faire de la liste", async () => {
    const { list, task } = await createAliceTask();
    await call(tasks.create, { listId: list.id, parentId: task.id, title: "Pain" }, asUser(alice));
    const { items } = await call(lists.list, {}, asUser(alice));
    expect(items[0]?.openTaskCount).toBe(1);
  });

  it("refuse un deuxième niveau : CONFLICT NESTED_SUBTASK", async () => {
    const { list, task } = await createAliceTask();
    const subtask = await call(
      tasks.create,
      { listId: list.id, parentId: task.id, title: "Pain" },
      asUser(alice),
    );
    await expect(
      call(
        tasks.create,
        { listId: list.id, parentId: subtask.id, title: "Baguette" },
        asUser(alice),
      ),
    ).rejects.toMatchObject({ code: "CONFLICT", data: { reason: "NESTED_SUBTASK" } });
  });

  it("refuse un parent d'une autre liste : NOT_FOUND", async () => {
    const { task } = await createAliceTask();
    const other = await call(lists.create, { name: "Autre", tint: "trip" }, asUser(alice));
    await expect(
      call(tasks.create, { listId: other.id, parentId: task.id, title: "Égarée" }, asUser(alice)),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("refuse en parent la tâche de quelqu'un d'autre : NOT_FOUND, rien n'est créé", async () => {
    const { task } = await createAliceTask();
    const bobList = await call(lists.create, { name: "Bob", tint: "trip" }, asUser(bob));
    await expect(
      call(tasks.create, { listId: bobList.id, parentId: task.id, title: "Intrus" }, asUser(bob)),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(db.task.count({ where: { parentId: task.id } })).resolves.toBe(0);
  });

  it("supprime les sous-tâches avec leur parent", async () => {
    const { list, task } = await createAliceTask();
    const subtask = await call(
      tasks.create,
      { listId: list.id, parentId: task.id, title: "Pain" },
      asUser(alice),
    );
    await call(tasks.delete, { taskId: task.id }, asUser(alice));
    await expect(db.task.findUnique({ where: { id: subtask.id } })).resolves.toBeNull();
  });
});

describe("todo : supprimée entre la garde et l'écriture (base réelle)", () => {
  // Services appelés directement : la garde est passée, puis la ressource disparaît.
  it("modifier une liste supprimée : NOT_FOUND, pas une version périmée", async () => {
    const list = await createAliceList();
    await db.todoList.delete({ where: { id: list.id } });
    await expect(
      updateList(db, alice.id, { listId: list.id, version: 1, name: "Trop tard" }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("modifier une tâche supprimée : NOT_FOUND, pas une version périmée", async () => {
    const { task } = await createAliceTask();
    await db.task.delete({ where: { id: task.id } });
    await expect(
      updateTask(db, { taskId: task.id, version: 1, title: "Trop tard" }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

// Matrice : sans session, autre utilisateur, propriétaire (les tests ci-dessus). Pas de cas « visible mais action
// refusée » (FORBIDDEN) : les listes sont perso, seul le propriétaire les voit ; il viendra avec le partage.
describe("todo : droits (base réelle)", () => {
  it("sans session : UNAUTHORIZED sur chaque procédure", async () => {
    const { list, task } = await createAliceTask();
    const anonymous = asUser(null);
    const attempts = [
      call(lists.list, {}, anonymous),
      call(lists.create, { name: "Intrus", tint: "general" }, anonymous),
      call(lists.update, { listId: list.id, version: 1, name: "Pris" }, anonymous),
      call(lists.delete, { listId: list.id }, anonymous),
      call(tasks.list, { listId: list.id }, anonymous),
      call(tasks.create, { listId: list.id, title: "Intrus" }, anonymous),
      call(tasks.update, { taskId: task.id, version: 1, title: "Pris" }, anonymous),
      call(tasks.setDone, { taskId: task.id, done: true }, anonymous),
      call(
        tasks.completeOccurrence,
        { taskId: task.id, version: 1, today: "2026-10-28" },
        anonymous,
      ),
      call(tasks.finish, { taskId: task.id, version: 1 }, anonymous),
      call(
        tasks.undoCompletion,
        { taskId: task.id, version: 1, dueDate: null, recurrence: weekly },
        anonymous,
      ),
      call(tasks.delete, { taskId: task.id }, anonymous),
    ];
    for (const attempt of attempts) {
      await expect(attempt).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    }
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
      call(tasks.completeOccurrence, { taskId: task.id, version: 1, today: "2026-10-28" }, asBob),
      call(tasks.finish, { taskId: task.id, version: 1 }, asBob),
      call(
        tasks.undoCompletion,
        { taskId: task.id, version: 1, dueDate: null, recurrence: weekly },
        asBob,
      ),
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
