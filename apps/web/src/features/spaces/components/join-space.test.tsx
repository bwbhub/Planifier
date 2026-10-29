// @vitest-environment jsdom
import { ORPCError } from "@orpc/client";
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { replyRpc } from "@/lib/testing/rpc-fetch";

import { JoinSpace } from "./join-space";

const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});
const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const TOKEN = "Hq3vY0dK2mZr8s_LpQw-1nTe5uXbC7aJ4oGfIhE9x9A";
const SPACE_ID = "0199f3a2-7c4e-7d10-9a51-3b2f6c8e1d40";
const PREVIEW = { spaceId: SPACE_ID, spaceName: "Vacances Ardèche", memberCount: 4 };

afterEach(() => {
  vi.clearAllMocks();
  window.location.hash = "";
});

function renderAt(hash: string) {
  window.location.hash = hash;
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <JoinSpace />
    </QueryClientProvider>,
  );
}

describe("JoinSpace", () => {
  it("dit que le lien ne marche plus quand le fragment est absent, sans appeler l'API", () => {
    renderAt("");
    expect(screen.getByRole("heading", { name: "Ce lien ne marche plus" })).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("montre l'Espace, puis le rejoint seulement au clic", async () => {
    const calls = replyRpc(fetchMock, {
      "spaces/invites/preview": { data: { ...PREVIEW, alreadyMember: false } },
      "spaces/invites/accept": { data: { spaceId: SPACE_ID } },
    });
    renderAt(`#${TOKEN}`);

    expect(await screen.findByRole("heading", { name: "Vacances Ardèche" })).toBeTruthy();
    expect(calls.map((call) => call.path)).toEqual(["spaces/invites/preview"]);
    await userEvent.click(screen.getByRole("button", { name: "Rejoindre l'Espace" }));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith(`/espaces/${SPACE_ID}`);
    });
    // L'aperçu n'est pas relu après l'arrivée : il dirait « déjà membre » le temps de partir.
    expect(calls).toEqual([
      { path: "spaces/invites/preview", input: { token: TOKEN } },
      { path: "spaces/invites/accept", input: { token: TOKEN } },
    ]);
  });

  it("retire le jeton de l'adresse une fois lu, sans perdre l'invitation", async () => {
    replyRpc(fetchMock, {
      "spaces/invites/preview": { data: { ...PREVIEW, alreadyMember: false } },
    });
    renderAt(`#${TOKEN}`);

    expect(await screen.findByRole("heading", { name: "Vacances Ardèche" })).toBeTruthy();
    expect(window.location.hash).toBe("");
    expect(screen.getByRole("button", { name: "Rejoindre l'Espace" })).toBeTruthy();
  });

  it("dit que le lien ne marche plus quand l'API ne le reconnaît pas", async () => {
    replyRpc(fetchMock, { "spaces/invites/preview": { error: new ORPCError("NOT_FOUND") } });
    renderAt(`#${TOKEN}`);
    expect(await screen.findByRole("heading", { name: "Ce lien ne marche plus" })).toBeTruthy();
  });

  it("ouvre l'Espace sans consommer le lien quand on en fait déjà partie", async () => {
    const calls = replyRpc(fetchMock, {
      "spaces/invites/preview": { data: { ...PREVIEW, alreadyMember: true } },
    });
    renderAt(`#${TOKEN}`);

    const open = await screen.findByRole("link", { name: "Ouvrir l'Espace" });
    expect(open.getAttribute("href")).toBe(`/espaces/${SPACE_ID}`);
    expect(calls.map((call) => call.path)).toEqual(["spaces/invites/preview"]);
  });

  it("explique que l'Espace est complet quand l'API refuse l'arrivée", async () => {
    replyRpc(fetchMock, {
      "spaces/invites/preview": { data: { ...PREVIEW, alreadyMember: false } },
      "spaces/invites/accept": {
        error: new ORPCError("CONFLICT", { data: { reason: "SPACE_FULL" } }),
      },
    });
    renderAt(`#${TOKEN}`);

    await userEvent.click(await screen.findByRole("button", { name: "Rejoindre l'Espace" }));
    expect(await screen.findByRole("heading", { name: "Cet Espace est complet" })).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    replyRpc(fetchMock, {
      "spaces/invites/preview": { data: { ...PREVIEW, alreadyMember: false } },
    });
    const { container } = renderAt(`#${TOKEN}`);
    await screen.findByRole("heading", { name: "Vacances Ardèche" });
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
