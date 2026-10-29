import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { axeViolations } from "../testing/axe";
import { Button } from "./button";
import { Sheet } from "./sheet";

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

function renderSheet(open: boolean, onClose = vi.fn()) {
  return render(
    <Sheet
      open={open}
      onClose={onClose}
      role="alertdialog"
      title="Supprimer l'Espace ?"
      description="Pour tous ses membres."
    >
      <Button variant="strong">Supprimer définitivement</Button>
    </Sheet>,
  );
}

/** Ouvre une feuille que son bouton « Annuler » retire du document, comme le font les écrans de l'app. */
function Opener() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Gérer
      </Button>
      {open ? (
        <Sheet
          open
          title="Alice"
          onClose={() => {
            setOpen(false);
          }}
        >
          <Button
            onClick={() => {
              setOpen(false);
            }}
          >
            Annuler
          </Button>
        </Sheet>
      ) : null}
    </>
  );
}

describe("Sheet", () => {
  it("s'ouvre avec son titre et son explication comme nom et description", () => {
    renderSheet(true);
    const sheet = screen.getByRole("alertdialog", { name: "Supprimer l'Espace ?" });
    expect(sheet).toHaveProperty("open", true);
    expect(sheet.getAttribute("aria-describedby")).toBe(
      screen.getByText("Pour tous ses membres.").id,
    );
  });

  it("reste fermée tant que open vaut false", () => {
    renderSheet(false);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("prévient le parent quand l'utilisateur la ferme", () => {
    const onClose = vi.fn();
    renderSheet(true, onClose);
    fireEvent(screen.getByRole("alertdialog"), new Event("close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderSheet(true);
    await expect(axeViolations(container)).resolves.toEqual([]);
  });

  it("rend le focus à son déclencheur quand le parent la retire", async () => {
    render(<Opener />);
    const opener = screen.getByRole("button", { name: "Gérer" });
    await userEvent.click(opener);
    expect(screen.getByRole("dialog", { name: "Alice" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});
