// @vitest-environment jsdom
import { ToastProvider } from "@planifier/ui/components/toast";
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { taskWith } from "../testing/task-fixtures";
import { ListViewProvider } from "../utils/list-view";
import { type TaskCompletion, TaskRow } from "./task-row";

// jsdom perd l'espace en tête du complément `sr-only` des boutons : noms comparés à `\s*` près.
// Aucun appel réseau attendu : le client oRPC lit `fetch` à son chargement, on le remplace avant.
const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});

afterEach(() => {
  vi.clearAllMocks();
});

const parent = taskWith({ id: "p", title: "Courses" });
const bread = taskWith({ id: "a", title: "Pain", parentId: "p" });
const milk = taskWith({
  id: "b",
  title: "Lait",
  parentId: "p",
  completedAt: new Date(),
  completedBy: { userId: "u-julien", name: "Julien" },
});

function completionWith(fields: Partial<TaskCompletion> = {}): TaskCompletion {
  return { toggle: vi.fn(), finish: vi.fn(), ...fields };
}

function renderRow(completion = completionWith(), task = parent, shared = false, readOnly = false) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ToastProvider dismissLabel="Fermer">
        <ul>
          <ListViewProvider value={{ shared, readOnly, isDimmed: () => false }}>
            <TaskRow task={task} subtasks={[bread, milk]} completion={completion} />
          </ListViewProvider>
        </ul>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

async function openMenu(title: string) {
  await userEvent.click(screen.getByRole("button", { name: `Actions de « ${title} »` }));
}

async function chooseAction(title: string, action: string) {
  await openMenu(title);
  await userEvent.click(screen.getByRole("menuitem", { name: action }));
}

describe("TaskRow avec sous-tâches", () => {
  it("compte et liste les sous-tâches sous la tâche", () => {
    renderRow();
    expect(screen.getByText("1 sur 2 sous-tâches cochée")).toBeTruthy();
    const list = screen.getByRole("list", { name: "Sous-tâches de « Courses »" });
    expect(list.querySelectorAll("li")).toHaveLength(2);
  });

  it("coche une sous-tâche seule, sans toucher à sa tâche", async () => {
    const onToggle = vi.fn<TaskCompletion["toggle"]>();
    renderRow(completionWith({ toggle: onToggle }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Pain" }));
    expect(onToggle).toHaveBeenCalledExactlyOnceWith(bread, true);
  });

  it("ne propose pas de sous-tâche à une sous-tâche (un seul niveau)", async () => {
    renderRow();
    await openMenu("Courses");
    expect(screen.getByRole("menuitem", { name: "Ajouter une sous-tâche" })).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    await openMenu("Pain");
    expect(screen.queryByRole("menuitem", { name: "Ajouter une sous-tâche" })).toBeNull();
  });

  it("nomme les sous-tâches dans la question de suppression", async () => {
    renderRow();
    await chooseAction("Courses", "Supprimer");
    expect(screen.getByText("Supprimer « Courses » et ses 2 sous-tâches ?")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("garde les sous-tâches affichées pendant la modification de la tâche", async () => {
    renderRow();
    await chooseAction("Courses", "Modifier");
    expect(screen.getByRole("list", { name: "Sous-tâches de « Courses »" })).toBeTruthy();
  });

  it("propose « Terminer » à une tâche répétée seulement", async () => {
    const finish = vi.fn<TaskCompletion["finish"]>();
    const weekly = { ...parent, recurrence: { frequency: "WEEKLY", interval: 1 } } as const;
    renderRow(completionWith({ finish }), weekly);
    await openMenu("Pain");
    expect(screen.queryByRole("menuitem", { name: "Terminer pour de bon" })).toBeNull();
    await userEvent.keyboard("{Escape}");
    await chooseAction("Courses", "Terminer pour de bon");
    expect(finish).toHaveBeenCalledExactlyOnceWith(weekly);
  });

  it("dit qui a coché, dans une liste partagée seulement", () => {
    const { unmount } = renderRow();
    expect(screen.queryByText("Cochée par Julien")).toBeNull();
    unmount();
    renderRow(completionWith(), parent, true);
    expect(screen.getByText("Cochée par Julien")).toBeTruthy();
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderRow();
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});

describe("TaskRow, lecture seule", () => {
  it("montre la coche sans geste possible ni action", () => {
    const completion = completionWith();
    renderRow(completion, parent, false, true);
    expect(screen.getAllByRole("checkbox").every((box) => box.hasAttribute("disabled"))).toBe(true);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
