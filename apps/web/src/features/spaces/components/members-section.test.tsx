// @vitest-environment jsdom
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { replyRpc } from "@/lib/testing/rpc-fetch";

import { ALICE, BOB, CLAIRE, SPACE_ID, spaceWith } from "../testing/space-fixtures";
import { MembersSection } from "./members-section";

const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderAs(meId: string, space = spaceWith([CLAIRE, BOB, ALICE])) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MembersSection space={space} meId={meId} />
    </QueryClientProvider>,
  );
}

describe("MembersSection", () => {
  it("propose de gérer les autres membres, jamais soi-même ni le créateur", () => {
    renderAs(BOB.userId);
    expect(screen.getByRole("button", { name: "Gérer Alice" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Gérer Claire" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Gérer Bob" })).toBeNull();
    expect(screen.getByText("Bob (toi)")).toBeTruthy();
  });

  it("ne propose rien à un membre simple", () => {
    renderAs(ALICE.userId, spaceWith([CLAIRE, BOB, ALICE], "MEMBER"));
    expect(screen.queryByRole("button", { name: /^Gérer/ })).toBeNull();
  });

  it("nomme propriétaire au clic, puis rend le focus au bouton « Gérer »", async () => {
    const calls = replyRpc(fetchMock, { "spaces/members/setRole": { data: {} } });
    renderAs(BOB.userId);
    const manage = screen.getByRole("button", { name: "Gérer Alice" });

    await userEvent.click(manage);
    await userEvent.click(screen.getByRole("button", { name: "Nommer propriétaire" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(calls).toEqual([
      {
        path: "spaces/members/setRole",
        input: { spaceId: SPACE_ID, userId: ALICE.userId, role: "OWNER" },
      },
    ]);
    expect(document.activeElement).toBe(manage);
  });

  it("ne retire un membre qu'après confirmation", async () => {
    const calls = replyRpc(fetchMock, { "spaces/members/remove": { data: {} } });
    renderAs(BOB.userId);

    await userEvent.click(screen.getByRole("button", { name: "Gérer Alice" }));
    await userEvent.click(screen.getByRole("button", { name: "Retirer de l'Espace" }));
    expect(screen.getByRole("alertdialog", { name: "Retirer Alice ?" })).toBeTruthy();
    expect(calls).toEqual([]);

    await userEvent.click(screen.getByRole("button", { name: "Retirer de l'Espace" }));
    await waitFor(() => {
      expect(calls).toEqual([
        { path: "spaces/members/remove", input: { spaceId: SPACE_ID, userId: ALICE.userId } },
      ]);
    });
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderAs(BOB.userId);
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
