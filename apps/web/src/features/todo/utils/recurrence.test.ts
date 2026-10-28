import { describe, expect, it } from "vitest";

import { recurrenceFromForm, recurrenceLabel } from "./recurrence";

describe("récurrence côté web", () => {
  it("dit la répétition en français, au bon genre", () => {
    expect(recurrenceLabel({ frequency: "WEEKLY", interval: 1 })).toBe("Toutes les semaines");
    expect(recurrenceLabel({ frequency: "DAILY", interval: 3 })).toBe("Tous les 3 jours");
    expect(recurrenceLabel({ frequency: "MONTHLY", interval: 1 })).toBe("Tous les mois");
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
