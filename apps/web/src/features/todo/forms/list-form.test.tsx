// @vitest-environment jsdom
import type { SpaceSummaryOutput, TodoListOutput } from "@planifier/api-contract";
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { replyRpc } from "@/lib/testing/rpc-fetch";

import { LIST_ID } from "../testing/task-fixtures";
import { ListForm } from "./list-form";

const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});

afterEach(() => {
  vi.clearAllMocks();
});

const COLOC_ID = "0199f3a2-7c4e-7d10-9a51-00000000c010";

function spaceWith(fields: Partial<SpaceSummaryOutput>): SpaceSummaryOutput {
  return {
    id: COLOC_ID,
    name: "Coloc",
    modules: ["TODO"],
    myRole: "MEMBER",
    memberCount: 3,
    ...fields,
  };
}

const SPACES = {
  items: [
    spaceWith({}),
    spaceWith({
      id: "0199f3a2-7c4e-7d10-9a51-00000000a6e0",
      name: "Agenda seul",
      modules: ["AGENDA"],
    }),
  ],
  nextCursor: null,
};

const LIST: TodoListOutput = {
  id: LIST_ID,
  name: "Courses",
  tint: "general",
  version: 1,
  openTaskCount: 0,
  space: { id: COLOC_ID, name: "Coloc" },
  can: { delete: true, share: true },
};

function renderForm(list?: TodoListOutput) {
  const onSaved = vi.fn();
  const view = render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ListForm list={list} onSaved={onSaved} onCancel={vi.fn()} />
    </QueryClientProvider>,
  );
  return { ...view, onSaved };
}

describe("ListForm, partage avec un Espace", () => {
  it("propose les Espaces où Todo est activé et crée la liste partagée", async () => {
    const calls = replyRpc(fetchMock, {
      "spaces/space/list": { data: SPACES },
      "todo/lists/create": { data: LIST },
    });
    const { onSaved } = renderForm();
    await userEvent.type(screen.getByRole("textbox", { name: /Nom de la liste/ }), "Courses");
    await userEvent.click(await screen.findByRole("radio", { name: "Coloc" }));
    expect(screen.queryByRole("radio", { name: "Agenda seul" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Créer la liste" }));
    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });
    expect(calls).toContainEqual({
      path: "todo/lists/create",
      input: { name: "Courses", tint: "general", spaceId: COLOC_ID },
    });
  });

  it("crée une liste perso sans Espace par défaut", async () => {
    const calls = replyRpc(fetchMock, {
      "spaces/space/list": { data: SPACES },
      "todo/lists/create": { data: { ...LIST, space: null } },
    });
    renderForm();
    await userEvent.type(screen.getByRole("textbox", { name: /Nom de la liste/ }), "Moi");
    expect(await screen.findByRole("radio", { name: "Personne" })).toHaveProperty("checked", true);
    await userEvent.click(screen.getByRole("button", { name: "Créer la liste" }));
    await waitFor(() => {
      expect(calls).toContainEqual({
        path: "todo/lists/create",
        input: { name: "Moi", tint: "general" },
      });
    });
  });

  it("rend la liste perso, et n'envoie pas l'Espace s'il ne change pas", async () => {
    const calls = replyRpc(fetchMock, {
      "spaces/space/list": { data: SPACES },
      "todo/lists/update": { data: { ...LIST, space: null, version: 2 } },
    });
    const { onSaved } = renderForm(LIST);
    await userEvent.click(await screen.findByRole("radio", { name: "Personne" }));
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });
    expect(calls).toContainEqual({
      path: "todo/lists/update",
      input: { name: "Courses", tint: "general", spaceId: null, listId: LIST_ID, version: 1 },
    });
  });

  it("ne propose pas le partage à qui n'est pas propriétaire de la liste", async () => {
    const calls = replyRpc(fetchMock, {
      "spaces/space/list": { data: SPACES },
      "todo/lists/update": { data: { ...LIST, version: 2 } },
    });
    renderForm({ ...LIST, can: { delete: false, share: false } });
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => {
      expect(calls).toContainEqual({
        path: "todo/lists/update",
        input: { name: "Courses", tint: "general", listId: LIST_ID, version: 1 },
      });
    });
    expect(screen.queryByRole("group", { name: "Partager avec" })).toBeNull();
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    replyRpc(fetchMock, { "spaces/space/list": { data: SPACES } });
    const { container } = renderForm();
    await screen.findByRole("group", { name: "Partager avec" });
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
