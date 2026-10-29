// @vitest-environment jsdom
import { AUTH_ERROR_CODES } from "@planifier/api-contract";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axeViolations } from "@planifier/ui/testing/axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ReturnPath } from "@/lib/routes";

import { SignInForm } from "./sign-in-form";

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

function renderForm(returnTo: ReturnPath | null = null) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <SignInForm returnTo={returnTo} />
    </QueryClientProvider>,
  );
}

async function fill(email: string, password: string) {
  if (email !== "") await userEvent.type(screen.getByLabelText("E-mail"), email);
  if (password !== "") await userEvent.type(screen.getByLabelText("Mot de passe"), password);
  await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));
}

describe("SignInForm", () => {
  it("n'appelle pas l'API et met le focus sur le premier champ invalide", async () => {
    renderForm();
    await fill("pas-un-email", "");

    expect(fetchMock).not.toHaveBeenCalled();
    const email = screen.getByLabelText("E-mail");
    expect(email.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(email);
    expect(screen.getByLabelText("Mot de passe").getAttribute("aria-invalid")).toBe("true");
  });

  it("envoie l'e-mail nettoyé puis ouvre l'accueil", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderForm();
    await fill("  alice@example.test ", "mot-de-passe");

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/");
    });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/auth/sign-in/email");
    expect(init?.body).toBe(
      JSON.stringify({
        email: "alice@example.test",
        password: "mot-de-passe",
        callbackURL: "/connexion",
      }),
    );
  });

  it("ramène au lien d'invitation, fragment compris, quand la connexion vient de là", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    window.location.hash = "#jeton-du-lien";
    renderForm("/rejoindre");
    await fill("alice@example.test", "mot-de-passe");

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/rejoindre#jeton-du-lien");
    });
    window.location.hash = "";
  });

  it("annonce un refus sans quitter l'écran", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ code: AUTH_ERROR_CODES.invalidCredentials }, { status: 401 }),
    );
    renderForm();
    await fill("alice@example.test", "mauvais");

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "E-mail ou mot de passe incorrect.",
    );
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("ne présente aucune violation d'accessibilité, erreurs affichées", async () => {
    const { container } = renderForm();
    await fill("", "");
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
