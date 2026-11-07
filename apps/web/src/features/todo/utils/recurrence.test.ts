import { describe, expect, it } from "vitest";

import { recurrenceFromForm, recurrenceLabel } from "./recurrence";

describe("récurrence côté web", () => {
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

  it("lit le formulaire : « Jamais » ⇒ null, sinon rythme et intervalle", () => {
    const never = new FormData();
    never.set("repeat", "NONE");
    expect(recurrenceFromForm(never)).toBeNull();
    const weekly = new FormData();
    weekly.set("repeat", "WEEKLY");
    weekly.set("interval", "2");
    expect(recurrenceFromForm(weekly)).toEqual({ frequency: "WEEKLY", interval: 2 });
  });
});
