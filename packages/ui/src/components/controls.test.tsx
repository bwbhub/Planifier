import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { axeViolations } from "../testing/axe";
import { Badge } from "./badge";
import { Button } from "./button";
import { SegmentedControl } from "./segmented-control";
import { Switch } from "./switch";
import { Tabs } from "./tabs";

const VIEWS = [
  { value: "day", label: "Jour" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
] as const;

function ControlledSegments() {
  const [value, setValue] = useState<"day" | "week" | "month">("day");
  return (
    <SegmentedControl
      label="Vue"

      options={VIEWS}
      value={value}
      onValueChange={setValue}
    />
  );
}

function ControlledTabs() {
  const [value, setValue] = useState("a");
  return (
    <Tabs
      label="Listes"
      tabs={[
        { value: "a", label: "Courses", count: 3 },
        { value: "b", label: "Travail" },
        { value: "c", label: "Voyage" },
      ]}
      value={value}
      onValueChange={setValue}
    >
      Contenu {value}
    </Tabs>
  );
}

describe("Switch", () => {
  it("est éteint par défaut, s'allume au clic sur le libellé et se lit comme un interrupteur", async () => {
    render(<Switch label="Rappels" name="reminders" hint="Un rappel la veille." />);
    const control = screen.getByRole("switch", { name: "Rappels" });
    expect(control).toHaveProperty("checked", false);

    await userEvent.click(screen.getByText("Rappels"));
    expect(control).toHaveProperty("checked", true);
    expect(control.getAttribute("aria-describedby")).not.toBeNull();
  });

  it("se bascule au clavier et reste inerte une fois désactivé", async () => {
    render(
      <>
        <Switch label="Actif" />
        <Switch label="Verrouillé" disabled />
      </>,
    );
    await userEvent.tab();
    await userEvent.keyboard(" ");
    expect(screen.getByRole("switch", { name: "Actif" })).toHaveProperty("checked", true);

    await userEvent.click(screen.getByText("Verrouillé"));
    expect(screen.getByRole("switch", { name: "Verrouillé" })).toHaveProperty("checked", false);
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = render(<Switch label="Rappels" hint="Un rappel la veille." />);
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});

describe("SegmentedControl", () => {
  it("annonce le groupe, coche la vue courante et change de vue au clic", async () => {
    render(<ControlledSegments />);
    expect(screen.getByRole("radiogroup", { name: "Vue" })).not.toBeNull();
    expect(screen.getByRole("radio", { name: "Jour" })).toHaveProperty("checked", true);

    await userEvent.click(screen.getByText("Mois"));
    expect(screen.getByRole("radio", { name: "Mois" })).toHaveProperty("checked", true);
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = render(<ControlledSegments />);
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});

describe("Tabs", () => {
  it("relie l'onglet choisi à son panneau et n'en laisse qu'un dans l'ordre de tabulation", () => {
    render(<ControlledTabs />);
    const selected = screen.getByRole("tab", { name: /Courses/ });
    expect(selected.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Travail" }).getAttribute("tabindex")).toBe("-1");
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(selected.id);
    expect(selected.getAttribute("aria-controls")).toBe(screen.getByRole("tabpanel").id);
  });

  it("passe d'un onglet à l'autre aux flèches, en bouclant, et suit Début et Fin", async () => {
    render(<ControlledTabs />);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Voyage" }).getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Voyage" }));

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /Courses/ }).getAttribute("aria-selected")).toBe("true");

    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tabpanel").textContent).toBe("Contenu c");
    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("tabpanel").textContent).toBe("Contenu a");
  });

  it("lit le compteur avec le libellé, n'écrit pas un zéro et ne présente aucune violation d'accessibilité", async () => {
    const { container } = render(<ControlledTabs />);
    expect(screen.getByRole("tab", { name: "Courses 3" })).not.toBeNull();
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});

describe("Badge", () => {
  it("écrit son texte, quelle que soit la teinte", () => {
    render(<Badge tone="strong">3 non lues</Badge>);
    expect(screen.getByText("3 non lues")).not.toBeNull();
  });
});

describe("Button chargement", () => {
  it("devient inerte et annonce l'attente, sans lancer l'action", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Enregistrer
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Enregistrer" });
    expect(button).toHaveProperty("disabled", true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
