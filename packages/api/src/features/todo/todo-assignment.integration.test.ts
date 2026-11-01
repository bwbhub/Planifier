import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { router } from "../../router";
import { createList, createSpace, createTestUser, requestAs } from "./todo.testing";

// Assignation d'une tâche : membres de l'Espace seulement, jamais imposée. Base réelle (`pnpm test:integration`).
const { db, reset } = createTestDatabase();
const { lists, tasks } = router.todo;

let alice: SessionUser;
let bob: SessionUser;
let carol: SessionUser;
let spaceId: string;

const asUser = (user: SessionUser) => requestAs(db, user);
const conflict = (reason: string) => ({ code: "CONFLICT", data: { reason } });

function createSharedList() {
  return call(lists.create, { name: "Vacances", tint: "couple", spaceId }, asUser(alice));
}

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

describe("todo : écriture de l'assigné (base réelle)", () => {
  it("assigne à la création, réassigne puis retire, et la lecture rend l'assigné sans son e-mail", async () => {
    const { id: listId } = await createSharedList();
    const task = await call(
      tasks.create,
      { listId, title: "Louer une voiture", assigneeId: bob.id },
      asUser(alice),
    );
    expect(task.assignee).toEqual({ userId: bob.id, name: bob.name });

    const moved = await call(
      tasks.update,
      { taskId: task.id, version: task.version, assigneeId: alice.id },
      asUser(bob),
    );
    expect(moved.assignee).toEqual({ userId: alice.id, name: alice.name });

    const cleared = await call(
      tasks.update,
      { taskId: task.id, version: moved.version, assigneeId: null },
      asUser(bob),
    );
    expect(cleared.assignee).toBeNull();
  });

  it("n'assigne personne par défaut, sous-tâche comprise", async () => {
    const { id: listId } = await createSharedList();
    const task = await call(tasks.create, { listId, title: "Valises" }, asUser(alice));
    const subtask = await call(
      tasks.create,
      { listId, parentId: task.id, title: "Trousse", assigneeId: bob.id },
      asUser(alice),
    );
    expect(task.assignee).toBeNull();
    expect(subtask.assignee).toEqual({ userId: bob.id, name: bob.name });
  });

  it("refuse une personne hors de l'Espace, et toute personne sur une liste perso", async () => {
    const { id: listId } = await createSharedList();
    await expect(
      call(tasks.create, { listId, title: "Non", assigneeId: carol.id }, asUser(alice)),
    ).rejects.toMatchObject(conflict("ASSIGNEE_NOT_MEMBER"));

    const task = await call(tasks.create, { listId, title: "Oui" }, asUser(alice));
    await expect(
      call(
        tasks.update,
        { taskId: task.id, version: task.version, assigneeId: carol.id },
        asUser(alice),
      ),
    ).rejects.toMatchObject(conflict("ASSIGNEE_NOT_MEMBER"));

    const personal = await createList(db, alice);
    await expect(
      call(
        tasks.create,
        { listId: personal.id, title: "Seule", assigneeId: alice.id },
        asUser(alice),
      ),
    ).rejects.toMatchObject(conflict("ASSIGNEE_NOT_MEMBER"));
  });

  it("ne laisse pas un non-membre assigner : la liste n'existe pas pour lui", async () => {
    const { id: listId } = await createSharedList();
    await expect(
      call(tasks.create, { listId, title: "Non", assigneeId: bob.id }, asUser(carol)),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("todo : lecture de l'assigné (base réelle)", () => {
  it("ne montre plus un assigné parti de l'Espace", async () => {
    const { id: listId } = await createSharedList();
    await call(tasks.create, { listId, title: "Billets", assigneeId: bob.id }, asUser(alice));
    await db.spaceMember.deleteMany({ where: { spaceId, userId: bob.id } });

    const { items } = await call(tasks.list, { listId }, asUser(alice));
    expect(items.map(({ assignee }) => assignee)).toEqual([null]);
  });

  it("ne montre plus d'assigné sur une liste redevenue perso", async () => {
    const list = await createSharedList();
    const task = await call(
      tasks.create,
      { listId: list.id, title: "Billets", assigneeId: bob.id },
      asUser(alice),
    );
    await call(
      lists.update,
      { listId: list.id, version: list.version, spaceId: null },
      asUser(alice),
    );

    const { items } = await call(tasks.list, { listId: list.id }, asUser(alice));
    expect(items).toMatchObject([{ id: task.id, assignee: null }]);
  });

  it("garde l'assigné d'une occurrence à l'autre d'une tâche répétée", async () => {
    const { id: listId } = await createSharedList();
    const task = await call(
      tasks.create,
      {
        listId,
        title: "Arroser",
        dueDate: "2026-11-01",
        recurrence: { frequency: "WEEKLY", interval: 1 },
        assigneeId: bob.id,
      },
      asUser(alice),
    );
    const next = await call(
      tasks.completeOccurrence,
      { taskId: task.id, version: task.version, today: "2026-11-01" },
      asUser(alice),
    );
    expect(next.assignee).toEqual({ userId: bob.id, name: bob.name });
  });

  it("dit à l'appelant qui il est parmi les personnes de la liste", async () => {
    const { id: listId } = await createSharedList();
    await expect(call(lists.members, { listId }, asUser(bob))).resolves.toMatchObject({
      callerId: bob.id,
    });
  });
});
