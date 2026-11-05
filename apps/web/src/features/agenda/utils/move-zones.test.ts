import { describe, expect, it } from "vitest";

import { minuteAt } from "./move-zones";

const SCALE = { firstHour: 8, hourHeight: 50 };

describe("minuteAt", () => {
  it("arrondit au quart d'heure depuis la première heure de la grille", () => {
    expect(minuteAt(160, SCALE)).toBe(11 * 60 + 15);
  });

  it("reste dans la journée", () => {
    expect(minuteAt(-500, SCALE)).toBe(0);
    expect(minuteAt(5000, SCALE)).toBe(1425);
  });
});
