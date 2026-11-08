// @vitest-environment jsdom
import { AUTH_ERROR_CODES } from "@planifier/api-contract";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axeViolations } from "@planifier/ui/testing/axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChangeEmailForm } from "./change-email-form";

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
      <ChangeEmailForm currentEmail="eve@example.test" />
    </QueryClientProvider>,
  );
}

async function fill(values: { email: string; password: string }) {
  if (values.email !== "") {
    await userEvent.type(screen.getByLabelText("Nouvelle adresse e-mail"), values.email);
  }
  if (values.password !== "") {
    await userEvent.type(screen.getByLabelText("Mot de passe actuel"), values.password);
  }
  await userEvent.click(screen.getByRole("button", { name: "Changer l'adresse" }));
}

describe("ChangeEmailForm", () => {
  it("refuse une adresse invalide ou un mot de passe vide sans appeler l'API", async () => {
    renderForm();
    await fill({ email: "pas-une-adresse", password: "" });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nouvelle adresse e-mail").getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(screen.getByLabelText("Mot de passe actuel").getAttribute("aria-invalid")).toBe("true");
  });

  it("envoie la demande avec le mot de passe, puis annonce le lien sans promettre le changement", async () => {
    fetchMock.mockResolvedValue(Response.json({ status: true }));
    renderForm();
    await fill({ email: "nouvelle@example.test", password: "mot-de-passe" });

    const notice = (await screen.findByRole("status")).textContent;
    expect(notice).toContain("nouvelle@example.test");
    expect(notice).toContain("eve@example.test");
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/auth/change-email");
    expect(init?.body).toBe(
      JSON.stringify({
        newEmail: "nouvelle@example.test",
        currentPassword: "mot-de-passe",
        callbackURL: "/profil",
      }),
    );
  });

  it("dit que le mot de passe actuel est faux et garde la saisie", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ code: AUTH_ERROR_CODES.invalidPassword }, { status: 400 }),
    );
    renderForm();
    await fill({ email: "nouvelle@example.test", password: "pas-le-bon" });

    expect((await screen.findByRole("alert")).textContent).toBe("Mot de passe actuel incorrect.");
    expect(screen.getByLabelText("Nouvelle adresse e-mail")).toHaveProperty(
      "value",
      "nouvelle@example.test",
    );
  });

  it("ne présente aucune violation d'accessibilité, erreurs affichées", async () => {
    const { container } = renderForm();
    await fill({ email: "", password: "" });
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
