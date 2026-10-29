// @vitest-environment jsdom
import { ORPCError } from "@orpc/client";
import type { SpaceOutput } from "@planifier/api-contract";
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { replyRpc } from "@/lib/testing/rpc-fetch";

import { SpaceForm } from "./space-form";

// Seule frontière simulée : le réseau (proxy `/rpc`), remplacé avant que le client oRPC ne le lise.
const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});
const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

afterEach(() => {
  vi.clearAllMocks();
});

const SPACE: SpaceOutput = {
  id: "0199f3a2-7c4e-7d10-9a51-3b2f6c8e1d40",
  name: "Coloc rue Pasteur",
  modules: ["TODO"],
  restrictVisibility: false,
  version: 3,
  myRole: "OWNER",
};

function renderForm(props: Parameters<typeof SpaceForm>[0] = {}) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <SpaceForm {...props} />
    </QueryClientProvider>,
  );
}

describe("SpaceForm, création", () => {
  it("n'appelle pas l'API et met le focus sur le nom quand il est vide", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Créer l'Espace" }));

    expect(fetchMock).not.toHaveBeenCalled();
    const name = screen.getByLabelText("Nom");
    expect(name.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(name);
  });

  it("propose Todo et Agenda cochés, et envoie seulement les modules gardés", async () => {
    const calls = replyRpc(fetchMock, { "spaces/space/create": { data: SPACE } });
    renderForm();

    expect(screen.getByRole("checkbox", { name: /Todo/ })).toHaveProperty("checked", true);
    expect(screen.getByRole("checkbox", { name: /Événements/ })).toHaveProperty("checked", false);
    await userEvent.type(screen.getByLabelText("Nom"), "  Coloc rue Pasteur ");
    await userEvent.click(screen.getByRole("checkbox", { name: /Agenda/ }));
    await userEvent.click(screen.getByRole("button", { name: "Créer l'Espace" }));

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith(`/espaces/${SPACE.id}`);
    });
    expect(calls).toEqual([
      { path: "spaces/space/create", input: { name: "Coloc rue Pasteur", modules: ["TODO"] } },
    ]);
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderForm();
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});

describe("SpaceForm, réglages", () => {
  it("envoie la version lue avec l'Espace", async () => {
    const calls = replyRpc(fetchMock, { "spaces/space/update": { data: SPACE } });
    renderForm({ space: SPACE });

    await userEvent.click(screen.getByRole("checkbox", { name: /Restreindre la visibilité/ }));
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith(`/espaces/${SPACE.id}`);
    });
    expect(calls[0]?.input).toEqual({
      spaceId: SPACE.id,
      version: 3,
      name: SPACE.name,
      modules: ["TODO"],
      restrictVisibility: true,
    });
  });

  it("propose de recharger quand quelqu'un a modifié l'Espace entre-temps", async () => {
    replyRpc(fetchMock, {
      "spaces/space/update": {
        error: new ORPCError("CONFLICT", { data: { reason: "STALE_VERSION" } }),
      },
    });
    const onReload = vi.fn();
    renderForm({ space: SPACE, onReload });

    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await userEvent.click(await screen.findByRole("button", { name: "Recharger l'Espace" }));

    expect(screen.getByRole("alert").textContent).toContain(
      "Tes changements n'ont pas été enregistrés",
    );
    expect(onReload).toHaveBeenCalledOnce();
    expect(router.push).not.toHaveBeenCalled();
  });
});
