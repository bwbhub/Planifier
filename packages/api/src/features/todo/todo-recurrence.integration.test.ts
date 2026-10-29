import { call } from "@orpc/server";
import type { SessionUser } from "@planifier/auth";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { router } from "../../router";
import { completeOccurrence } from "./tasks/tasks.service";
import {
  createList,
  createListWithTask,
  createTestUser,
  requestAs,
  WEEKLY as weekly,
} from "./todo.testing";

// Tâches répétées (ADR 0017), sur base réelle `_test` vidée avant chaque test (droits : todo.integration.test.ts).
const { db, reset } = createTestDatabase();
const { tasks } = router.todo;

let alice: SessionUser;

const asUser = (user: SessionUser | null) => requestAs(db, user);
const createAliceList = () => createList(db, alice);
const createAliceTask = () => createListWithTask(db, alice);

beforeEach(async () => {
  await reset();
  alice = await createTestUser(db, "alice");
});

afterAll(async () => {
  await db.$disconnect();
});

async function createWeekly(dueDate?: string) {
  const list = await createAliceList();
  return call(
    tasks.create,
    {
      listId: list.id,
      title: "Sortir les poubelles",
      recurrence: weekly,
      ...(dueDate === undefined ? {} : { dueDate }),
    },
    asUser(alice),
  );
}

describe("todo.tasks : coche d'une tâche répétée (base réelle)", () => {
  it("cocher une occurrence avance l'échéance, la tâche reste à faire", async () => {
    const task = await createWeekly("2026-10-28");
    expect(task.recurrence).toEqual(weekly);
    const next = await call(
      tasks.completeOccurrence,
      { taskId: task.id, version: task.version, today: "2026-10-28" },
      asUser(alice),
    );
    expect(next).toMatchObject({
      dueDate: "2026-11-04",
      completedAt: null,
      version: task.version + 1,
    });
  });

  it("rejouer la même coche n'avance pas deux fois : CONFLICT STALE_VERSION", async () => {
    const task = await createWeekly("2026-10-28");
    const input = { taskId: task.id, version: task.version, today: "2026-10-28" };
    await call(tasks.completeOccurrence, input, asUser(alice));
    await expect(call(tasks.completeOccurrence, input, asUser(alice))).rejects.toMatchObject({
      code: "CONFLICT",
      data: { reason: "STALE_VERSION" },
    });
    const { items } = await call(tasks.list, { listId: task.listId }, asUser(alice));
    expect(items[0]?.dueDate).toBe("2026-11-04");
  });

  it("sans échéance : la première coche fixe la suivante depuis aujourd'hui", async () => {
    const task = await createWeekly();
    const next = await call(
      tasks.completeOccurrence,
      { taskId: task.id, version: task.version, today: "2026-10-28" },
      asUser(alice),
    );
    expect(next.dueDate).toBe("2026-11-04");
  });

  it("tâche non répétée : CONFLICT NOT_RECURRING", async () => {
    const { task } = await createAliceTask();
    await expect(
      call(
        tasks.completeOccurrence,
        { taskId: task.id, version: task.version, today: "2026-10-28" },
        asUser(alice),
      ),
    ).rejects.toMatchObject({ code: "CONFLICT", data: { reason: "NOT_RECURRING" } });
  });
});

describe("todo.tasks : série d'une tâche répétée (base réelle)", () => {
  it("mensuelle au 31 : le 31 revient après un mois plus court, coche après coche", async () => {
    const list = await createAliceList();
    let task = await call(
      tasks.create,
      {
        listId: list.id,
        title: "Payer le loyer",
        dueDate: "2026-01-31",
        recurrence: { frequency: "MONTHLY", interval: 1 },
      },
      asUser(alice),
    );
    const dues = [];
    for (let i = 0; i < 3; i += 1) {
      if (task.dueDate === null) throw new Error("échéance attendue");
      task = await call(
        tasks.completeOccurrence,
        { taskId: task.id, version: task.version, today: task.dueDate },
        asUser(alice),
      );
      dues.push(task.dueDate);
    }
    expect(dues).toEqual(["2026-02-28", "2026-03-31", "2026-04-30"]);
  });

  it("une échéance changée à la main fait repartir la série de là", async () => {
    const list = await createAliceList();
    const task = await call(
      tasks.create,
      {
        listId: list.id,
        title: "Payer le loyer",
        dueDate: "2026-01-31",
        recurrence: { frequency: "MONTHLY", interval: 1 },
      },
      asUser(alice),
    );
    const done = await call(
      tasks.completeOccurrence,
      { taskId: task.id, version: task.version, today: "2026-01-31" },
      asUser(alice),
    );
    const moved = await call(
      tasks.update,
      { taskId: task.id, version: done.version, dueDate: "2026-03-05" },
      asUser(alice),
    );
    const next = await call(
      tasks.completeOccurrence,
      { taskId: task.id, version: moved.version, today: "2026-03-05" },
      asUser(alice),
    );
    expect(next.dueDate).toBe("2026-04-05");
  });

  it("deux coches simultanées n'avancent qu'une fois", async () => {
    const task = await createWeekly("2026-10-28");
    const input = { taskId: task.id, version: task.version, today: "2026-10-28" };
    const results = await Promise.allSettled([
      call(tasks.completeOccurrence, input, asUser(alice)),
      call(tasks.completeOccurrence, input, asUser(alice)),
    ]);
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    const { items } = await call(tasks.list, { listId: task.listId }, asUser(alice));
    expect(items[0]).toMatchObject({ dueDate: "2026-11-04", version: task.version + 1 });
  });
});

