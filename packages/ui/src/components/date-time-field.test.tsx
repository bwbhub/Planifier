import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { axeViolations } from "../testing/axe";
import { DateTimeField, type DateTimeValue } from "./date-time-field";

function Harness({
  initial = { date: null, time: null },
  onChange,
  error,
}: {
  initial?: DateTimeValue;
  onChange?: (value: DateTimeValue) => void;
  error?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <form aria-label="test">
      <DateTimeField
        label="Échéance"
        timeLabel="Heure"
        noTimeLabel="Sans heure"
        dateName="dueDate"
        timeName="dueTime"
        value={value}
        error={error}
        onChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
      />
    </form>
  );
}

describe("DateTimeField", () => {
  it("part sans heure : « Sans heure » cochée, pas de champ heure", () => {
    render(<Harness />);
    expect(screen.getByRole("checkbox", { name: "Sans heure" })).toHaveProperty("checked", true);
    expect(screen.queryByLabelText("Heure")).toBeNull();
  });

  it("révèle l'heure en décochant, et l'efface en recochant", async () => {
    const onChange = vi.fn<(value: DateTimeValue) => void>();
    render(<Harness initial={{ date: "2026-11-10", time: null }} onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Sans heure" }));
    const time = screen.getByLabelText("Heure");
    expect(onChange).toHaveBeenLastCalledWith({ date: "2026-11-10", time: null });
    await userEvent.type(time, "0930");
    expect(onChange).toHaveBeenLastCalledWith({ date: "2026-11-10", time: "09:30" });
    await userEvent.click(screen.getByRole("checkbox", { name: "Sans heure" }));
    expect(onChange).toHaveBeenLastCalledWith({ date: "2026-11-10", time: null });
    expect(screen.queryByLabelText("Heure")).toBeNull();
  });

  it("garde le champ heure ouvert quand on l'efface : l'appelant voit `null`", async () => {
    const onChange = vi.fn<(value: DateTimeValue) => void>();
    render(<Harness initial={{ date: "2026-11-10", time: "09:30" }} onChange={onChange} />);
    await userEvent.clear(screen.getByLabelText("Heure"));
    expect(onChange).toHaveBeenLastCalledWith({ date: "2026-11-10", time: null });
    expect(screen.getByLabelText("Heure")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Sans heure" })).toHaveProperty("checked", false);
  });

  it("rend le jour vidé comme `null`", async () => {
    const onChange = vi.fn<(value: DateTimeValue) => void>();
    render(<Harness initial={{ date: "2026-11-10", time: null }} onChange={onChange} />);
    await userEvent.clear(screen.getByLabelText("Échéance"));
    expect(onChange).toHaveBeenLastCalledWith({ date: null, time: null });
  });

  it("envoie le jour et l'heure dans FormData, l'heure seulement si saisie", async () => {
    render(<Harness initial={{ date: "2026-11-10", time: null }} />);
    const form = screen.getByRole("form");
    if (!(form instanceof HTMLFormElement)) throw new Error("formulaire attendu");
    expect([...new FormData(form).keys()]).toEqual(["dueDate"]);
    await userEvent.click(screen.getByRole("checkbox", { name: "Sans heure" }));
    await userEvent.type(screen.getByLabelText("Heure"), "0930");
    expect(Object.fromEntries(new FormData(form))).toEqual({
      dueDate: "2026-11-10",
      dueTime: "09:30",
    });
  });

  it("envoie une chaîne vide pour un jour vidé", async () => {
    render(<Harness initial={{ date: "2026-11-10", time: null }} />);
    await userEvent.clear(screen.getByLabelText("Échéance"));
    const form = screen.getByRole("form");
    if (!(form instanceof HTMLFormElement)) throw new Error("formulaire attendu");
    expect(Object.fromEntries(new FormData(form))).toEqual({ dueDate: "" });
  });

  it("relie l'aide au jour et désactive tout", () => {
    render(
      <DateTimeField
        label="Échéance"
        timeLabel="Heure"
        noTimeLabel="Sans heure"
        value={{ date: null, time: "09:30" }}
        onChange={vi.fn()}
        hint="Facultatif."
        disabled
      />,
    );
    const day = screen.getByLabelText("Échéance");
    const hintId = day.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(hintId)?.textContent).toBe("Facultatif.");
    for (const control of [day, screen.getByLabelText("Heure"), screen.getByRole("checkbox")]) {
      expect(control).toHaveProperty("disabled", true);
    }
  });

  it("annonce l'erreur avec le jour", () => {
    render(<Harness error="Choisis un jour valide." />);
    expect(screen.getByLabelText("Échéance").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Choisis un jour valide.")).toBeTruthy();
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = render(<Harness initial={{ date: "2026-11-10", time: "09:30" }} />);
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
