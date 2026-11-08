// @vitest-environment jsdom
import { ORPCError } from "@orpc/client";
import type { GetTaskOutput, TodoListOutput } from "@planifier/api-contract";
import { axeViolations } from "@planifier/ui/testing/axe";
import { ToastProvider } from "@planifier/ui/components/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { replyRpc } from "@/lib/testing/rpc-fetch";

import { LIST_ID, taskWith } from "../testing/task-fixtures";
import { TaskDetailSheet } from "./task-detail-sheet";

const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});

afterEach(() => {
  vi.clearAllMocks();
});

const TASK_ID = "0199f3a2-7c4e-7d10-9a51-000000000010";

function detailWith(overrides: Partial<GetTaskOutput["list"]> = {}): GetTaskOutput {
  return {
    task: taskWith({ id: TASK_ID, title: "Acheter du pain", description: "Chez Marcel" }),
    list: {
      id: LIST_ID,
      name: "Courses",
      tint: "general",
      canWrite: true,
      shared: false,
      ...overrides,
    },
    subtasks: [
      taskWith({
        id: "0199f3a2-7c4e-7d10-9a51-000000000011",
        title: "Baguette",
        parentId: TASK_ID,
      }),
    ],
  };
}

function listWith(id: string, name: string, canWrite = true): TodoListOutput {
  return {
    id,
    name,
    tint: "general",
    version: 1,
    openTaskCount: 0,
    space: null,
    readOnlySpace: null,
    can: { write: canWrite, delete: canWrite, share: canWrite },
  };
}

const OTHER_LIST = listWith("0199f3a2-7c4e-7d10-9a51-0000000000a2", "Vacances");

