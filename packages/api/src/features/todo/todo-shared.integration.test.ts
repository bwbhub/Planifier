import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { router } from "../../router";
import { createList, createSpace, createTestUser, requestAs } from "./todo.testing";

// Listes partagées avec un Espace : droits des membres, « Cochée par ». Base réelle (`pnpm test:integration`).
const { db, reset } = createTestDatabase();
const { lists, tasks } = router.todo;

let alice: SessionUser;
let bob: SessionUser;
let carol: SessionUser;
let spaceId: string;

const asUser = (user: SessionUser) => requestAs(db, user);

/** Liste d'Alice partagée avec l'Espace où Bob est membre simple et Alice propriétaire. */
function createSharedList(owner: SessionUser = alice) {
  return call(lists.create, { name: "Courses", tint: "couple", spaceId }, asUser(owner));
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

describe("todo : droits sur une liste partagée (base réelle)", () => {
  it("rend la liste partagée à chaque membre, avec ses droits, et la cache aux autres", async () => {
    const list = await createSharedList();
    expect(list).toMatchObject({
      space: { id: spaceId, name: "Coloc" },
      can: { delete: true, share: true },
    });
    const { items } = await call(lists.list, {}, asUser(bob));
    expect(items).toEqual([{ ...list, can: { delete: false, share: false } }]);
    await expect(call(lists.list, {}, asUser(carol))).resolves.toEqual({
      items: [],
      nextCursor: null,
    });
    await expect(call(tasks.list, { listId: list.id }, asUser(carol))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("ne révèle rien à qui n'est pas membre, ni à un ancien membre", async () => {
    const list = await createSharedList();
    const task = await call(tasks.create, { listId: list.id, title: "Pain" }, asUser(alice));
    await db.spaceMember.deleteMany({ where: { spaceId, userId: bob.id } });
    for (const user of [carol, bob]) {
      const notFound = { code: "NOT_FOUND" };
      await expect(
        call(lists.update, { listId: list.id, version: 1, name: "Pris" }, asUser(user)),
      ).rejects.toMatchObject(notFound);
      await expect(call(lists.delete, { listId: list.id }, asUser(user))).rejects.toMatchObject(
        notFound,
      );
      await expect(
        call(tasks.setDone, { taskId: task.id, done: true }, asUser(user)),
      ).rejects.toMatchObject(notFound);
    }
  });

  it("reste visible par tous les membres quand l'Espace restreint sa visibilité", async () => {
    const list = await createSharedList();
    await db.space.update({ where: { id: spaceId }, data: { restrictVisibility: true } });
    await expect(call(tasks.list, { listId: list.id }, asUser(bob))).resolves.toEqual({
      items: [],
    });
  });

  it("garde privée la liste perso, même entre membres d'un même Espace", async () => {
    const list = await createList(db, alice);
    await expect(call(tasks.list, { listId: list.id }, asUser(bob))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("laisse un membre ajouter, modifier et cocher ; dit qui a coché", async () => {
    const list = await createSharedList();
    const task = await call(tasks.create, { listId: list.id, title: "Pain" }, asUser(bob));
    await call(tasks.update, { taskId: task.id, version: 1, title: "Pain frais" }, asUser(alice));
    const checked = await call(tasks.setDone, { taskId: task.id, done: true }, asUser(bob));
    expect(checked.completedBy).toEqual({ userId: bob.id, name: "bob" });
    // Rejouer la coche garde la première personne.
    const replayed = await call(tasks.setDone, { taskId: task.id, done: true }, asUser(alice));
    expect(replayed.completedBy).toEqual({ userId: bob.id, name: "bob" });
    const unchecked = await call(tasks.setDone, { taskId: task.id, done: false }, asUser(alice));
    expect(unchecked).toMatchObject({ completedAt: null, completedBy: null });
  });

  it("réserve la suppression au propriétaire de la liste ou de l'Espace", async () => {
    const bobsList = await createSharedList(bob);
    const alicesList = await createSharedList();
    await expect(call(lists.delete, { listId: alicesList.id }, asUser(bob))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    // Alice est propriétaire de l'Espace : elle supprime la liste de Bob.
    await expect(call(lists.delete, { listId: bobsList.id }, asUser(alice))).resolves.toEqual({});
  });
});

describe("todo : rattachement à un Espace, personnes et pages (base réelle)", () => {
  it("réserve le changement d'Espace au propriétaire de la liste", async () => {
    const list = await createSharedList();
    await expect(
      call(lists.update, { listId: list.id, version: 1, spaceId: null }, asUser(bob)),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    // Bob renomme : une écriture, ouverte aux membres.
    await call(lists.update, { listId: list.id, version: 1, name: "Marché" }, asUser(bob));
    const personal = await call(
      lists.update,
      { listId: list.id, version: 2, spaceId: null },
      asUser(alice),
    );
    expect(personal.space).toBeNull();
    await expect(call(tasks.list, { listId: list.id }, asUser(bob))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
  it("partage une liste perso avec un Espace", async () => {
    const list = await createList(db, alice);
    await call(lists.update, { listId: list.id, version: 1, spaceId }, asUser(alice));
    await expect(call(tasks.list, { listId: list.id }, asUser(bob))).resolves.toEqual({
      items: [],
    });
  });

  it("refuse un Espace dont l'appelant n'est pas membre, ou sans le module Todo", async () => {
    await expect(createSharedList(carol)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const { id: noTodo } = await createSpace(db, alice, [], ["AGENDA"]);
    await expect(
      call(lists.create, { name: "Courses", tint: "general", spaceId: noTodo }, asUser(alice)),
    ).rejects.toMatchObject({ code: "CONFLICT", data: { reason: "TODO_DISABLED" } });
    const list = await createList(db, alice);
    await expect(
      call(lists.update, { listId: list.id, version: 1, spaceId: noTodo }, asUser(alice)),
    ).rejects.toMatchObject({ code: "CONFLICT", data: { reason: "TODO_DISABLED" } });
  });

  it("liste les personnes de la liste : propriétaire puis membres, sans doublon", async () => {
    const list = await createSharedList(bob);
    await expect(call(lists.members, { listId: list.id }, asUser(alice))).resolves.toEqual({
      items: [
        { userId: bob.id, name: "bob" },
        { userId: alice.id, name: "alice" },
      ],
    });
    await expect(call(lists.members, { listId: list.id }, asUser(carol))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("ne nomme plus les membres au propriétaire qui a quitté l'Espace", async () => {
    const list = await createSharedList(bob);
    await db.spaceMember.deleteMany({ where: { spaceId, userId: bob.id } });
    await expect(call(lists.members, { listId: list.id }, asUser(bob))).resolves.toEqual({
      items: [{ userId: bob.id, name: "bob" }],
    });
  });

  it("rend la liste perso à son propriétaire quand l'Espace est supprimé", async () => {
    const list = await createSharedList();
    await db.space.delete({ where: { id: spaceId } });
    const { items } = await call(lists.list, {}, asUser(alice));
    expect(items).toEqual([{ ...list, space: null }]);
    await expect(call(tasks.list, { listId: list.id }, asUser(bob))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("pagine les listes visibles", async () => {
    const mine = await createList(db, alice);
    const shared = await createSharedList(bob);
    const first = await call(lists.list, { limit: 1 }, asUser(alice));
    expect(first).toEqual({ items: [mine], nextCursor: mine.id });
    const second = await call(lists.list, { limit: 1, cursor: mine.id }, asUser(alice));
    expect(second.items.map(({ id }) => id)).toEqual([shared.id]);
    expect(second.nextCursor).toBeNull();
  });
});
