// @vitest-environment jsdom
import type { TodayTasksOutput } from "@planifier/api-contract";
import { ToastProvider } from "@planifier/ui/components/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { today } from "@/lib/format-date";
import { replyRpc } from "@/lib/testing/rpc-fetch";

import { agendaEntry, EMPTY_SECTION, todayTask } from "../testing/today-fixtures";
import { TodayView } from "./today-view";

const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});

afterEach(() => {
  vi.clearAllMocks();
});

const DAY = today();
const TASKS: TodayTasksOutput = {
  dueToday: {
    items: [
      todayTask({
        id: "0199f3a2-7c4e-7d10-9a51-000000000001",
        title: "Appeler le garagiste",
        dueDate: DAY,
      }),
    ],
    total: 1,
  },
  ongoing: EMPTY_SECTION,
  overdue: EMPTY_SECTION,
};

function show(modules: ("TODO" | "AGENDA")[], tasks: TodayTasksOutput = TASKS) {
  const calls = replyRpc(fetchMock, {
    "todo/tasks/today": { data: tasks },
    "agenda/entries/list": {
      data: {
        items: [agendaEntry({ id: "0199f3a2-7c4e-7d10-9a51-0000000000a1", title: "Dentiste" })],
        nextCursor: null,
      },
    },
    "todo/tasks/setDone": { data: todayTask({ id: "x", title: "x" }) },
  });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ToastProvider dismissLabel="Fermer">
        <TodayView name="Camille" modules={modules} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return calls;
}

describe("TodayView, selon les modules", () => {
  it("montre l'agenda et les tâches quand les deux modules sont activés", async () => {
    show(["TODO", "AGENDA"]);
    expect(await screen.findByText("Dentiste")).toBeTruthy();
    expect(await screen.findByText("Appeler le garagiste")).toBeTruthy();
    expect(screen.getByText("Bonjour, Camille")).toBeTruthy();
  });

  it("ne lit pas l'agenda quand Agenda est désactivé", async () => {
    const calls = show(["TODO"]);
    await screen.findByText("Appeler le garagiste");
    expect(calls.map(({ path }) => path)).toEqual(["todo/tasks/today"]);
  });

  it("ne lit pas les tâches quand Todo est désactivé", async () => {
    const calls = show(["AGENDA"]);
    await screen.findByText("Dentiste");
    expect(calls.map(({ path }) => path)).toEqual(["agenda/entries/list"]);
    expect(screen.queryByText("Du jour")).toBeNull();
  });
});

describe("TodayView, tâches", () => {
  it("coche une tâche au geste de l'utilisateur seulement", async () => {
    const calls = show(["TODO"]);
    const box = await screen.findByRole("checkbox", { name: "Appeler le garagiste" });
    expect(calls.map(({ path }) => path)).not.toContain("todo/tasks/setDone");
    await userEvent.click(box);
    expect(calls.find(({ path }) => path === "todo/tasks/setDone")?.input).toEqual({
      taskId: "0199f3a2-7c4e-7d10-9a51-000000000001",
      done: true,
    });
  });

  it("garde cinq tâches en retard puis déroule le reste sur place", async () => {
    const items = Array.from({ length: 7 }, (_, index) =>
      todayTask({
        id: `0199f3a2-7c4e-7d10-9a51-00000000010${String(index)}`,
        title: `Reprise ${String(index)}`,
        dueDate: "2020-01-01",
      }),
    );
    show(["TODO"], { ...TASKS, overdue: { items, total: 7 } });
    await screen.findByText("Reprise 0");
    expect(screen.queryByText("Reprise 6")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Voir les 2 autres" }));
    expect(screen.getByText("Reprise 6")).toBeTruthy();
  });

  it("reporte les tâches en retard au clic, avec l'horaire proposé", async () => {
    const overdue = todayTask({
      id: "0199f3a2-7c4e-7d10-9a51-000000000201",
      title: "Rendre le livre",
      dueDate: "2020-01-01",
      version: 3,
    });
    const calls = show(["TODO"], { ...TASKS, overdue: { items: [overdue], total: 1 } });
    fetchMock.mockClear();
    await screen.findByText("Rendre le livre");
    expect(calls.map(({ path }) => path)).not.toContain("todo/tasks/postpone");
    await userEvent.click(screen.getByRole("checkbox", { name: "Proposer un nouvel horaire" }));
    const postponeButton = screen.getByRole("button", { name: "Les reporter à aujourd'hui" });
    expect(postponeButton).toHaveProperty("disabled", true);
    await userEvent.type(screen.getByLabelText("Nouvel horaire"), "09:30");
    await userEvent.click(postponeButton);
    expect(calls.find(({ path }) => path === "todo/tasks/postpone")?.input).toEqual({
      date: DAY,
      time: "09:30",
      tasks: [{ taskId: overdue.id, version: 3 }],
    });
  });
});
