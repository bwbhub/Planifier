// @vitest-environment jsdom
import { ORPCError } from "@orpc/client";
import type { GetTaskOutput } from "@planifier/api-contract";
import { axeViolations } from "@planifier/ui/testing/axe";
import { ToastProvider } from "@planifier/ui/components/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
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
