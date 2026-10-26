// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axeViolations } from "@planifier/ui/testing/axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SignUpForm } from "./sign-up-form";

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
      <SignUpForm />
    </QueryClientProvider>,
  );
}

async function fill(values: { name: string; email: string; password: string }) {
  if (values.name !== "") await userEvent.type(screen.getByLabelText("Ton nom"), values.name);
  if (values.email !== "") await userEvent.type(screen.getByLabelText("E-mail"), values.email);
  if (values.password !== "") {
    await userEvent.type(screen.getByLabelText("Mot de passe"), values.password);
  }
  await userEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));
}

describe("SignUpForm", () => {
  it("refuse un nom fait d'espaces et un mot de passe trop court, sans appeler l'API", async () => {
    renderForm();
    await fill({ name: "   ", email: "alice@example.test", password: "court" });

    expect(fetchMock).not.toHaveBeenCalled();
    const name = screen.getByLabelText("Ton nom");
    expect(name.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(name);
    expect(screen.getByLabelText("E-mail").hasAttribute("aria-invalid")).toBe(false);
    expect(screen.getByLabelText("Mot de passe").getAttribute("aria-invalid")).toBe("true");
  });

  it("crée le compte avec le nom nettoyé, puis annonce l'e-mail", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderForm();
    await fill({ name: " Alice ", email: "alice@example.test", password: "mot-de-passe" });

    expect((await screen.findByRole("status")).textContent).toContain(
      "Un e-mail vient de partir à alice@example.test",
    );
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/auth/sign-up/email");
    expect(init?.body).toBe(
      JSON.stringify({
        name: "Alice",
        email: "alice@example.test",
        password: "mot-de-passe",
        callbackURL: "/connexion",
      }),
    );
  });

  it("ne présente aucune violation d'accessibilité, erreurs affichées", async () => {
    const { container } = renderForm();
    await fill({ name: "", email: "", password: "" });
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
