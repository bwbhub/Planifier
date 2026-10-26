// @vitest-environment jsdom
import { AUTH_ERROR_CODES } from "@planifier/api-contract";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axeViolations } from "@planifier/ui/testing/axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PasswordForm } from "./password-form";

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
      <PasswordForm />
    </QueryClientProvider>,
  );
}

async function fill(values: { current: string; next: string }) {
  if (values.current !== "") {
    await userEvent.type(screen.getByLabelText("Mot de passe actuel"), values.current);
  }
  if (values.next !== "") {
    await userEvent.type(screen.getByLabelText("Nouveau mot de passe"), values.next);
  }
  await userEvent.click(screen.getByRole("button", { name: "Changer le mot de passe" }));
}

describe("PasswordForm", () => {
  it("refuse un nouveau mot de passe trop court sans appeler l'API", async () => {
    renderForm();
    await fill({ current: "mot-de-passe", next: "court" });

    expect(fetchMock).not.toHaveBeenCalled();
    const next = screen.getByLabelText("Nouveau mot de passe");
    expect(next.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(next);
  });

  it("change le mot de passe en fermant les autres sessions, puis vide les champs", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderForm();
    await fill({ current: "mot-de-passe", next: "nouveau-mot-de-passe" });

    expect((await screen.findByRole("status")).textContent).toContain("autres appareils");
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/auth/change-password");
    expect(init?.body).toBe(
      JSON.stringify({
        currentPassword: "mot-de-passe",
        newPassword: "nouveau-mot-de-passe",
        revokeOtherSessions: true,
      }),
    );
    expect(screen.getByLabelText("Mot de passe actuel")).toHaveProperty("value", "");
  });

  it("dit que le mot de passe actuel est faux et garde la saisie", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ code: AUTH_ERROR_CODES.invalidPassword }, { status: 400 }),
    );
    renderForm();
    await fill({ current: "pas-le-bon", next: "nouveau-mot-de-passe" });

    expect((await screen.findByRole("alert")).textContent).toBe("Mot de passe actuel incorrect.");
    expect(screen.getByLabelText("Nouveau mot de passe")).toHaveProperty(
      "value",
      "nouveau-mot-de-passe",
    );
  });

  it("ne présente aucune violation d'accessibilité, erreurs affichées", async () => {
    const { container } = renderForm();
    await fill({ current: "", next: "" });
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
