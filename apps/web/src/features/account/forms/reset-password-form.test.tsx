// @vitest-environment jsdom
import { AUTH_ERROR_CODES } from "@planifier/api-contract";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axeViolations } from "@planifier/ui/testing/axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ResetPasswordForm } from "./reset-password-form";

// Seule frontière simulée : le réseau (route de Better Auth derrière le proxy).
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const TOKEN = "jeton-du-lien";

function renderForm() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ResetPasswordForm token={TOKEN} />
    </QueryClientProvider>,
  );
}

async function submit(password: string) {
  if (password !== "") {
    await userEvent.type(screen.getByLabelText("Nouveau mot de passe"), password);
  }
  await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
}

describe("ResetPasswordForm", () => {
  it("refuse un mot de passe trop court sans appeler l'API", async () => {
    renderForm();
    await submit("court");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nouveau mot de passe").getAttribute("aria-invalid")).toBe("true");
  });

  it("enregistre le mot de passe avec le jeton du lien, puis propose de se connecter", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderForm();
    await submit("nouveau-secret-long");

    expect(await screen.findByRole("link", { name: "Me connecter" })).toBeDefined();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/auth/reset-password");
    expect(init?.body).toBe(JSON.stringify({ newPassword: "nouveau-secret-long", token: TOKEN }));
  });

  it("propose un nouveau lien quand celui-ci ne vaut plus rien", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ code: AUTH_ERROR_CODES.invalidToken }, { status: 400 }),
    );
    renderForm();
    await submit("nouveau-secret-long");

    expect((await screen.findByRole("alert")).textContent).toContain("Demande-en un nouveau");
  });

  it("ne présente aucune violation d'accessibilité, erreur affichée", async () => {
    const { container } = renderForm();
    await submit("");
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
