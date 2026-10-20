import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

// jsdom ne calcule pas les couleurs : le contraste est garanti par les tokens, pas vérifié ici.
const AXE_OPTIONS = { rules: { "color-contrast": { enabled: false } } };

describe("Button", () => {
  it("déclenche l'action au clic et au clavier", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Enregistrer</Button>);
    const button = screen.getByRole("button", { name: "Enregistrer" });

    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("n'envoie pas de formulaire sauf si type=submit", () => {
    render(<Button>Annuler</Button>);
    expect(screen.getByRole("button", { name: "Annuler" })).toHaveProperty("type", "button");
  });

  it("ignore le clic quand il est désactivé", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Enregistrer
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = render(<Button variant="secondary">Annuler</Button>);
    const { violations } = await axe.run(container, AXE_OPTIONS);
    expect(violations).toEqual([]);
  });
});
