// @vitest-environment jsdom
import type { ListListsOutput, TodoListOutput } from "@planifier/api-contract";
import { ToastProvider } from "@planifier/ui/components/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { replyRpc } from "@/lib/testing/rpc-fetch";

import { TodoView } from "./todo-view";

const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/todo",
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

function listWith(id: string, name: string): TodoListOutput {
  return {
    id,
    name,
    tint: "general",
    version: 1,
    openTaskCount: 0,
    space: null,
    readOnlySpace: null,
    can: { write: true, delete: true, share: true },
  };
}

const FIRST = listWith("0199f3a2-7c4e-7d10-9a51-000000000001", "Maison");
const LATER = listWith("0199f3a2-7c4e-7d10-9a51-000000000002", "Vacances");

describe("TodoView, liste de l'adresse", () => {
  it("lit les pages suivantes jusqu'à la liste demandée, au lieu de montrer la première", async () => {
    const pages: ListListsOutput[] = [
      { items: [FIRST], nextCursor: FIRST.id },
      { items: [LATER], nextCursor: null },
    ];
    let page = 0;
    const calls = replyRpc(fetchMock, {
      get "todo/lists/list"() {
        return { data: pages[page++] };
      },
      "todo/tasks/list": { data: { items: [] } },
    });
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <ToastProvider dismissLabel="Fermer">
          <TodoView selectedListId={LATER.id} />
        </ToastProvider>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole("heading", { name: "Vacances" })).toBeTruthy();
    expect(calls).toContainEqual({ path: "todo/lists/list", input: { cursor: FIRST.id } });
  });
});
