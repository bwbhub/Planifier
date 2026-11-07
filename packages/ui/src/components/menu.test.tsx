import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { axeViolations } from "../testing/axe";
import { Menu } from "./menu";

function renderMenu() {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <main>
      <Menu
        label="Actions de « Acheter du pain »"
        trigger="⋯"
        items={[
          { key: "edit", label: "Modifier", onSelect: onEdit },
          { key: "skip", label: "Indisponible", onSelect: vi.fn(), disabled: true },
          { key: "delete", label: "Supprimer", onSelect: onDelete },
        ]}
      />
      <button>Ailleurs</button>
    </main>,
  );
  return { onEdit, onDelete, trigger: screen.getByRole("button", { name: /^Actions de/ }) };
}

describe("Menu", () => {
  it("annonce un menu replié, puis déplié, au clic sur son bouton", async () => {
    const { trigger } = renderMenu();
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("menu")).toBeNull();
    await userEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("menu", { name: "Actions de « Acheter du pain »" })).toBeTruthy();
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
  });

  it("est hors du flux dès son rendu : la page ne change pas de hauteur à l'ouverture", async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    expect(screen.getByRole("menu").classList.contains("fixed")).toBe(true);
  });

  it("met le focus sur la première action ouverte", async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Modifier" }));
  });

  it("circule aux flèches, saute l'action indisponible et reboucle", async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Supprimer" }));
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Modifier" }));
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Supprimer" }));
  });

  it("Début et Fin vont à la première et à la dernière action", async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Supprimer" }));
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Modifier" }));
  });

  it("s'ouvre au clavier : flèche bas sur la première, flèche haut sur la dernière", async () => {
    const { trigger } = renderMenu();
    trigger.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Supprimer" }));
  });

  it("flèche bas sur le bouton ouvre sur la première action", async () => {
    const { trigger } = renderMenu();
    trigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Modifier" }));
    expect(trigger.getAttribute("aria-controls")).toBe(screen.getByRole("menu").id);
  });
});

describe("Menu : fermeture", () => {
  it("Tab ferme et rend le focus au bouton, d'où il repart", async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.tab();
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Ailleurs" }));
  });

  it("ne déclenche pas une action indisponible", async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    const locked = screen.getByRole("menuitem", { name: "Indisponible" });
    expect(locked).toHaveProperty("disabled", true);
    await userEvent.click(locked);
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("se ferme quand la page défile ou change de taille (il ne suit pas son bouton)", async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(screen.queryByRole("menu")).toBeNull();
    await userEvent.click(trigger);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("démonté ouvert, ne laisse pas d'écouteur derrière lui", async () => {
    const remove = vi.spyOn(document, "removeEventListener");
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    cleanup();
    expect(remove).toHaveBeenCalledWith("pointerdown", expect.any(Function));
    remove.mockRestore();
  });

  it("Échap ferme et rend le focus au bouton", async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("exécute l'action choisie, ferme et rend le focus au bouton", async () => {
    const { trigger, onDelete } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Supprimer" }));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("ferme sur un clic ailleurs, sans exécuter d'action", async () => {
    const { trigger, onEdit } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: "Ailleurs" }));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    await expect(axeViolations(document.body)).resolves.toEqual([]);
  });
});
