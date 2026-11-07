import { describe, expect, it } from "vitest";

import { recurrenceChange, recurrenceFromForm, recurrenceLabel } from "./recurrence";

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

  it("n'envoie rien pour la répétition tant qu'elle n'a pas changé (jours et ancre gardés)", () => {
    const tuesdays = { frequency: "WEEKLY", interval: 1, weekdays: ["TUESDAY"] } as const;
    expect(
      recurrenceChange(
        { ...tuesdays, weekdays: ["TUESDAY"] },
        { frequency: "WEEKLY", interval: 1 },
      ),
    ).toBeUndefined();
    expect(recurrenceChange(null, null)).toBeUndefined();
  });

  it("envoie la nouvelle règle, ou null quand on choisit « Jamais »", () => {
    const monthly = { frequency: "MONTHLY", interval: 1 } as const;
    expect(recurrenceChange({ frequency: "WEEKLY", interval: 1 }, monthly)).toEqual(monthly);
    expect(recurrenceChange(null, monthly)).toEqual(monthly);
    expect(recurrenceChange({ frequency: "WEEKLY", interval: 1 }, null)).toBeNull();
  });
});
