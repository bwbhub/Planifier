import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import { TextField } from "./text-field";

// jsdom ne calcule pas les couleurs : le contraste est garanti par les tokens, pas vérifié ici.
const AXE_OPTIONS = { rules: { "color-contrast": { enabled: false } } };

describe("TextField", () => {
  it("relie le libellé au champ et reçoit la saisie", async () => {
    render(<TextField label="E-mail" name="email" />);
    const input = screen.getByLabelText("E-mail");

    await userEvent.type(input, "alice@example.test");

    expect(input).toHaveProperty("value", "alice@example.test");
  });

  it("annonce l'aide puis l'erreur avec le champ et le marque invalide", () => {
    render(<TextField label="Mot de passe" hint="8 caractères au moins" error="Trop court" />);
    const input = screen.getByLabelText("Mot de passe");

    expect(input.getAttribute("aria-invalid")).toBe("true");
    const description = (input.getAttribute("aria-describedby") ?? "")
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent);
    expect(description).toEqual(["8 caractères au moins", "Trop court"]);
  });

  it("n'est ni invalide ni décrit sans aide ni erreur", () => {
    render(<TextField label="Nom" />);
    const input = screen.getByLabelText("Nom");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
  });

  it("ne présente aucune violation d'accessibilité, avec ou sans erreur", async () => {
    const { container } = render(
      <>
        <TextField label="E-mail" type="email" autoComplete="email" />
        <TextField label="Mot de passe" type="password" error="Trop court" />
      </>,
    );
    const { violations } = await axe.run(container, AXE_OPTIONS);
    expect(violations).toEqual([]);
  });
});