function renderSheet(onClose = vi.fn()) {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ToastProvider dismissLabel="Fermer">
        <TaskDetailSheet taskId={TASK_ID} onClose={onClose} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("TaskDetailSheet", () => {
  it("montre la tâche dans son formulaire et ses sous-tâches", async () => {
    const calls = replyRpc(fetchMock, { "todo/tasks/get": { data: detailWith() } });
    renderSheet();
    expect(await screen.findByDisplayValue("Acheter du pain")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Baguette" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeTruthy();
    expect(calls).toContainEqual({ path: "todo/tasks/get", input: { taskId: TASK_ID } });
  });

  it("enregistre le titre modifié avec la version lue, puis se ferme", async () => {
    const onClose = vi.fn();
    const calls = replyRpc(fetchMock, {
      "todo/tasks/get": { data: detailWith() },
      "todo/tasks/update": { data: taskWith({ id: TASK_ID, title: "Pain complet", version: 2 }) },
    });
    renderSheet(onClose);
    const title = await screen.findByDisplayValue("Acheter du pain");
    await userEvent.clear(title);
    await userEvent.type(title, "Pain complet");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    const update = calls.find(({ path }) => path === "todo/tasks/update");
    expect(update?.input).toMatchObject({ taskId: TASK_ID, title: "Pain complet", version: 1 });
  });

  it("en lecture seule : ni formulaire, ni coche, ni suppression", async () => {
    replyRpc(fetchMock, { "todo/tasks/get": { data: detailWith({ canWrite: false }) } });
    renderSheet();
    expect(await screen.findByText("Chez Marcel")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Enregistrer" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Supprimer" })).toBeNull();
    expect(screen.getByRole("checkbox", { name: "Baguette" })).toHaveProperty("disabled", true);
  });

  it("confirme avant de supprimer, puis se ferme", async () => {
    const onClose = vi.fn();
    const calls = replyRpc(fetchMock, {
      "todo/tasks/get": { data: detailWith() },
      "todo/tasks/delete": { data: {} },
    });
    renderSheet(onClose);
    await userEvent.click(await screen.findByRole("button", { name: "Supprimer" }));
    expect(calls.some(({ path }) => path === "todo/tasks/delete")).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Supprimer définitivement" }));
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("dit que la tâche n'existe plus quand elle est introuvable", async () => {
    replyRpc(fetchMock, { "todo/tasks/get": { error: new ORPCError("NOT_FOUND") } });
    renderSheet();
    expect(await screen.findByText("Cette tâche n'existe plus.")).toBeTruthy();
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    replyRpc(fetchMock, { "todo/tasks/get": { data: detailWith() } });
    renderSheet();
    await screen.findByDisplayValue("Acheter du pain");
    await expect(axeViolations(document.body)).resolves.toEqual([]);
  });
});

const MOVE_REPLIES = {
  "todo/tasks/get": { data: detailWith() },
  "todo/lists/list": {
    data: { items: [listWith(LIST_ID, "Courses"), OTHER_LIST], nextCursor: null },
  },
  "todo/tasks/move": {
    data: taskWith({
      id: TASK_ID,
      title: "Acheter du pain",
      listId: OTHER_LIST.id,
      version: 2,
    }),
  },
};

describe("TaskDetailSheet, envoi vers une autre liste", () => {
  it("envoie la tâche dans une autre liste, au clic, puis se ferme", async () => {
    const onClose = vi.fn();
    const calls = replyRpc(fetchMock, {
      "todo/tasks/get": { data: detailWith() },
      "todo/lists/list": {
        data: {
          items: [
            listWith(LIST_ID, "Courses"),
            OTHER_LIST,
            listWith("0199f3a2-7c4e-7d10-9a51-0000000000a3", "Cadeaux", false),
          ],
          nextCursor: null,
        },
      },
      "todo/tasks/move": {
        data: taskWith({
          id: TASK_ID,
          title: "Acheter du pain",
          listId: OTHER_LIST.id,
          version: 2,
        }),
      },
    });
    renderSheet(onClose);
    const target = await screen.findByLabelText("Envoyer vers");
    // Ni la liste de la tâche, ni une liste en lecture seule.
    expect(
      within(target)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Vacances"]);
    expect(calls.some(({ path }) => path === "todo/tasks/move")).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    const sent = calls.find(({ path }) => path === "todo/tasks/move");
    expect(sent?.input).toEqual({ taskId: TASK_ID, version: 1, listId: OTHER_LIST.id });
  });
});

describe("TaskDetailSheet, annulation de l'envoi", () => {
  it("« Annuler » remet la tâche dans sa liste, avec la version rendue par l'envoi", async () => {
    const calls = replyRpc(fetchMock, MOVE_REPLIES);
    renderSheet();
    await userEvent.click(await screen.findByRole("button", { name: "Envoyer" }));
    await screen.findByText("Tâche envoyée dans « Vacances ».");
    const undo = screen
      .getAllByRole("button", { name: "Annuler" })
      .find((button) => button.closest("form") === null);
    expect(undo).toBeDefined();
    if (undo !== undefined) await userEvent.click(undo);
    await screen.findByText("Tâche remise dans sa liste.");
    const back = calls.filter(({ path }) => path === "todo/tasks/move")[1];
    expect(back?.input).toEqual({ taskId: TASK_ID, version: 2, listId: LIST_ID });
  });

  it("dit pourquoi l'annulation échoue, sans rien forcer", async () => {
    let moves = 0;
    replyRpc(fetchMock, {
      ...MOVE_REPLIES,
      get "todo/tasks/move"() {
        moves += 1;
        return moves === 1
          ? {
              data: taskWith({
                id: TASK_ID,
                title: "Acheter du pain",
                listId: OTHER_LIST.id,
                version: 2,
              }),
            }
          : { error: new ORPCError("CONFLICT", { data: { reason: "STALE_VERSION" } }) };
      },
    });
    renderSheet();
    await userEvent.click(await screen.findByRole("button", { name: "Envoyer" }));
    await screen.findByText("Tâche envoyée dans « Vacances ».");
    const undo = screen
      .getAllByRole("button", { name: "Annuler" })
      .find((button) => button.closest("form") === null);
    if (undo !== undefined) await userEvent.click(undo);
    expect(await screen.findByText(/a changé entre-temps/)).toBeTruthy();
  });
});

describe("TaskDetailSheet, cas limites de l'envoi", () => {
  it("dit que l'assignation est retirée, sans proposer d'annuler", async () => {
    const person = { userId: "0199f3a2-7c4e-7d10-9a51-0000000000b1", name: "Bob" };
    replyRpc(fetchMock, {
      ...MOVE_REPLIES,
      "todo/tasks/get": {
        data: {
          ...detailWith(),
          task: taskWith({ id: TASK_ID, title: "Acheter du pain", assignee: person }),
        },
      },
    });
    renderSheet();
    await userEvent.click(await screen.findByRole("button", { name: "Envoyer" }));
    expect(await screen.findByText(/Son assignation a été retirée/)).toBeTruthy();
    expect(
      screen
        .getAllByRole("button", { name: "Annuler" })
        .every((button) => button.closest("form") !== null),
    ).toBe(true);
  });

  it("dit quand les listes ne se chargent pas", async () => {
    replyRpc(fetchMock, {
      "todo/tasks/get": { data: detailWith() },
      "todo/lists/list": { error: new ORPCError("INTERNAL_SERVER_ERROR") },
    });
    renderSheet();
    expect(await screen.findByRole("button", { name: "Réessayer" })).toBeTruthy();
  });

  it("ne propose pas l'envoi d'une sous-tâche seule", async () => {
    replyRpc(fetchMock, {
      "todo/tasks/get": {
        data: {
          ...detailWith(),
          task: taskWith({
            id: TASK_ID,
            title: "Baguette",
            parentId: "0199f3a2-7c4e-7d10-9a51-000000000099",
          }),
          subtasks: [],
        },
      },
      "todo/lists/list": {
        data: { items: [listWith(LIST_ID, "Courses"), OTHER_LIST], nextCursor: null },
      },
    });
    renderSheet();
    await screen.findByDisplayValue("Baguette");
    expect(screen.queryByLabelText("Envoyer vers")).toBeNull();
  });
});
