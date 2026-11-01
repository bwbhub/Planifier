import { render, screen } from "@testing-library/react";
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

  it("n'a pas de violation d'accessibilité", async () => {
    const { container } = render(<SelectField label="Assignée à" options={OPTIONS} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
