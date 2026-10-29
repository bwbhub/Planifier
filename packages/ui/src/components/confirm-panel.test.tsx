import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { axeViolations } from "../testing/axe";
import { ConfirmPanel } from "./confirm-panel";

function renderPanel(pending = false) {
  const onConfirm = vi.fn();
  const onKeep = vi.fn();
  const { container } = render(
    <ConfirmPanel
      question="Supprimer « Courses » ?"
      confirmLabel="Supprimer définitivement"
      keepLabel="Garder la liste"
      pending={pending}
      onConfirm={onConfirm}
      onKeep={onKeep}
    />,
  );
  return { container, onConfirm, onKeep };
}

describe("ConfirmPanel", () => {
  it("donne le focus à la sortie douce, nommée par la question", () => {
    renderPanel();
    expect(screen.getByRole("group", { name: "Supprimer « Courses » ?" })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Garder la liste" }));
  });

  it("confirme ou garde selon le bouton", async () => {
    const { onConfirm, onKeep } = renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Garder la liste" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer définitivement" }));
    expect(onKeep).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("bloque la confirmation pendant l'envoi", () => {
    renderPanel(true);
    expect(screen.getByRole("button", { name: "Supprimer définitivement" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderPanel();
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
