import { describe, expect, it } from "vitest";

import { fromStoredRecurrence, toStoredRecurrence } from "./stored";

describe("forme stockée", () => {
  it("relit ce qu'elle écrit", () => {
    const rule = { frequency: "MONTHLY", interval: 2 } as const;
    expect(fromStoredRecurrence(toStoredRecurrence(rule))).toEqual(rule);
    expect(fromStoredRecurrence(null)).toBeNull();
  });

  it("refuse une version ou une valeur inconnue", () => {
    expect(() =>
      fromStoredRecurrence({ schemaVersion: 2, frequency: "DAILY", interval: 1 }),
    ).toThrow();
    expect(() =>
      fromStoredRecurrence({ schemaVersion: 1, frequency: "HOURLY", interval: 1 }),
    ).toThrow();
    expect(() =>
      fromStoredRecurrence({ schemaVersion: 1, frequency: "DAILY", interval: 0 }),
    ).toThrow();
  });
});
