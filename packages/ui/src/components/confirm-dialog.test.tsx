import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { axeViolations } from "../testing/axe";
import { ConfirmDialog, type ConfirmDialogProps } from "./confirm-dialog";

// jsdom n'implémente pas l'ouverture modale de <dialog> : on la simule (le vrai comportement est couvert en E2E).
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});

function renderDialog(props: Partial<ConfirmDialogProps> = {}) {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  render(
    <ConfirmDialog
      title="Supprimer la tâche ?"
      description="Ses sous-tâches partent avec elle."
      confirmLabel="Supprimer définitivement"
      pendingLabel="Suppression…"
      cancelLabel="Garder la tâche"
      pending={false}
      onConfirm={onConfirm}
      onClose={onClose}
      {...props}
    />,
  );
  return { onConfirm, onClose };
}

describe("ConfirmDialog", () => {
  it("s'annonce comme une alerte nommée par son titre", () => {
    renderDialog();
    const dialog = screen.getByRole("alertdialog", { name: "Supprimer la tâche ?" });
    expect(dialog.getAttribute("aria-describedby")).not.toBeNull();
  });

  it("confirme d'un clic, ou renonce", async () => {
    const { onConfirm, onClose } = renderDialog();
    await userEvent.click(screen.getByRole("button", { name: "Supprimer définitivement" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Garder la tâche" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("affiche l'état d'envoi et ne laisse pas confirmer deux fois", () => {
    renderDialog({ pending: true });
    expect(screen.getByRole("button", { name: "Suppression…" })).toHaveProperty("disabled", true);
  });

  it("confirmation renforcée : inactive tant que la case n'est pas cochée", async () => {
    const { onConfirm } = renderDialog({ acknowledgement: "Je comprends que c'est définitif" });
    const confirm = screen.getByRole("button", { name: "Supprimer définitivement" });
    expect(confirm).toHaveProperty("disabled", true);
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Je comprends que c'est définitif" }),
    );
    expect(confirm).toHaveProperty("disabled", false);
    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("montre l'erreur reçue", () => {
    renderDialog({ error: <p role="alert">Rien n'a été supprimé.</p> });
    expect(screen.getByRole("alert").textContent).toBe("Rien n'a été supprimé.");
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    renderDialog({ acknowledgement: "Je comprends" });
    await expect(axeViolations(document.body)).resolves.toEqual([]);
  });
});
