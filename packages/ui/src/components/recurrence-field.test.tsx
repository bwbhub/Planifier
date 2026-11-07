import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { axeViolations } from "../testing/axe";
import { RecurrenceField } from "./recurrence-field";

function renderField(defaultValue = "NONE") {
  return render(
    <form aria-label="test">
      <RecurrenceField
        legend="Répéter"
        name="repeat"
        presets={[
          { value: "NONE", label: "Jamais" },
          { value: "DAILY", label: "Chaque jour" },
        ]}
        custom={{ value: "custom", label: "Personnalisée…" }}
        defaultValue={defaultValue}
      >
        <input aria-label="Intervalle" name="interval" />
      </RecurrenceField>
    </form>,
  );
}

describe("RecurrenceField", () => {
  it("propose les préréglages puis « Personnalisée… », sans panneau au départ", () => {
    renderField();
    expect(screen.getAllByRole("radio").map((radio) => radio.getAttribute("value"))).toEqual([
      "NONE",
      "DAILY",
      "custom",
    ]);
    expect(screen.getByRole("radio", { name: "Jamais" })).toHaveProperty("checked", true);
    expect(screen.queryByLabelText("Intervalle")).toBeNull();
  });

  it("montre le panneau pour « Personnalisée… » seulement", async () => {
    renderField();
    await userEvent.click(screen.getByRole("radio", { name: "Personnalisée…" }));
    expect(screen.getByLabelText("Intervalle")).toBeTruthy();
    await userEvent.click(screen.getByRole("radio", { name: "Chaque jour" }));
    expect(screen.queryByLabelText("Intervalle")).toBeNull();
  });

  it("s'ouvre sur le panneau quand le choix de départ est personnalisé, et l'envoie dans FormData", () => {
    renderField("custom");
    const form = screen.getByRole("form");
    if (!(form instanceof HTMLFormElement)) throw new Error("formulaire attendu");
    expect([...new FormData(form).keys()].sort()).toEqual(["interval", "repeat"]);
    expect(new FormData(form).get("repeat")).toBe("custom");
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderField("custom");
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
