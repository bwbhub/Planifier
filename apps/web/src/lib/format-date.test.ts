import { describe, expect, it } from "vitest";

import { formatDay, formatTime } from "./format-date";

const NOW = new Date(2026, 9, 28);

describe("formatDay", () => {
  it("omet l'année courante", () => {
    expect(formatDay(new Date(2026, 6, 3), NOW)).toBe("3 juillet");
  });

  it("donne l'année quand elle diffère", () => {
    expect(formatDay(new Date(2025, 11, 31), NOW)).toBe("31 décembre 2025");
  });
});

describe("formatTime", () => {
  it("donne l'heure sur 24 h", () => {
    expect(formatTime(new Date(2026, 9, 28, 14, 2))).toBe("14:02");
  });
});
