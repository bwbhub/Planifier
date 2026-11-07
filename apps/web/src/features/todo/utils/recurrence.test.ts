import type { TaskOutput } from "@planifier/api-contract";
import { describe, expect, it } from "vitest";

import { recurrenceChange, recurrenceFromForm, repeatChoiceOf } from "./recurrence";

describe("répétition du formulaire", () => {
  it("lit le formulaire : « Jamais » ⇒ null, un préréglage ⇒ tous les 1", () => {
    const never = new FormData();
    never.set("repeat", "NONE");
    expect(recurrenceFromForm(never)).toBeNull();
    const weekly = new FormData();
    weekly.set("repeat", "WEEKLY");
    expect(recurrenceFromForm(weekly)).toEqual({ frequency: "WEEKLY", interval: 1 });
  });

  it("lit la règle personnalisée : rythme, intervalle, jours seulement par semaines", () => {
    const custom = new FormData();
    custom.set("repeat", "custom");
    custom.set("customFrequency", "WEEKLY");
    custom.set("interval", "2");
    custom.append("weekdays", "MONDAY");
    custom.append("weekdays", "THURSDAY");
    expect(recurrenceFromForm(custom)).toEqual({
      frequency: "WEEKLY",
      interval: 2,
      weekdays: ["MONDAY", "THURSDAY"],
    });
    custom.set("customFrequency", "MONTHLY");
    expect(recurrenceFromForm(custom)).toEqual({ frequency: "MONTHLY", interval: 2 });
  });

  it("choisit le préréglage d'une règle simple, la personnalisée sinon", () => {
    expect(repeatChoiceOf(null)).toBe("NONE");
    expect(repeatChoiceOf({ frequency: "DAILY", interval: 1 })).toBe("DAILY");
    expect(repeatChoiceOf({ frequency: "DAILY", interval: 3 })).toBe("custom");
    expect(repeatChoiceOf({ frequency: "WEEKLY", interval: 1, weekdays: ["TUESDAY"] })).toBe(
      "custom",
    );
  });

  it("n'envoie rien pour la répétition tant qu'elle n'a pas changé (ancre gardée), jours dans n'importe quel ordre", () => {
    const rule: NonNullable<TaskOutput["recurrence"]> = {
      frequency: "WEEKLY",
      interval: 1,
      weekdays: ["TUESDAY", "THURSDAY"],
    };
    expect(
      recurrenceChange(rule, {
        frequency: "WEEKLY",
        interval: 1,
        weekdays: ["THURSDAY", "TUESDAY"],
      }),
    ).toBeUndefined();
    expect(
      recurrenceChange(rule, { frequency: "WEEKLY", interval: 1, weekdays: ["TUESDAY"] }),
    ).toEqual({ frequency: "WEEKLY", interval: 1, weekdays: ["TUESDAY"] });
    expect(recurrenceChange(rule, { frequency: "WEEKLY", interval: 1 })).toEqual({
      frequency: "WEEKLY",
      interval: 1,
    });
    expect(recurrenceChange(null, null)).toBeUndefined();
  });

  it("envoie la nouvelle règle, ou null quand on choisit « Jamais »", () => {
    const monthly = { frequency: "MONTHLY", interval: 1 } as const;
    expect(recurrenceChange({ frequency: "WEEKLY", interval: 1 }, monthly)).toEqual(monthly);
    expect(recurrenceChange(null, monthly)).toEqual(monthly);
    expect(recurrenceChange({ frequency: "WEEKLY", interval: 1 }, null)).toBeNull();
  });
});
