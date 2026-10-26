// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axeViolations } from "@planifier/ui/testing/axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileForm } from "./profile-form";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

// Seule frontière simulée : le réseau (route de Better Auth derrière le proxy).
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function renderForm() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ProfileForm name="Alice" preferredTheme="SYSTEM" />
    </QueryClientProvider>,
  );
}

const save = () => userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

describe("ProfileForm", () => {
  it("part des valeurs du compte", () => {
    renderForm();
    expect(screen.getByLabelText("Ton nom")).toHaveProperty("value", "Alice");
    expect(screen.getByRole("radio", { name: "Comme l'appareil" })).toHaveProperty("checked", true);
  });

  it("refuse un nom vide sans appeler l'API", async () => {
    renderForm();
    await userEvent.clear(screen.getByLabelText("Ton nom"));
    await save();

    expect(fetchMock).not.toHaveBeenCalled();
    const name = screen.getByLabelText("Ton nom");
    expect(name.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(name);
  });

  it("enregistre le nom nettoyé et le thème, puis relit les pages serveur", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderForm();
    await userEvent.type(screen.getByLabelText("Ton nom"), " B ");
    await userEvent.click(screen.getByText("Nuit"));
    await save();

    expect((await screen.findByRole("status")).textContent).toBe("C'est enregistré.");
    expect(router.refresh).toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/auth/update-user");
    expect(init?.body).toBe(JSON.stringify({ name: "Alice B", preferredTheme: "DARK" }));
  });

  it("annonce un échec sans relire les pages", async () => {
    fetchMock.mockResolvedValue(Response.json({}, { status: 500 }));
    renderForm();
    await save();

    expect((await screen.findByRole("alert")).textContent).toContain("Réessaie");
    await waitFor(() => {
      expect(router.refresh).not.toHaveBeenCalled();
    });
  });

  it("ne présente aucune violation d'accessibilité, erreur affichée", async () => {
    const { container } = renderForm();
    await userEvent.clear(screen.getByLabelText("Ton nom"));
    await save();
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
