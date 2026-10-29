import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { axeViolations } from "../testing/axe";
import { TextAreaField } from "./text-area-field";

describe("TextAreaField", () => {
  it("relie le libellé au champ et reçoit la saisie sur plusieurs lignes", async () => {
    render(<TextAreaField label="Description" name="description" />);
    const textarea = screen.getByLabelText("Description");

    await userEvent.type(textarea, "Ligne 1{enter}Ligne 2");

    expect(textarea).toHaveProperty("value", "Ligne 1\nLigne 2");
  });

  it("annonce l'erreur avec le champ et le marque invalide", () => {
    render(<TextAreaField label="Description" error="Trop longue" />);
    const textarea = screen.getByLabelText("Description");

    expect(textarea.getAttribute("aria-invalid")).toBe("true");
    const describedBy = textarea.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(describedBy)?.textContent).toBe("Trop longue");
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = render(<TextAreaField label="Description" hint="Facultative" />);
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
