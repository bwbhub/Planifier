import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { router } from "../../router";
import { createList, createSpace, createTestUser, requestAs } from "../todo/todo.testing";

// Créneaux liés à une tâche : seules mes entrées sont rendues, même sur une tâche que d'autres voient. Base réelle.
const { db, reset } = createTestDatabase();
const { entries } = router.agenda;
const { lists, tasks } = router.todo;

let alice: SessionUser;
let bob: SessionUser;
let carol: SessionUser;
let spaceId: string;

const asUser = (user: SessionUser) => requestAs(db, user);
const TIMED = {
  allDay: false,
  startsAt: new Date("2026-11-05T09:00:00Z"),
  endsAt: new Date("2026-11-05T10:00:00Z"),
} as const;

const linked = (user: SessionUser, taskId: string) =>
  call(entries.listForTask, { taskId }, asUser(user));

beforeEach(async () => {
  await reset();
  alice = await createTestUser(db, "alice");
  bob = await createTestUser(db, "bob");
  carol = await createTestUser(db, "carol");
  ({ id: spaceId } = await createSpace(db, alice, [bob], ["TODO", "AGENDA"]));
});

afterAll(async () => {
  await db.$disconnect();
});

describe("agenda.entries.listForTask (base réelle)", () => {
  it("rend mes créneaux de la tâche, pas ceux des autres entrées", async () => {
    const list = await createList(db, alice);
    const task = await call(tasks.create, { listId: list.id, title: "Dentiste" }, asUser(alice));
    const other = await call(tasks.create, { listId: list.id, title: "Autre" }, asUser(alice));
    const mine = await call(
      entries.create,
      { title: "RDV", tint: "general", when: TIMED, taskId: task.id },
      asUser(alice),
    );
    await call(
      entries.create,
      { title: "Ailleurs", tint: "general", when: TIMED, taskId: other.id },
      asUser(alice),
    );
    await call(entries.create, { title: "Libre", tint: "general", when: TIMED }, asUser(alice));

    const { items } = await linked(alice, task.id);

    expect(items.map(({ id }) => id)).toEqual([mine.id]);
  });

  it("ne rend jamais les créneaux d'un autre, même sur une tâche partagée qu'il voit", async () => {
    const shared = await call(
      lists.create,
      { name: "Courses", tint: "couple", spaceId },
      asUser(alice),
    );
    const task = await call(tasks.create, { listId: shared.id, title: "Pain" }, asUser(alice));
    await call(
      entries.create,
      { title: "Passer à la boulangerie", tint: "general", when: TIMED, taskId: task.id },
      asUser(bob),
    );

    expect((await linked(bob, task.id)).items).toHaveLength(1);
    expect((await linked(alice, task.id)).items).toEqual([]);
  });

  it("tâche inconnue ou invisible : liste vide, sans rien révéler", async () => {
    const list = await createList(db, alice);
    const task = await call(tasks.create, { listId: list.id, title: "Secret" }, asUser(alice));
    await call(
      entries.create,
      { title: "RDV", tint: "general", when: TIMED, taskId: task.id },
      asUser(alice),
    );

    expect((await linked(carol, task.id)).items).toEqual([]);
    expect((await linked(carol, crypto.randomUUID())).items).toEqual([]);
  });
});
