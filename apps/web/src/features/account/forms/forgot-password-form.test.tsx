// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axeViolations } from "@planifier/ui/testing/axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ForgotPasswordForm } from "./forgot-password-form";

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
      <ForgotPasswordForm />
    </QueryClientProvider>,
  );
}

async function submit(email: string) {
  if (email !== "") await userEvent.type(screen.getByLabelText("E-mail"), email);
  await userEvent.click(screen.getByRole("button", { name: "Recevoir un lien" }));
}

describe("ForgotPasswordForm", () => {
  it("refuse une adresse invalide sans appeler l'API", async () => {
    renderForm();
    await submit("pas-une-adresse");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText("E-mail").getAttribute("aria-invalid")).toBe("true");
  });

  it("demande le lien vers la page du nouveau mot de passe, puis le dit sans révéler si le compte existe", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderForm();
    await submit("eve@example.test");

    expect((await screen.findByRole("status")).textContent).toContain(
      "Si un compte existe avec eve@example.test",
    );
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/auth/request-password-reset");
    expect(init?.body).toBe(
      JSON.stringify({ email: "eve@example.test", redirectTo: "/nouveau-mot-de-passe" }),
    );
  });

  it("ne présente aucune violation d'accessibilité, erreur affichée", async () => {
    const { container } = renderForm();
    await submit("");
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
