import { describe, expect, it } from "vitest";

import type { Recurrence } from "./recurrence";
import { fromStoredRecurrence, toStoredRecurrence } from "./stored";

describe("forme stockée", () => {
  it("relit ce qu'elle écrit", () => {
    const rule = { frequency: "MONTHLY", interval: 2 } as const;
    expect(fromStoredRecurrence(toStoredRecurrence(rule))).toEqual(rule);
    expect(fromStoredRecurrence(null)).toBeNull();
  });

  it("écrit la dernière version, jours rangés dans l'ordre de la semaine et sans doublon", () => {
    const rule: Recurrence = {
      frequency: "WEEKLY",
      interval: 1,
      weekdays: ["THURSDAY", "MONDAY", "THURSDAY"],
    };
    expect(toStoredRecurrence(rule)).toEqual({
      schemaVersion: 2,
      frequency: "WEEKLY",
      interval: 1,
      weekdays: ["MONDAY", "THURSDAY"],
    });
    expect(fromStoredRecurrence(toStoredRecurrence(rule))).toEqual({
      frequency: "WEEKLY",
      interval: 1,
      weekdays: ["MONDAY", "THURSDAY"],
    });
  });

  it("relit une règle de la première version, sans jours", () => {
    expect(fromStoredRecurrence({ schemaVersion: 1, frequency: "WEEKLY", interval: 2 })).toEqual({
      frequency: "WEEKLY",
      interval: 2,
    });
  });

  it("refuse une version ou une valeur inconnue", () => {
    expect(() =>
      fromStoredRecurrence({ schemaVersion: 3, frequency: "DAILY", interval: 1 }),
    ).toThrow();
    expect(() =>
      fromStoredRecurrence({ schemaVersion: 2, frequency: "WEEKLY", interval: 1, weekdays: [] }),
    ).toThrow();
    expect(() =>
      fromStoredRecurrence({
        schemaVersion: 1,
        frequency: "WEEKLY",
        interval: 1,
        weekdays: ["MONDAY"],
      }),
    ).toThrow();
    expect(() =>
      fromStoredRecurrence({ schemaVersion: 1, frequency: "HOURLY", interval: 1 }),
    ).toThrow();
    expect(() =>
      fromStoredRecurrence({ schemaVersion: 1, frequency: "DAILY", interval: 0 }),
    ).toThrow();
  });
});
