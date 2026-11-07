// @vitest-environment jsdom
import { ORPCError } from "@orpc/client";
import type { TodoListOutput } from "@planifier/api-contract";
import { ToastProvider } from "@planifier/ui/components/toast";
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
  readOnlySpace: null,
  can: { write: true, delete: true, share: true },
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
      <ToastProvider dismissLabel="Fermer">
        <ListPanel list={list} onDeleted={vi.fn()} />
      </ToastProvider>
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
    await userEvent.click(
      screen.getByRole("button", { name: "Actions de « Sortir les poubelles »" }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Terminer pour de bon" }));

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

describe("ListPanel, liste montrée à un Espace", () => {
  const coloc = { id: "0199f3a2-7c4e-7d10-9a51-00000000c010", name: "Coloc" };
  const owner = { userId: "0199f3a2-7c4e-7d10-9a51-00000000a11c", name: "Camille" };

  function replyWith(task = WEEKLY) {
    replyRpc(fetchMock, {
      "todo/tasks/list": { data: { items: [task] } },
      "todo/lists/members": { data: { items: [owner], callerId: owner.userId } },
    });
  }

  it("ne laisse que la lecture à qui la voit par son Espace", async () => {
    replyWith();
    renderPanel({
      ...LIST,
      readOnlySpace: coloc,
      can: { write: false, delete: false, share: false },
    });
    await screen.findByText("Sortir les poubelles");
    expect(screen.getByText("Lecture seule · Coloc")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Sortir les poubelles" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.queryByRole("button", { name: /Modifier/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Supprimer/ })).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("garde tout à son propriétaire et dit à qui elle est montrée", async () => {
    replyWith();
    renderPanel({ ...LIST, readOnlySpace: coloc });
    await screen.findByText("Sortir les poubelles");
    expect(screen.getByText("Liste perso · Visible par Coloc")).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Modifier.*la liste$/ })).toBeTruthy();
  });

  it("ne présente aucune violation d'accessibilité en lecture seule", async () => {
    replyWith();
    const { container } = renderPanel({
      ...LIST,
      readOnlySpace: coloc,
      can: { write: false, delete: false, share: false },
    });
    await screen.findByText("Sortir les poubelles");
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});

describe("ListPanel, liste partagée", () => {
  const shared: TodoListOutput = {
    ...LIST,
    space: { id: "0199f3a2-7c4e-7d10-9a51-00000000c010", name: "Coloc" },
    can: { write: true, delete: false, share: false },
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

  it("atténue, sur demande, les tâches qui ne me sont pas assignées, sous-tâche assignée épargnée", async () => {
    const me = { userId: "0199f3a2-7c4e-7d10-9a51-00000000a11c", name: "Camille" };
    const other = { userId: "0199f3a2-7c4e-7d10-9a51-00000000b0b0", name: "Julien" };
    const parentId = "0199f3a2-7c4e-7d10-9a51-00000000d001";
    replyRpc(fetchMock, {
      "todo/tasks/list": {
        data: {
          items: [
            taskWith({ id: parentId, title: "Pour Julien", assignee: other }),
            taskWith({
              id: "0199f3a2-7c4e-7d10-9a51-00000000d002",
              title: "Sous-tâche pour moi",
              parentId,
              assignee: me,
            }),
            taskWith({ id: "0199f3a2-7c4e-7d10-9a51-00000000d003", title: "Sans personne" }),
          ],
        },
      },
      "todo/lists/members": { data: { items: [me, other], callerId: me.userId } },
    });
    renderPanel(shared);
    const option = await screen.findByRole("checkbox", {
      name: "Atténuer les tâches qui ne me sont pas assignées",
    });
    expect(await screen.findByText("Assignée à Julien")).toBeTruthy();
    const dimmedTitles = () =>
      [...document.querySelectorAll("[data-dimmed] input + span")].map(
        (title) => title.textContent,
      );
    expect(dimmedTitles()).toEqual([]);

    await userEvent.click(option);
    expect(dimmedTitles()).toEqual(["Pour Julien", "Sans personne"]);
  });
});
