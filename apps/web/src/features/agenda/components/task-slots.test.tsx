// @vitest-environment jsdom
import type { AgendaEntryOutput } from "@planifier/api-contract";
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { replyRpc } from "@/lib/testing/rpc-fetch";

import { TaskSlots } from "./task-slots";

const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});

afterEach(() => {
  vi.clearAllMocks();
});

const TASK = {
  id: "0199f3a2-7c4e-7d10-9a51-000000000010",
  title: "Dentiste",
  dueDate: "2026-11-12",
  dueTime: null,
};

const ENTRY: AgendaEntryOutput = {
  id: "0199f3a2-7c4e-7d10-9a51-000000000020",
  title: "RDV Dentiste",
  location: null,
  participants: [],
  when: { allDay: true, startDay: "2026-11-12", endDay: "2026-11-12" },
  description: null,
  tint: "general",
  hidden: false,
  taskId: TASK.id,
  imported: false,
  version: 1,
};

function renderSlots() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <TaskSlots task={TASK} />
    </QueryClientProvider>,
  );
}

describe("TaskSlots", () => {
  it("liste les créneaux liés à la tâche", async () => {
    const calls = replyRpc(fetchMock, {
      "agenda/entries/listForTask": { data: { items: [ENTRY] } },
    });
    renderSlots();
    expect(await screen.findByText("RDV Dentiste")).toBeTruthy();
    expect(screen.getByText(/Toute la journée/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /RDV Dentiste/ }).getAttribute("href")).toBe(
      "/agenda?jour=2026-11-12",
    );
    expect(calls).toContainEqual({
      path: "agenda/entries/listForTask",
      input: { taskId: TASK.id },
    });
  });

  it("propose le titre et le jour de la tâche, et lie le créneau créé", async () => {
    const calls = replyRpc(fetchMock, {
      "agenda/entries/listForTask": { data: { items: [] } },
      "agenda/entries/create": { data: ENTRY },
    });
    renderSlots();
    await userEvent.click(
      await screen.findByRole("button", { name: "Créer un créneau dans l'agenda" }),
    );
    expect(screen.getByLabelText("Titre")).toHaveProperty("value", "Dentiste");
    expect(screen.getByLabelText("Début")).toHaveProperty("value", "2026-11-12T09:00");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    await vi.waitFor(() => {
      expect(calls.some(({ path }) => path === "agenda/entries/create")).toBe(true);
    });
    const create = calls.find(({ path }) => path === "agenda/entries/create");
    expect(create?.input).toMatchObject({ title: "Dentiste", taskId: TASK.id });
  });

  it("propose l'heure d'échéance de la tâche comme début, pour une heure", async () => {
    replyRpc(fetchMock, { "agenda/entries/listForTask": { data: { items: [] } } });
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <TaskSlots task={{ ...TASK, dueTime: "14:30" }} />
      </QueryClientProvider>,
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Créer un créneau dans l'agenda" }),
    );
    expect(screen.getByLabelText("Début")).toHaveProperty("value", "2026-11-12T14:30");
    expect(screen.getByLabelText("Fin")).toHaveProperty("value", "2026-11-12T15:30");
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    replyRpc(fetchMock, { "agenda/entries/listForTask": { data: { items: [ENTRY] } } });
    renderSlots();
    await screen.findByText("RDV Dentiste");
    await expect(axeViolations(document.body)).resolves.toEqual([]);
  });
});