describe("todo.tasks : terminer et annuler une coche (base réelle)", () => {
  it("terminer pour de bon : répétition arrêtée, tâche cochée", async () => {
    const task = await createWeekly("2026-10-28");
    const finished = await call(
      tasks.finish,
      { taskId: task.id, version: task.version },
      asUser(alice),
    );
    expect(finished).toMatchObject({ recurrence: null, version: task.version + 1 });
    expect(finished.completedAt).toBeInstanceOf(Date);
  });

  it("annuler « terminer » : répétition rendue, tâche à faire", async () => {
    const task = await createWeekly("2026-10-28");
    const finished = await call(
      tasks.finish,
      { taskId: task.id, version: task.version },
      asUser(alice),
    );
    const undone = await call(
      tasks.undoCompletion,
      { taskId: task.id, version: finished.version, dueDate: task.dueDate, recurrence: weekly },
      asUser(alice),
    );
    expect(undone).toMatchObject({ recurrence: weekly, completedAt: null, dueDate: "2026-10-28" });
  });

  it("annuler une occurrence faite garde la série : le 31 reste le 31", async () => {
    const list = await createAliceList();
    const monthly = { frequency: "MONTHLY", interval: 1 } as const;
    const task = await call(
      tasks.create,
      { listId: list.id, title: "Loyer", dueDate: "2026-01-31", recurrence: monthly },
      asUser(alice),
    );
    const first = await call(
      tasks.completeOccurrence,
      { taskId: task.id, version: task.version, today: "2026-01-31" },
      asUser(alice),
    );
    const second = await call(
      tasks.completeOccurrence,
      { taskId: task.id, version: first.version, today: "2026-02-28" },
      asUser(alice),
    );
    expect(second.dueDate).toBe("2026-03-31");
    const undone = await call(
      tasks.undoCompletion,
      { taskId: task.id, version: second.version, dueDate: "2026-02-28", recurrence: monthly },
      asUser(alice),
    );
    expect(undone.dueDate).toBe("2026-02-28");
    const again = await call(
      tasks.completeOccurrence,
      { taskId: task.id, version: undone.version, today: "2026-02-28" },
      asUser(alice),
    );
    expect(again.dueDate).toBe("2026-03-31");
  });

  it("annuler après une modification faite ailleurs : CONFLICT STALE_VERSION, rien n'est écrasé", async () => {
    const task = await createWeekly("2026-10-28");
    const done = await call(
      tasks.completeOccurrence,
      { taskId: task.id, version: task.version, today: "2026-10-28" },
      asUser(alice),
    );
    await call(
      tasks.update,
      { taskId: task.id, version: done.version, title: "Renommée" },
      asUser(alice),
    );
    await expect(
      call(
        tasks.undoCompletion,
        { taskId: task.id, version: done.version, dueDate: "2026-10-28", recurrence: weekly },
        asUser(alice),
      ),
    ).rejects.toMatchObject({ code: "CONFLICT", data: { reason: "STALE_VERSION" } });
    const { items } = await call(tasks.list, { listId: task.listId }, asUser(alice));
    expect(items[0]).toMatchObject({ title: "Renommée", dueDate: "2026-11-04" });
  });
});

describe("todo.tasks : réglage de la récurrence (base réelle)", () => {
  it("modifier la répétition, puis l'arrêter", async () => {
    const task = await createWeekly("2026-10-28");
    const monthly = await call(
      tasks.update,
      { taskId: task.id, version: task.version, recurrence: { frequency: "MONTHLY", interval: 2 } },
      asUser(alice),
    );
    expect(monthly.recurrence).toEqual({ frequency: "MONTHLY", interval: 2 });
    const stopped = await call(
      tasks.update,
      { taskId: task.id, version: monthly.version, recurrence: null },
      asUser(alice),
    );
    expect(stopped.recurrence).toBeNull();
    await expect(
      db.task.findUnique({ where: { id: task.id }, select: { recurrence: true } }),
    ).resolves.toEqual({
      recurrence: null,
    });
  });

  it("refuse une règle hors bornes à l'écriture", async () => {
    const list = await createAliceList();
    await expect(
      call(
        tasks.create,
        { listId: list.id, title: "Trop souvent", recurrence: { frequency: "DAILY", interval: 0 } },
        asUser(alice),
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("todo.tasks : répétée supprimée entre la garde et l'écriture (base réelle)", () => {
  it("cocher l'occurrence d'une tâche supprimée : NOT_FOUND", async () => {
    const task = await createWeekly("2026-10-28");
    await db.task.delete({ where: { id: task.id } });
    await expect(
      completeOccurrence(db, { taskId: task.id, version: task.version, today: "2026-10-28" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
