import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { TODAY_SECTION_MAX } from "@planifier/constants/todo";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { router } from "../../router";
import {
  createList,
  createSpace,
  createTestUser,
  requestAs,
  WEEKLY as weekly,
} from "./todo.testing";

// Report de tâches (« Les reporter à aujourd'hui ») : droits, tout ou rien, répétées refusées. Base réelle.
const { db, reset } = createTestDatabase();
const { lists, tasks } = router.todo;

const TODAY = "2026-11-10";

let alice: SessionUser;
let bob: SessionUser;
let carol: SessionUser;
let spaceId: string;

const asUser = (user: SessionUser) => requestAs(db, user);
const conflict = (reason: string) => ({ code: "CONFLICT", data: { reason } });

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

async function overdue(user: SessionUser, listId: string, title: string, dueTime?: string) {
  return call(tasks.create, { listId, title, dueDate: "2026-11-01", dueTime }, asUser(user));
}

describe("todo.tasks.postpone (base réelle)", () => {
  it("met l'échéance au jour demandé, retire l'heure, rend les tâches à jour", async () => {
    const list = await createList(db, alice);
    const first = await overdue(alice, list.id, "Une", "09:00");
    const second = await overdue(alice, list.id, "Deux");
    const result = await call(
      tasks.postpone,
      {
        date: TODAY,
        tasks: [
          { taskId: first.id, version: first.version },
          { taskId: second.id, version: second.version },
        ],
      },
      asUser(alice),
    );
    expect(
      result.items.map(({ title, dueDate, dueTime, version }) => ({
        title,
        dueDate,
        dueTime,
        version,
      })),
    ).toEqual([
      { title: "Une", dueDate: TODAY, dueTime: null, version: 2 },
      { title: "Deux", dueDate: TODAY, dueTime: null, version: 2 },
    ]);
  });

  it("tout ou rien : une version périmée et aucune tâche n'est écrite", async () => {
    const list = await createList(db, alice);
    const fresh = await overdue(alice, list.id, "Fraîche");
    const stale = await overdue(alice, list.id, "Périmée");
    await call(
      tasks.update,
      { taskId: stale.id, version: stale.version, title: "Modifiée ailleurs" },
      asUser(alice),
    );
    await expect(
      call(
        tasks.postpone,
        {
          date: TODAY,
          tasks: [
            { taskId: fresh.id, version: fresh.version },
            { taskId: stale.id, version: stale.version },
          ],
        },
        asUser(alice),
      ),
    ).rejects.toMatchObject(conflict("STALE_VERSION"));
    const after = await call(tasks.list, { listId: list.id }, asUser(alice));
    expect(after.items.map(({ dueDate }) => dueDate)).toEqual(["2026-11-01", "2026-11-01"]);
  });
});

describe("todo.tasks.postpone : répétées et horaire (base réelle)", () => {
  it("reporte aussi une tâche répétée : l'échéance change, la série repart de ce jour", async () => {
    const list = await createList(db, alice);
    const repeated = await call(
      tasks.create,
      { listId: list.id, title: "Poubelles", dueDate: "2026-11-01", recurrence: weekly },
      asUser(alice),
    );
    const result = await call(
      tasks.postpone,
      { date: TODAY, tasks: [{ taskId: repeated.id, version: repeated.version }] },
      asUser(alice),
    );
    expect(result.items[0]).toMatchObject({ dueDate: TODAY, recurrence: weekly });
    // La prochaine occurrence se compte depuis le jour de report (ancre remise à zéro).
    const next = await call(
      tasks.completeOccurrence,
      { taskId: repeated.id, version: result.items[0]?.version ?? 0, today: TODAY },
      asUser(alice),
    );
    expect(next.dueDate).toBe("2026-11-17");
  });

  it("donne un nouvel horaire à tout le lot quand `time` est demandé", async () => {
    const list = await createList(db, alice);
    const one = await overdue(alice, list.id, "Une", "09:00");
    const two = await overdue(alice, list.id, "Deux");
    const result = await call(
      tasks.postpone,
      {
        date: TODAY,
        time: "17:30",
        tasks: [
          { taskId: one.id, version: one.version },
          { taskId: two.id, version: two.version },
        ],
      },
      asUser(alice),
    );
    expect(result.items.map(({ dueTime }) => dueTime)).toEqual(["17:30", "17:30"]);
  });
});

describe("todo.tasks.postpone : droits et bornes (base réelle)", () => {
  it("refuse les droits manquants : NOT_FOUND sans lecture, FORBIDDEN en lecture seule", async () => {
    const hers = await createList(db, alice);
    const task = await overdue(alice, hers.id, "À Alice");
    const input = { date: TODAY, tasks: [{ taskId: task.id, version: task.version }] };
    await expect(call(tasks.postpone, input, asUser(carol))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await call(
      lists.update,
      { listId: hers.id, version: hers.version, readOnlySpaceId: spaceId },
      asUser(alice),
    );
    await expect(call(tasks.postpone, input, asUser(bob))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("un lot où une tâche est illisible est refusé en entier", async () => {
    const mine = await createList(db, alice);
    const ownTask = await overdue(alice, mine.id, "À moi");
    const theirs = await createList(db, carol);
    const foreign = await overdue(carol, theirs.id, "À Carol");
    await expect(
      call(
        tasks.postpone,
        {
          date: TODAY,
          tasks: [
            { taskId: ownTask.id, version: ownTask.version },
            { taskId: foreign.id, version: foreign.version },
          ],
        },
        asUser(alice),
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    const after = await call(tasks.list, { listId: mine.id }, asUser(alice));
    expect(after.items[0]?.dueDate).toBe("2026-11-01");
  });

  it("borne le lot et refuse un doublon", async () => {
    const list = await createList(db, alice);
    const task = await overdue(alice, list.id, "Une");
    const entry = { taskId: task.id, version: task.version };
    await expect(
      call(tasks.postpone, { date: TODAY, tasks: [entry, entry] }, asUser(alice)),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const many = Array.from({ length: TODAY_SECTION_MAX + 1 }, () => entry);
    await expect(
      call(tasks.postpone, { date: TODAY, tasks: many }, asUser(alice)),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
