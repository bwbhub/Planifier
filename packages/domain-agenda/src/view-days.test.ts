import { describe, expect, it } from "vitest";

import { stepDay, viewDays } from "./view-days";

describe("viewDays", () => {
  it("montre le seul jour en vue Jour", () => {
    expect(viewDays("DAY", "2026-11-04")).toEqual(["2026-11-04"]);
  });

  it("commence la semaine le lundi, même un dimanche", () => {
    const days = viewDays("WEEK", "2026-11-08");
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-11-02");
    expect(days[6]).toBe("2026-11-08");
  });

  it("couvre des semaines entières en vue Mois", () => {
    const days = viewDays("MONTH", "2026-11-15");
    expect(days[0]).toBe("2026-10-26");
    expect(days.at(-1)).toBe("2026-12-06");
    expect(days).toHaveLength(42);
  });

  it("se contente de quatre semaines pour un février qui tombe juste", () => {
    expect(viewDays("MONTH", "2027-02-10")).toHaveLength(28);
  });
});

describe("stepDay", () => {
  it("avance d'un jour et d'une semaine", () => {
    expect(stepDay("DAY", "2026-12-31", 1)).toBe("2027-01-01");
    expect(stepDay("WEEK", "2026-11-04", -1)).toBe("2026-10-28");
  });

  it("garde le dernier jour d'un mois plus court", () => {
    expect(stepDay("MONTH", "2026-01-31", 1)).toBe("2026-02-28");
    expect(stepDay("MONTH", "2026-03-31", -1)).toBe("2026-02-28");
  });

  it("passe l'année", () => {
    expect(stepDay("MONTH", "2026-12-15", 1)).toBe("2027-01-15");
    expect(stepDay("MONTH", "2026-01-15", -1)).toBe("2025-12-15");
  });
});
