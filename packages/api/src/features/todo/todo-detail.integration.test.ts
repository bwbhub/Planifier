import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { router } from "../../router";
import { createList, createSpace, createTestUser, requestAs } from "./todo.testing";

// Détail d'une tâche : contenu, sous-tâches, droits de lecture et d'écriture. Base réelle.
const { db, reset } = createTestDatabase();
const { lists, tasks } = router.todo;

let alice: SessionUser;
let bob: SessionUser;
let carol: SessionUser;
let spaceId: string;

const asUser = (user: SessionUser) => requestAs(db, user);
const get = (user: SessionUser, taskId: string) => call(tasks.get, { taskId }, asUser(user));
const notFound = { code: "NOT_FOUND" };

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

describe("todo.tasks.get (base réelle)", () => {
  it("rend la tâche, sa liste et ses sous-tâches par ordre de création", async () => {
    const list = await createList(db, alice);
    const task = await call(
      tasks.create,
      { listId: list.id, title: "Voyage", description: "Billets", dueDate: "2026-12-01" },
      asUser(alice),
    );
    for (const title of ["Réserver", "Valises"])
      await call(tasks.create, { listId: list.id, title, parentId: task.id }, asUser(alice));

    const detail = await get(alice, task.id);

    expect(detail.task).toMatchObject({ id: task.id, title: "Voyage", dueDate: "2026-12-01" });
    expect(detail.list).toEqual({ id: list.id, name: "Maison", tint: "general", canWrite: true });
    expect(detail.subtasks.map(({ title }) => title)).toEqual(["Réserver", "Valises"]);
  });

  it("une sous-tâche se lit seule, sans sous-tâches", async () => {
    const list = await createList(db, alice);
    const parent = await call(tasks.create, { listId: list.id, title: "Parent" }, asUser(alice));
    const child = await call(
      tasks.create,
      { listId: list.id, title: "Enfant", parentId: parent.id },
      asUser(alice),
    );

    const detail = await get(alice, child.id);

    expect(detail.task.parentId).toBe(parent.id);
    expect(detail.subtasks).toEqual([]);
  });

  it("liste perso d'un autre : NOT_FOUND ; tâche inconnue : NOT_FOUND", async () => {
    const list = await createList(db, alice);
    const task = await call(tasks.create, { listId: list.id, title: "Secret" }, asUser(alice));

    await expect(get(bob, task.id)).rejects.toMatchObject(notFound);
    await expect(get(alice, crypto.randomUUID())).rejects.toMatchObject(notFound);
  });

  it("liste partagée : un membre la lit et peut l'écrire ; un étranger à l'Espace : NOT_FOUND", async () => {
    const shared = await call(
      lists.create,
      { name: "Courses", tint: "couple", spaceId },
      asUser(alice),
    );
    const task = await call(tasks.create, { listId: shared.id, title: "Pain" }, asUser(alice));

    expect((await get(bob, task.id)).list.canWrite).toBe(true);
    await expect(get(carol, task.id)).rejects.toMatchObject(notFound);
  });

  it("liste montrée en lecture seule : lue, canWrite faux", async () => {
    const shown = await call(
      lists.create,
      { name: "Cadeaux", tint: "general", readOnlySpaceId: spaceId },
      asUser(alice),
    );
    const task = await call(tasks.create, { listId: shown.id, title: "Livre" }, asUser(alice));

    expect((await get(bob, task.id)).list.canWrite).toBe(false);
    await expect(get(carol, task.id)).rejects.toMatchObject(notFound);
  });
});
