// @vitest-environment jsdom
import { ORPCError } from "@orpc/client";
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { replyRpc } from "@/lib/testing/rpc-fetch";

import { SPACE_ID } from "../testing/space-fixtures";
import { SpacesList } from "./spaces-list";

const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});

afterEach(() => {
  vi.clearAllMocks();
});

const SUMMARY = { id: SPACE_ID, name: "Coloc rue Pasteur", myRole: "OWNER", memberCount: 3 };

function renderList() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <SpacesList />
    </QueryClientProvider>,
  );
}

describe("SpacesList", () => {
  it("liste mes Espaces, avec un lien vers chacun", async () => {
    replyRpc(fetchMock, { "spaces/space/list": { data: { items: [SUMMARY], nextCursor: null } } });
    renderList();

    const link = await screen.findByRole("link", { name: /Coloc rue Pasteur/ });
    expect(link.getAttribute("href")).toBe(`/espaces/${SPACE_ID}`);
    expect(screen.getByText("3 personnes")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Afficher plus" })).toBeNull();
  });

  it("explique les Espaces quand je n'en ai aucun", async () => {
    replyRpc(fetchMock, { "spaces/space/list": { data: { items: [], nextCursor: null } } });
    renderList();
    expect(await screen.findByRole("heading", { name: "Partager, si tu veux" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Créer un Espace" })).toBeTruthy();
  });

  it("propose de réessayer quand la liste n'a pas pu être lue", async () => {
    replyRpc(fetchMock, { "spaces/space/list": { error: new ORPCError("INTERNAL_SERVER_ERROR") } });
    renderList();
    expect(await screen.findByRole("button", { name: "Réessayer" })).toBeTruthy();
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    replyRpc(fetchMock, { "spaces/space/list": { data: { items: [SUMMARY], nextCursor: null } } });
    const { container } = renderList();
    await screen.findByRole("link", { name: /Coloc rue Pasteur/ });
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
