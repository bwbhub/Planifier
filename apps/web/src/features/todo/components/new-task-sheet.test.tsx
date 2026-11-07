// @vitest-environment jsdom
import type { TodoListOutput } from "@planifier/api-contract";
import { ToastProvider } from "@planifier/ui/components/toast";
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { replyRpc } from "@/lib/testing/rpc-fetch";

import { taskWith } from "../testing/task-fixtures";
import { NewTaskSheet } from "./new-task-sheet";

const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

afterEach(() => {
  vi.clearAllMocks();
});

function listWith(id: string, name: string, fields: Partial<TodoListOutput> = {}): TodoListOutput {
  return {
    id,
    name,
    tint: "general",
    version: 1,
    openTaskCount: 0,
    space: null,
    readOnlySpace: null,
    can: { write: true, delete: true, share: true },
    ...fields,
  };
}

const MAISON = listWith("0199f3a2-7c4e-7d10-9a51-000000000001", "Maison");
const VACANCES = listWith("0199f3a2-7c4e-7d10-9a51-000000000002", "Vacances");
const LECTURE = listWith("0199f3a2-7c4e-7d10-9a51-000000000003", "Lecture", {
  can: { write: false, delete: false, share: false },
});

function renderSheet(lists: TodoListOutput[], openListId: string | null = null) {
  const onClose = vi.fn();
  const calls = replyRpc(fetchMock, {
    "todo/lists/list": { data: { items: lists, nextCursor: null } },
    "todo/tasks/create": {
      data: taskWith({ id: "0199f3a2-7c4e-7d10-9a51-0000000000aa", title: "Pain" }),
    },
  });
  const view = render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ToastProvider dismissLabel="Fermer">
        <NewTaskSheet open onClose={onClose} openListId={openListId} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { ...view, onClose, calls };
}

describe("NewTaskSheet", () => {
  it("propose la liste regardée, et pas les listes en lecture seule", async () => {
    renderSheet([MAISON, VACANCES, LECTURE], VACANCES.id);
    const field = await screen.findByRole("combobox", { name: "Liste", hidden: true });
    expect(field).toHaveProperty("value", VACANCES.id);
    expect(
      within(field)
        .getAllByRole("option", { hidden: true })
        .map((option) => option.textContent),
    ).toEqual(["Maison", "Vacances"]);
  });

  it("ajoute la tâche dans la liste choisie, ferme la feuille et l'annonce", async () => {
    const { onClose, calls } = renderSheet([MAISON, VACANCES]);
    const field = await screen.findByRole("combobox", { name: "Liste", hidden: true });
    await userEvent.selectOptions(field, "Vacances");
    await userEvent.type(screen.getByRole("textbox", { name: "Nouvelle tâche" }), "Pain");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(calls.find(({ path }) => path === "todo/tasks/create")?.input).toMatchObject({
      listId: VACANCES.id,
      title: "Pain",
    });
    expect(await screen.findByText("Tâche ajoutée à « Vacances ».")).toBeTruthy();
  });

  it("dit où aller quand aucune liste n'accepte de tâche", async () => {
    renderSheet([LECTURE]);
    expect(await screen.findByText("Aucune liste où ajouter")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ouvrir le Todo" })).toHaveProperty("href");
  });

  it("annonce le chargement des listes", () => {
    renderSheet([MAISON]);
    expect(screen.getByText("Chargement de tes listes…")).toBeTruthy();
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderSheet([MAISON]);
    await screen.findByRole("combobox", { name: "Liste", hidden: true });
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
