// @vitest-environment jsdom
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { replyRpc } from "@/lib/testing/rpc-fetch";

import { SPACE_ID } from "../testing/space-fixtures";
import { InvitesSection } from "./invites-section";

const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});

afterEach(() => {
  vi.clearAllMocks();
});

const TOKEN = "Hq3vY0dK2mZr8s_LpQw-1nTe5uXbC7aJ4oGfIhE9x9A";
const INVITE = {
  id: "0199f3a2-7c4e-7d10-9a51-0000000000aa",
  createdAt: new Date("2026-10-20T08:30:00Z"),
  expiresAt: new Date("2026-10-27T08:30:00Z"),
};

function renderSection() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <InvitesSection spaceId={SPACE_ID} />
    </QueryClientProvider>,
  );
}

describe("InvitesSection", () => {
  it("montre le lien créé une seule fois, dans une feuille", async () => {
    replyRpc(fetchMock, {
      "spaces/invites/list": { data: { items: [] } },
      "spaces/invites/create": { data: { ...INVITE, token: TOKEN } },
    });
    renderSection();

    await userEvent.click(screen.getByRole("button", { name: "Créer un lien" }));
    expect(await screen.findByRole("dialog", { name: "Ton lien est prêt" })).toBeTruthy();
    expect(screen.getByLabelText("Lien d'invitation")).toHaveProperty(
      "value",
      `${window.location.origin}/rejoindre#${TOKEN}`,
    );
  });

  it("ne révoque un lien qu'après confirmation", async () => {
    const calls = replyRpc(fetchMock, {
      "spaces/invites/list": { data: { items: [INVITE] } },
      "spaces/invites/revoke": { data: {} },
    });
    renderSection();

    await userEvent.click(await screen.findByRole("button", { name: /^Révoquer le lien créé/ }));
    expect(screen.getByRole("alertdialog", { name: "Révoquer ce lien ?" })).toBeTruthy();
    expect(calls.map((call) => call.path)).toEqual(["spaces/invites/list"]);

    await userEvent.click(screen.getByRole("button", { name: "Révoquer" }));
    await waitFor(() => {
      expect(calls).toContainEqual({
        path: "spaces/invites/revoke",
        input: { spaceId: SPACE_ID, inviteId: INVITE.id },
      });
    });
  });

  it("garde le lien quand on renonce", async () => {
    const calls = replyRpc(fetchMock, { "spaces/invites/list": { data: { items: [INVITE] } } });
    renderSection();

    await userEvent.click(await screen.findByRole("button", { name: /^Révoquer le lien créé/ }));
    await userEvent.click(screen.getByRole("button", { name: "Garder le lien" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(calls.map((call) => call.path)).toEqual(["spaces/invites/list"]);
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    replyRpc(fetchMock, { "spaces/invites/list": { data: { items: [INVITE] } } });
    const { container } = renderSection();
    await screen.findByRole("button", { name: /^Révoquer le lien créé/ });
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
