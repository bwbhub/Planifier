// @vitest-environment jsdom
import { ORPCError } from "@orpc/client";
import type { TodoListOutput } from "@planifier/api-contract";
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { replyRpc } from "@/lib/testing/rpc-fetch";

import { LIST_ID, taskWith } from "../testing/task-fixtures";
import { ListPanel } from "./list-panel";

const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});

beforeEach(() => {
  // « Aujourd'hui » de l'appareil : seule l'horloge est figée, pas les minuteries.
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 9, 28, 9, 0) });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

const LIST: TodoListOutput = {
  id: LIST_ID,
  name: "Maison",
  tint: "general",
  version: 1,
  openTaskCount: 1,
  space: null,
  can: { delete: true, share: true },
};
const WEEKLY = taskWith({
  id: "0199f3a2-7c4e-7d10-9a51-0000000000aa",
  title: "Sortir les poubelles",
  dueDate: "2026-10-28",
  recurrence: { frequency: "WEEKLY", interval: 1 },
});

function renderPanel(list = LIST) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ListPanel list={list} onDeleted={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe("ListPanel, tâche répétée", () => {
  it("cocher fait l'occurrence : la tâche reste à faire, l'échéance avance et c'est annoncé", async () => {
    const next = { ...WEEKLY, dueDate: "2026-11-04", version: 2 };
    const server = {
      "todo/tasks/list": { data: { items: [WEEKLY] } },
      "todo/tasks/completeOccurrence": { data: next },
      "todo/lists/list": { data: { items: [LIST], nextCursor: null } },
    };
    const calls = replyRpc(fetchMock, server);
    renderPanel();
    expect(await screen.findByText("Toutes les semaines")).toBeTruthy();
    // Ce que le serveur rendra une fois l'occurrence faite (relecture après la coche).
    server["todo/tasks/list"] = { data: { items: [next] } };

    await userEvent.click(screen.getByRole("checkbox", { name: "Sortir les poubelles" }));
    expect(await screen.findByText("Pour le 4 novembre")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Sortir les poubelles" })).toHaveProperty(
      "checked",
      false,
    );
    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe(
        "« Sortir les poubelles » : c'est fait. Prochaine fois le 4 novembre.",
      );
    });
    expect(calls).toContainEqual({
      path: "todo/tasks/completeOccurrence",
      input: { taskId: WEEKLY.id, version: 1, today: "2026-10-28" },
    });
  });
});

describe("ListPanel, annuler et terminer une tâche répétée", () => {
  it("« Annuler » rend l'échéance d'avant la coche", async () => {
    const next = { ...WEEKLY, dueDate: "2026-11-04", version: 2 };
    const server = {
      "todo/tasks/list": { data: { items: [WEEKLY] } },
      "todo/tasks/completeOccurrence": { data: next },
      "todo/tasks/undoCompletion": { data: { ...WEEKLY, version: 3 } },
      "todo/lists/list": { data: { items: [LIST], nextCursor: null } },
    };
    const calls = replyRpc(fetchMock, server);
    renderPanel();
    await userEvent.click(await screen.findByRole("checkbox", { name: "Sortir les poubelles" }));
    await userEvent.click(await screen.findByRole("button", { name: "Annuler" }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe(
        "« Sortir les poubelles » : coche annulée.",
      );
    });
    expect(calls).toContainEqual({
      path: "todo/tasks/undoCompletion",
      input: {
        taskId: WEEKLY.id,
        version: 2,
        dueDate: "2026-10-28",
        recurrence: WEEKLY.recurrence,
      },
    });
  });

  it("« Terminer » arrête la répétition et coche, en l'annonçant", async () => {
    const finished = { ...WEEKLY, recurrence: null, completedAt: new Date(), version: 2 };
    const server = {
      "todo/tasks/list": { data: { items: [WEEKLY] } },
      "todo/tasks/finish": { data: finished },
      "todo/lists/list": { data: { items: [LIST], nextCursor: null } },
    };
    const calls = replyRpc(fetchMock, server);
    renderPanel();
    await screen.findByText("Toutes les semaines");
    server["todo/tasks/list"] = { data: { items: [finished] } };
    await userEvent.click(screen.getByRole("button", { name: /^Terminer/ }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe(
        "« Sortir les poubelles » est terminée : elle ne se répète plus.",
      );
    });
    expect(screen.getByRole("button", { name: "Annuler" })).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Cochées (1)" })).toBeTruthy();
    expect(calls).toContainEqual({
      path: "todo/tasks/finish",
      input: { taskId: WEEKLY.id, version: 1 },
    });
  });

  it("refusée par le serveur : l'échéance revient et l'erreur s'affiche", async () => {
    replyRpc(fetchMock, {
      "todo/tasks/list": { data: { items: [WEEKLY] } },
      "todo/tasks/completeOccurrence": {
        error: new ORPCError("CONFLICT", { data: { reason: "STALE_VERSION" } }),
      },
      "todo/lists/list": { data: { items: [LIST], nextCursor: null } },
    });
    renderPanel();
    await userEvent.click(await screen.findByRole("checkbox", { name: "Sortir les poubelles" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/Prévue le 28 octobre|Pour le 28 octobre/)).toBeTruthy();
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    replyRpc(fetchMock, { "todo/tasks/list": { data: { items: [WEEKLY] } } });
    const { container } = renderPanel();
    await screen.findByText("Toutes les semaines");
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});

describe("ListPanel, liste partagée", () => {
  const shared: TodoListOutput = {
    ...LIST,
    space: { id: "0199f3a2-7c4e-7d10-9a51-00000000c010", name: "Coloc" },
    can: { delete: false, share: false },
  };

  it("nomme l'Espace et ses personnes, sans suppression pour un simple membre", async () => {
    replyRpc(fetchMock, {
      "todo/tasks/list": { data: { items: [] } },
      "todo/lists/members": {
        data: {
          items: [
            { userId: "0199f3a2-7c4e-7d10-9a51-00000000a11c", name: "Camille" },
            { userId: "0199f3a2-7c4e-7d10-9a51-00000000b0b0", name: "Julien" },
          ],
        },
      },
    });
    renderPanel(shared);
    expect(screen.getByText("Liste partagée · Coloc")).toBeTruthy();
    expect(
      await screen.findByRole("img", { name: "Personnes de la liste : Camille, Julien" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Supprimer\s*la liste$/ })).toBeNull();
    expect(screen.getByRole("button", { name: /^Modifier\s*la liste$/ })).toBeTruthy();
  });
});
