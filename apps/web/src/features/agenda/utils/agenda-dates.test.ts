import { describe, expect, it } from "vitest";

import { fullDayLabel, periodLabel, toLocalInput, weekdayLabel } from "./agenda-dates";

describe("périodes de l'agenda", () => {
  it("écrit le jour en toutes lettres", () => {
    expect(fullDayLabel("2026-10-12")).toBe("lundi 12 octobre");
    expect(weekdayLabel("2026-10-12")).toBe("Lun");
  });

  it("nomme la période de chaque vue", () => {
    const week = ["2026-10-12", "2026-10-18"];
    expect(periodLabel("DAY", ["2026-10-15"], "2026-10-15")).toBe("Jeudi 15 octobre");
    expect(periodLabel("WEEK", week, "2026-10-15")).toBe("12 au 18 octobre 2026");
    expect(periodLabel("MONTH", week, "2026-10-15")).toBe("Octobre 2026");
  });

  it("nomme les deux mois d'une semaine à cheval", () => {
    expect(periodLabel("WEEK", ["2026-10-26", "2026-11-01"], "2026-10-28")).toBe(
      "26 octobre au 1 novembre 2026",
    );
  });

  it("écrit une date pour un champ datetime-local", () => {
    expect(toLocalInput(new Date("2026-11-05T09:05"))).toBe("2026-11-05T09:05");
  });
});
