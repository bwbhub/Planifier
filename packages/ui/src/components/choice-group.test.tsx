import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { axeViolations } from "../testing/axe";
import { ChoiceGroup } from "./choice-group";

const OPTIONS = [
  { value: "SYSTEM", label: "Comme l'appareil" },
  { value: "LIGHT", label: "Clair" },
  { value: "DARK", label: "Nuit" },
] as const;

function renderInForm() {
  render(
    <form aria-label="Réglages">
      <ChoiceGroup legend="Thème" name="theme" options={OPTIONS} defaultValue="LIGHT" />
    </form>,
  );
  const form = screen.getByRole("form");
  if (!(form instanceof HTMLFormElement)) throw new Error("formulaire attendu");
  return form;
}

describe("ChoiceGroup", () => {
  it("coche la valeur par défaut et donne au groupe son nom", () => {
    renderInForm();
    expect(screen.getByRole("group", { name: "Thème" })).toBeDefined();
    expect(screen.getByRole("radio", { name: "Clair" })).toHaveProperty("checked", true);
  });

  it("change de valeur au clic, lisible dans le formulaire", async () => {
    const form = renderInForm();

    await userEvent.click(screen.getByText("Nuit"));
    expect(new FormData(form).get("theme")).toBe("DARK");

    await userEvent.click(screen.getByText("Comme l'appareil"));
    expect(new FormData(form).get("theme")).toBe("SYSTEM");
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    renderInForm();
    await expect(axeViolations(document.body)).resolves.toEqual([]);
  });
});
