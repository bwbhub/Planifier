import { describe, expect, it } from "vitest";

import { recurrenceLabel } from "./recurrence-label";

describe("libellé de répétition", () => {
  it("dit la répétition en français, au bon genre", () => {
    expect(recurrenceLabel({ frequency: "WEEKLY", interval: 1 })).toBe("Toutes les semaines");
    expect(recurrenceLabel({ frequency: "DAILY", interval: 3 })).toBe("Tous les 3 jours");
    expect(recurrenceLabel({ frequency: "MONTHLY", interval: 1 })).toBe("Tous les mois");
  });

  it("dit les jours de la semaine : « Tous les mardis », « Toutes les 2 semaines, le lundi et le jeudi »", () => {
    expect(recurrenceLabel({ frequency: "WEEKLY", interval: 1, weekdays: ["TUESDAY"] })).toBe(
      "Tous les mardis",
    );
    expect(
      recurrenceLabel({ frequency: "WEEKLY", interval: 1, weekdays: ["MONDAY", "THURSDAY"] }),
    ).toBe("Tous les lundis et jeudis");
    expect(
      recurrenceLabel({
        frequency: "WEEKLY",
        interval: 1,
        weekdays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
      }),
    ).toBe("Tous les lundis, mercredis et vendredis");
    expect(
      recurrenceLabel({ frequency: "WEEKLY", interval: 2, weekdays: ["MONDAY", "THURSDAY"] }),
    ).toBe("Toutes les 2 semaines, le lundi et le jeudi");
  });
});
