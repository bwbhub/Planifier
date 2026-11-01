import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { router } from "../../router";
import { createSpace, createTestUser, requestAs, WEEKLY } from "./todo.testing";

// Liste perso montrée à un Espace en lecture seule : droits, retrait, exclusivité. Base réelle (`pnpm test:integration`).
const { db, reset } = createTestDatabase();
const { lists, tasks } = router.todo;
const { space, members } = router.spaces;

let alice: SessionUser;
let bob: SessionUser;
let carol: SessionUser;
let spaceId: string;

const asUser = (user: SessionUser) => requestAs(db, user);
const forbidden = { code: "FORBIDDEN" };
const notFound = { code: "NOT_FOUND" };

/** Liste perso d'Alice, montrée à un Espace (par défaut, celui où Bob est membre simple), avec une tâche. */
async function createShownList(readOnlySpaceId = spaceId) {
  const list = await call(
    lists.create,
    { name: "Cadeaux", tint: "general", readOnlySpaceId },
    asUser(alice),
  );
  const task = await call(tasks.create, { listId: list.id, title: "Livre" }, asUser(alice));
  return { list, task };
}

/** Liste partagée d'Alice avec l'Espace de Bob, avec une tâche assignée à Bob. */
async function createSharedListWithAssignee() {
  const shared = await call(
    lists.create,
    { name: "Courses", tint: "couple", spaceId },
    asUser(alice),
  );
  const task = await call(
    tasks.create,
    { listId: shared.id, title: "Pain", assigneeId: bob.id },
    asUser(alice),
  );
  return { shared, task };
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

describe("todo : droits sur une liste montrée à un Espace (base réelle)", () => {
  it("la montre aux membres de l'Espace, avec leurs seuls droits", async () => {
    const { list, task } = await createShownList();
    expect(list).toMatchObject({
      space: null,
      readOnlySpace: { id: spaceId, name: "Coloc" },
      can: { write: true, delete: true, share: true },
    });
    const { items } = await call(lists.list, {}, asUser(bob));
    expect(items).toEqual([
      { ...list, openTaskCount: 1, can: { write: false, delete: false, share: false } },
    ]);
    await expect(call(tasks.list, { listId: list.id }, asUser(bob))).resolves.toMatchObject({
      items: [{ id: task.id }],
    });
    await expect(call(lists.members, { listId: list.id }, asUser(bob))).resolves.toMatchObject({
      items: [{ userId: alice.id }],
    });
  });

  it("la cache à qui n'est pas membre de l'Espace", async () => {
    const { list } = await createShownList();
    await expect(call(lists.list, {}, asUser(carol))).resolves.toEqual({
      items: [],
      nextCursor: null,
    });
    await expect(call(tasks.list, { listId: list.id }, asUser(carol))).rejects.toMatchObject(
      notFound,
    );
  });

  it("refuse toute écriture au membre qui la voit", async () => {
    const { list, task } = await createShownList();
    const version = list.version;
    const attempts = [
      call(lists.update, { listId: list.id, version, name: "Non" }, asUser(bob)),
      call(lists.update, { listId: list.id, version, readOnlySpaceId: null }, asUser(bob)),
      call(lists.update, { listId: list.id, version, spaceId }, asUser(bob)),
      call(lists.delete, { listId: list.id }, asUser(bob)),
      call(tasks.create, { listId: list.id, title: "Non" }, asUser(bob)),
      call(tasks.update, { taskId: task.id, version: task.version, title: "Non" }, asUser(bob)),
      call(tasks.setDone, { taskId: task.id, done: true }, asUser(bob)),
      call(
        tasks.completeOccurrence,
        { taskId: task.id, version: task.version, today: "2026-11-01" },
        asUser(bob),
      ),
      call(tasks.finish, { taskId: task.id, version: task.version }, asUser(bob)),
      call(
        tasks.undoCompletion,
        { taskId: task.id, version: task.version, dueDate: null, recurrence: WEEKLY },
        asUser(bob),
      ),
      call(tasks.delete, { taskId: task.id }, asUser(bob)),
    ];
    await Promise.all(attempts.map((attempt) => expect(attempt).rejects.toMatchObject(forbidden)));
  });

  it("refuse la suppression au propriétaire de l'Espace : la liste n'est pas à l'Espace", async () => {
    const { id: bobSpace } = await createSpace(db, bob, [alice]);
    const { list } = await createShownList(bobSpace);
    await expect(call(lists.delete, { listId: list.id }, asUser(bob))).rejects.toMatchObject(
      forbidden,
    );
  });

  it("refuse de la montrer à un Espace étranger ou sans Todo", async () => {
    const { id: foreign } = await createSpace(db, carol, []);
    const { id: noTodo } = await createSpace(db, alice, [], ["AGENDA"]);
    const input = { name: "Cadeaux", tint: "general" } as const;
    await expect(
      call(lists.create, { ...input, readOnlySpaceId: foreign }, asUser(alice)),
    ).rejects.toMatchObject(notFound);
    await expect(
      call(lists.create, { ...input, readOnlySpaceId: noTodo }, asUser(alice)),
    ).rejects.toMatchObject({ code: "CONFLICT", data: { reason: "TODO_DISABLED" } });
  });
});

describe("todo : un seul partage à la fois (base réelle)", () => {
  it("n'accepte qu'un partage à la fois", async () => {
    const input = { name: "Cadeaux", tint: "general", spaceId, readOnlySpaceId: spaceId } as const;
    await expect(call(lists.create, input, asUser(alice))).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("garantit en base qu'une liste n'a qu'un partage", async () => {
    const { list } = await createShownList();
    await expect(
      db.todoList.update({ where: { id: list.id }, data: { spaceId } }),
    ).rejects.toThrow();
  });

  it("passe d'un partage à l'autre sans laisser d'accès ni d'assigné derrière", async () => {
    const { shared, task } = await createSharedListWithAssignee();
    const shown = await call(
      lists.update,
      { listId: shared.id, version: shared.version, readOnlySpaceId: spaceId },
      asUser(alice),
    );
    expect(shown).toMatchObject({ space: null, readOnlySpace: { id: spaceId } });
    await expect(
      db.task.findUniqueOrThrow({ where: { id: task.id }, select: { assigneeId: true } }),
    ).resolves.toEqual({ assigneeId: null });
    const again = await call(
      lists.update,
      { listId: shared.id, version: shown.version, spaceId },
      asUser(alice),
    );
    expect(again).toMatchObject({ space: { id: spaceId }, readOnlySpace: null });
  });

  it("oublie qui a coché, sauf son propriétaire, quand une liste partagée passe en lecture seule", async () => {
    const shared = await call(
      lists.create,
      { name: "Courses", tint: "couple", spaceId },
      asUser(alice),
    );
    const byBob = await call(tasks.create, { listId: shared.id, title: "Pain" }, asUser(alice));
    const byAlice = await call(tasks.create, { listId: shared.id, title: "Lait" }, asUser(alice));
    await call(tasks.setDone, { taskId: byBob.id, done: true }, asUser(bob));
    await call(tasks.setDone, { taskId: byAlice.id, done: true }, asUser(alice));
    await call(
      lists.update,
      { listId: shared.id, version: shared.version, readOnlySpaceId: spaceId },
      asUser(alice),
    );
    const { items } = await call(tasks.list, { listId: shared.id }, asUser(bob));
    expect(items.map(({ title, completedBy }) => [title, completedBy?.name ?? null])).toEqual([
      ["Pain", null],
      ["Lait", "alice"],
    ]);
  });

  it("garde les assignés d'une liste partagée quand on retire un partage absent", async () => {
    const { shared, task } = await createSharedListWithAssignee();
    await call(
      lists.update,
      { listId: shared.id, version: shared.version, readOnlySpaceId: null },
      asUser(alice),
    );
    await expect(
      db.task.findUniqueOrThrow({ where: { id: task.id }, select: { assigneeId: true } }),
    ).resolves.toEqual({ assigneeId: bob.id });
  });
});

describe("todo : fin d'une liste montrée à un Espace (base réelle)", () => {
  it("la rend privée quand son propriétaire la retire", async () => {
    const { list, task } = await createShownList();
    await call(
      lists.update,
      { listId: list.id, version: list.version, readOnlySpaceId: null },
      asUser(alice),
    );
    await expect(call(tasks.list, { listId: list.id }, asUser(bob))).rejects.toMatchObject(
      notFound,
    );
    await expect(call(tasks.delete, { taskId: task.id }, asUser(bob))).rejects.toMatchObject(
      notFound,
    );
  });

  it("la cache au membre qui quitte l'Espace, sans la retirer aux autres", async () => {
    const { list } = await createShownList();
    await call(space.leave, { spaceId }, asUser(bob));
    await expect(call(tasks.list, { listId: list.id }, asUser(bob))).rejects.toMatchObject(
      notFound,
    );
    await expect(call(lists.list, {}, asUser(alice))).resolves.toMatchObject({
      items: [{ readOnlySpace: { id: spaceId } }],
    });
  });

  it("la rend privée, pour de bon, quand son propriétaire quitte l'Espace", async () => {
    const { id: bobSpace } = await createSpace(db, bob, [alice]);
    const { list } = await createShownList(bobSpace);
    await call(space.leave, { spaceId: bobSpace }, asUser(alice));
    await expect(call(tasks.list, { listId: list.id }, asUser(bob))).rejects.toMatchObject(
      notFound,
    );
    await expect(call(lists.list, {}, asUser(alice))).resolves.toMatchObject({
      items: [{ id: list.id, readOnlySpace: null, version: list.version + 1 }],
    });
    await db.spaceMember.create({ data: { spaceId: bobSpace, userId: alice.id } });
    await expect(call(tasks.list, { listId: list.id }, asUser(bob))).rejects.toMatchObject(
      notFound,
    );
  });

  it("la rend privée quand son propriétaire est retiré de l'Espace", async () => {
    const { id: bobSpace } = await createSpace(db, bob, [alice]);
    const { list } = await createShownList(bobSpace);
    await call(members.remove, { spaceId: bobSpace, userId: alice.id }, asUser(bob));
    await expect(call(lists.list, {}, asUser(alice))).resolves.toMatchObject({
      items: [{ id: list.id, readOnlySpace: null }],
    });
  });

  it("ne survit pas à une sortie simultanée du propriétaire", async () => {
    const { id: bobSpace } = await createSpace(db, bob, [alice]);
    const { list } = await createShownList();
    await Promise.allSettled([
      call(
        lists.update,
        { listId: list.id, version: list.version, readOnlySpaceId: bobSpace },
        asUser(alice),
      ),
      call(space.leave, { spaceId: bobSpace }, asUser(alice)),
    ]);
    await expect(
      db.todoList.findUniqueOrThrow({
        where: { id: list.id },
        select: { readOnlySpaceId: true },
      }),
    ).resolves.not.toEqual({ readOnlySpaceId: bobSpace });
  });

  it("la rend privée quand l'Espace est supprimé", async () => {
    const { list } = await createShownList();
    await db.space.delete({ where: { id: spaceId } });
    await expect(call(lists.list, {}, asUser(alice))).resolves.toMatchObject({
      items: [{ id: list.id, space: null, readOnlySpace: null }],
    });
    await expect(call(tasks.list, { listId: list.id }, asUser(bob))).rejects.toMatchObject(
      notFound,
    );
  });
});
