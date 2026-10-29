// @vitest-environment jsdom
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { taskWith } from "../testing/task-fixtures";
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
const milk = taskWith({ id: "b", title: "Lait", parentId: "p", completedAt: new Date() });

function completionWith(fields: Partial<TaskCompletion> = {}): TaskCompletion {
  return { toggle: vi.fn(), finish: vi.fn(), ...fields };
}

function renderRow(completion = completionWith(), task = parent) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ul>
        <TaskRow task={task} subtasks={[bread, milk]} completion={completion} />
      </ul>
    </QueryClientProvider>,
  );
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

  it("ne propose pas de sous-tâche à une sous-tâche (un seul niveau)", () => {
    renderRow();
    expect(screen.getByRole("button", { name: /^\+ Sous-tâche\s*à « Courses »$/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Sous-tâche\s*à « Pain »/ })).toBeNull();
  });

  it("nomme les sous-tâches dans la question de suppression", async () => {
    renderRow();
    await userEvent.click(screen.getByRole("button", { name: /^Supprimer\s*« Courses »$/ }));
    expect(screen.getByText("Supprimer « Courses » et ses 2 sous-tâches ?")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("garde les sous-tâches affichées pendant la modification de la tâche", async () => {
    renderRow();
    await userEvent.click(screen.getByRole("button", { name: /^Modifier\s*« Courses »$/ }));
    expect(screen.getByRole("list", { name: "Sous-tâches de « Courses »" })).toBeTruthy();
  });

  it("propose « Terminer » à une tâche répétée seulement", async () => {
    const finish = vi.fn<TaskCompletion["finish"]>();
    const weekly = { ...parent, recurrence: { frequency: "WEEKLY", interval: 1 } } as const;
    renderRow(completionWith({ finish }), weekly);
    expect(screen.queryByRole("button", { name: /^Terminer\s*« Pain »/ })).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: /^Terminer\s*« Courses » pour de bon$/ }),
    );
    expect(finish).toHaveBeenCalledExactlyOnceWith(weekly);
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderRow();
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
