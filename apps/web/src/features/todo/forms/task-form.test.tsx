// @vitest-environment jsdom
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { replyRpc } from "@/lib/testing/rpc-fetch";

import { LIST_ID, taskWith } from "../testing/task-fixtures";
import { TaskForm } from "./task-form";

const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});

afterEach(() => {
  vi.clearAllMocks();
});

const WEEKLY_TASK = taskWith({
  id: "0199f3a2-7c4e-7d10-9a51-0000000000aa",
  title: "Sortir les poubelles",
  recurrence: { frequency: "WEEKLY", interval: 2 },
});

function renderForm(props: Partial<Parameters<typeof TaskForm>[0]> = {}) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <TaskForm listId={LIST_ID} {...props} />
    </QueryClientProvider>,
  );
}

describe("TaskForm, répétition", () => {
  it("crée une tâche répétée toutes les deux semaines", async () => {
    const calls = replyRpc(fetchMock, { "todo/tasks/create": { data: WEEKLY_TASK } });
    renderForm();
    await userEvent.type(screen.getByLabelText("Nouvelle tâche"), "Sortir les poubelles");
    await userEvent.click(screen.getByText("Description, échéance, répétition (facultatives)"));
    await userEvent.click(screen.getByRole("radio", { name: "Chaque semaine" }));
    const interval = screen.getByLabelText("Intervalle");
    await userEvent.clear(interval);
    await userEvent.type(interval, "2");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    await waitFor(() => {
      expect(calls).toEqual([
        {
          path: "todo/tasks/create",
          input: {
            listId: LIST_ID,
            title: "Sortir les poubelles",
            recurrence: { frequency: "WEEKLY", interval: 2 },
          },
        },
      ]);
    });
  });

  it("refuse un intervalle nul sans appeler l'API, détails ouverts et erreur affichée", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText("Nouvelle tâche"), "Arroser");
    await userEvent.click(screen.getByText("Description, échéance, répétition (facultatives)"));
    await userEvent.click(screen.getByRole("radio", { name: "Chaque jour" }));
    const interval = screen.getByLabelText("Intervalle");
    await userEvent.clear(interval);
    await userEvent.type(interval, "0");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(interval.getAttribute("aria-invalid")).toBe("true");
    expect(interval.closest("details")).toHaveProperty("open", true);
  });

  it("préremplit la répétition d'une tâche à modifier, détails ouverts", () => {
    renderForm({ task: WEEKLY_TASK, onDone: vi.fn() });
    expect(screen.getByRole("radio", { name: "Chaque semaine" })).toHaveProperty("checked", true);
    expect(screen.getByLabelText("Intervalle")).toHaveProperty("value", "2");
    expect(screen.getByLabelText("Intervalle").closest("details")).toHaveProperty("open", true);
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderForm({ task: WEEKLY_TASK, onDone: vi.fn() });
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
