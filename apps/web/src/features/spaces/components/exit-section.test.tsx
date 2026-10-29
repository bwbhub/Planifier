// @vitest-environment jsdom
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { replyRpc } from "@/lib/testing/rpc-fetch";

import { ALICE, BOB, CLAIRE, SPACE_ID, spaceWith } from "../testing/space-fixtures";
import { ExitSection } from "./exit-section";

const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});
const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

afterEach(() => {
  vi.clearAllMocks();
});

function renderAs(meId: string, space: Parameters<typeof ExitSection>[0]["space"]) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ExitSection space={space} meId={meId} />
    </QueryClientProvider>,
  );
}

describe("ExitSection", () => {
  it("quitte après confirmation, puis revient à la liste", async () => {
    const calls = replyRpc(fetchMock, { "spaces/space/leave": { data: {} } });
    renderAs(ALICE.userId, spaceWith([CLAIRE, BOB, ALICE], "MEMBER"));
    expect(screen.queryByRole("button", { name: "Supprimer" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Quitter" }));
    expect(calls).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "Quitter l'Espace" }));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/espaces");
    });
    expect(calls).toEqual([{ path: "spaces/space/leave", input: { spaceId: SPACE_ID } }]);
  });

  it("explique au dernier propriétaire quoi faire, sans appeler l'API", async () => {
    renderAs(CLAIRE.userId, spaceWith([CLAIRE, ALICE]));
    await userEvent.click(screen.getByRole("button", { name: "Quitter" }));

    expect(screen.getByRole("alertdialog", { name: "Avant de partir" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Choisir un propriétaire" }).getAttribute("href")).toBe(
      "#membres",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("prévient la dernière personne que l'Espace sera supprimé", async () => {
    renderAs(CLAIRE.userId, spaceWith([CLAIRE]));
    await userEvent.click(screen.getByRole("button", { name: "Quitter" }));
    expect(screen.getByText(/il sera supprimé définitivement/)).toBeTruthy();
  });

  it("supprime l'Espace après confirmation (propriétaires)", async () => {
    const calls = replyRpc(fetchMock, { "spaces/space/delete": { data: {} } });
    renderAs(BOB.userId, spaceWith([CLAIRE, BOB, ALICE]));

    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(
      screen.getByRole("alertdialog", { name: "Supprimer « Coloc rue Pasteur » ?" }),
    ).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Supprimer définitivement" }));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/espaces");
    });
    expect(calls).toEqual([{ path: "spaces/space/delete", input: { spaceId: SPACE_ID } }]);
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderAs(BOB.userId, spaceWith([CLAIRE, BOB, ALICE]));
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
