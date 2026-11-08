import { describe, expect, it } from "vitest";

import { fetchedLabel } from "./import-age";

const NOW = new Date("2026-11-08T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms);

describe("fetchedLabel", () => {
  it("dit qu'un agenda n'a pas encore été lu", () => {
    expect(fetchedLabel(null, NOW)).toBe("Pas encore actualisé");
  });

  it("parle en minutes, heures puis jours", () => {
    expect(fetchedLabel(ago(10_000), NOW)).toBe("Actualisé à l'instant");
    expect(fetchedLabel(ago(5 * 60_000), NOW)).toBe("Actualisé il y a 5 minutes");
    expect(fetchedLabel(ago(3 * 3_600_000), NOW)).toBe("Actualisé il y a 3 heures");
    expect(fetchedLabel(ago(2 * 86_400_000), NOW)).toBe("Actualisé avant-hier");
  });
});
