// @vitest-environment jsdom
import type { AgendaEntryOutput } from "@planifier/api-contract";
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { replyRpc } from "@/lib/testing/rpc-fetch";

import { EntryForm } from "./entry-form";

const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});

afterEach(() => {
  vi.clearAllMocks();
});

const ENTRY: AgendaEntryOutput = {
  id: "0199f3a2-7c4e-7d10-9a51-00000000e001",
  title: "Dentiste",
  location: "Cabinet",
  description: null,
  when: {
    allDay: false,
    startsAt: new Date("2026-11-05T09:00"),
    endsAt: new Date("2026-11-05T10:00"),
  },
  tint: "general",
  hidden: false,
  taskId: null,
  version: 3,
};

function renderForm(entry?: AgendaEntryOutput) {
  const onDone = vi.fn();
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const view = render(
    <QueryClientProvider client={client}>
      <EntryForm entry={entry} day="2026-11-05" onDone={onDone} />
    </QueryClientProvider>,
  );
  return { ...view, onDone };
}

describe("EntryForm", () => {
  it("demande un titre, sans rien envoyer", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    expect(screen.getByLabelText("Titre").getAttribute("aria-invalid")).toBe("true");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuse une fin avant le début", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText("Titre"), "Dentiste");
    await userEvent.clear(screen.getByLabelText("Fin"));
    await userEvent.type(screen.getByLabelText("Fin"), "2026-11-05T08:00");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    expect(await screen.findByText(/La fin doit suivre le début/)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("propose le jour affiché et passe à la journée", async () => {
    renderForm();
    expect(screen.getByLabelText<HTMLInputElement>("Début").value).toBe("2026-11-05T09:00");
    await userEvent.click(screen.getByRole("checkbox", { name: "Toute la journée" }));
    expect(screen.getByLabelText<HTMLInputElement>("Début").value).toBe("2026-11-05");
  });

  it("crée une entrée à la journée puis se ferme", async () => {
    const calls = replyRpc(fetchMock, { "agenda/entries/create": { data: ENTRY } });
    const { onDone } = renderForm();
    await userEvent.type(screen.getByLabelText("Titre"), "Week-end");
    await userEvent.click(screen.getByRole("checkbox", { name: "Toute la journée" }));
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    await waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce();
    });
    expect(calls[0]?.input).toMatchObject({
      title: "Week-end",
      when: { allDay: true, startDay: "2026-11-05", endDay: "2026-11-05" },
    });
  });

  it("envoie la version lue à l'ouverture et efface un lieu vidé", async () => {
    const calls = replyRpc(fetchMock, { "agenda/entries/update": { data: ENTRY } });
    const { onDone } = renderForm(ENTRY);
    await userEvent.clear(screen.getByLabelText("Lieu"));
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce();
    });
    expect(calls[0]?.input).toMatchObject({ entryId: ENTRY.id, version: 3, location: null });
  });

  it("demande confirmation avant de supprimer", async () => {
    renderForm(ENTRY);
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(screen.getByText("Supprimer cette entrée ?")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderForm(ENTRY);
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
