import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { axeViolations } from "../testing/axe";
import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("est décochée par défaut et se coche au clic sur le libellé", async () => {
    render(<Checkbox label="Se souvenir de moi" name="remember" />);
    const box = screen.getByRole("checkbox", { name: "Se souvenir de moi" });
    expect(box).toHaveProperty("checked", false);

    await userEvent.click(screen.getByText("Se souvenir de moi"));
    expect(box).toHaveProperty("checked", true);
  });

  it("annonce l'aide avec la case", () => {
    render(<Checkbox label="Option" hint="Précision utile" />);
    const describedBy = screen.getByRole("checkbox").getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(describedBy)?.textContent).toBe("Précision utile");
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = render(<Checkbox label="Option" hint="Précision utile" />);
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
