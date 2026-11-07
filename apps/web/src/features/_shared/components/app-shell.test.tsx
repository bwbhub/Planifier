// @vitest-environment jsdom
import { axeViolations } from "@planifier/ui/testing/axe";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "./app-shell";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

function modulesNav() {
  return screen.queryByRole("navigation", { name: "Modules" });
}

describe("AppShell", () => {
  it("n'affiche que les modules activés qui ont un écran, dans l'ordre de la navigation", () => {
    pathname.current = "/";
    render(<AppShell modules={["EVENTS", "AGENDA", "TODO"]}>contenu</AppShell>);
    const links = within(modulesNav() ?? document.body).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Aujourd'hui", "Todo", "Agenda"]);
  });

  it("retire un module désactivé ; Aujourd'hui reste, ce n'est pas un module", () => {
    pathname.current = "/";
    const { rerender } = render(<AppShell modules={["AGENDA"]}>contenu</AppShell>);
    expect(screen.queryByRole("link", { name: "Todo" })).toBeNull();
    expect(screen.getByRole("link", { name: "Agenda" })).not.toBeNull();

    rerender(<AppShell modules={[]}>contenu</AppShell>);
    const links = within(modulesNav() ?? document.body).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Aujourd'hui"]);
  });

  it("montre le « + » donné par la couche app, sauf sur l'Agenda qui a son propre bouton", () => {
    pathname.current = "/todo";
    const { rerender } = render(
      <AppShell modules={["TODO", "AGENDA"]} create={<button>Ajouter</button>}>
        contenu
      </AppShell>,
    );
    expect(screen.getByRole("button", { name: "Ajouter" })).not.toBeNull();

    pathname.current = "/agenda";
    rerender(
      <AppShell modules={["TODO", "AGENDA"]} create={<button>Ajouter</button>}>
        contenu
      </AppShell>,
    );
    expect(screen.queryByRole("button", { name: "Ajouter" })).toBeNull();
  });

  it("marque la page courante, y compris sous une sous-page", () => {
    pathname.current = "/agenda";
    const { rerender } = render(<AppShell modules={["TODO", "AGENDA"]}>contenu</AppShell>);
    expect(screen.getByRole("link", { name: "Agenda" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Todo" }).hasAttribute("aria-current")).toBe(false);

    pathname.current = "/espaces/abc";
    rerender(<AppShell modules={["TODO", "AGENDA"]}>contenu</AppShell>);
    expect(screen.getByRole("link", { name: "Espaces" }).getAttribute("aria-current")).toBe("page");

    pathname.current = "/profil";
    rerender(<AppShell modules={["TODO", "AGENDA"]}>contenu</AppShell>);
    const profile = screen.getByRole("link", { name: "Profil" });
    expect(profile.getAttribute("href")).toBe("/profil");
    expect(profile.getAttribute("aria-current")).toBe("page");
  });

  it("ne confond pas /agenda avec une adresse qui ne fait que commencer pareil", () => {
    pathname.current = "/agenda-autre";
    render(<AppShell modules={["AGENDA"]}>contenu</AppShell>);
    expect(screen.getByRole("link", { name: "Agenda" }).hasAttribute("aria-current")).toBe(false);
  });

  it("rend la page et ne présente aucune violation d'accessibilité", async () => {
    pathname.current = "/todo";
    const { container } = render(<AppShell modules={["TODO", "AGENDA"]}>contenu</AppShell>);
    expect(screen.getByText("contenu")).not.toBeNull();
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
