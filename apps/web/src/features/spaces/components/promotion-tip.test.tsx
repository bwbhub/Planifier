// @vitest-environment jsdom
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { replyRpc } from "@/lib/testing/rpc-fetch";

import { ALICE, BOB, CLAIRE, SPACE_ID, spaceWith } from "../testing/space-fixtures";
import { PromotionTip } from "./promotion-tip";

const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderTip(space: Parameters<typeof PromotionTip>[0]["space"]) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <PromotionTip space={space} />
    </QueryClientProvider>,
  );
}

describe("PromotionTip", () => {
  it("ne propose rien hors d'un Espace à deux avec un seul propriétaire", () => {
    renderTip(spaceWith([CLAIRE, BOB, ALICE]));
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("ne nomme l'autre propriétaire qu'au clic", async () => {
    const calls = replyRpc(fetchMock, { "spaces/members/setRole": { data: {} } });
    renderTip(spaceWith([CLAIRE, ALICE]));
    expect(calls).toEqual([]);

    await userEvent.click(screen.getByRole("button", { name: "Nommer Alice propriétaire" }));
    await waitFor(() => {
      expect(calls).toEqual([
        {
          path: "spaces/members/setRole",
          input: { spaceId: SPACE_ID, userId: ALICE.userId, role: "OWNER" },
        },
      ]);
    });
  });

  it("se masque sur « Plus tard », sans rien changer", async () => {
    renderTip(spaceWith([CLAIRE, ALICE]));
    await userEvent.click(screen.getByRole("button", { name: "Plus tard" }));
    expect(screen.queryByRole("complementary", { name: "Proposition" })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderTip(spaceWith([CLAIRE, ALICE]));
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
