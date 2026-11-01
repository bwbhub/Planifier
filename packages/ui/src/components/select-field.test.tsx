import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { axeViolations } from "../testing/axe";
import { SelectField } from "./select-field";

const OPTIONS = [
  { value: "", label: "Personne" },
  { value: "a", label: "Alice" },
];

describe("SelectField", () => {
  it("relie le libellé et sélectionne la valeur par défaut", () => {
    render(<SelectField label="Assignée à" options={OPTIONS} defaultValue="a" />);
    expect(screen.getByRole("combobox", { name: "Assignée à" })).toHaveProperty("value", "a");
  });

  it("change de valeur au choix d'une option", async () => {
    render(<SelectField label="Assignée à" options={OPTIONS} />);
    const select = screen.getByRole("combobox", { name: "Assignée à" });
    await userEvent.selectOptions(select, "Alice");
    expect(select).toHaveProperty("value", "a");
  });

  it("annonce son erreur avec le champ", () => {
    render(<SelectField label="Assignée à" options={OPTIONS} error="Choisis une personne." />);
    const select = screen.getByRole("combobox", { name: "Assignée à" });
    expect(select.getAttribute("aria-invalid")).toBe("true");
    expect(
      document.getElementById(select.getAttribute("aria-describedby") ?? "")?.textContent,
    ).toBe("Choisis une personne.");
  });

  it("n'a pas de violation d'accessibilité", async () => {
    const { container } = render(<SelectField label="Assignée à" options={OPTIONS} error="Non." />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
