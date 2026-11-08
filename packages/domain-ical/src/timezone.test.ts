import { describe, expect, it } from "vitest";

import { wallTimeToInstant } from "./timezone";

const wall = (month: number, day: number, hour: number) => ({
  year: 2026,
  month,
  day,
  hour,
  minute: 0,
  second: 0,
});

describe("wallTimeToInstant", () => {
  it("applique le décalage d'hiver et d'été", () => {
    expect(wallTimeToInstant(wall(1, 15, 9), "Europe/Paris")?.toISOString()).toBe(
      "2026-01-15T08:00:00.000Z",
    );
    expect(wallTimeToInstant(wall(7, 15, 9), "Europe/Paris")?.toISOString()).toBe(
      "2026-07-15T07:00:00.000Z",
    );
    expect(wallTimeToInstant(wall(7, 15, 9), "America/New_York")?.toISOString()).toBe(
      "2026-07-15T13:00:00.000Z",
    );
  });

  it("décale après le saut une heure qui n'existe pas (passage à l'heure d'été)", () => {
    // 29 mars 2026, 02:00 à Paris n'existe pas : 03:00 locale, soit 01:00 UTC.
    expect(wallTimeToInstant(wall(3, 29, 2), "Europe/Paris")?.toISOString()).toBe(
      "2026-03-29T01:00:00.000Z",
    );
  });

  it("prend la première des deux heures quand elle est double (retour à l'heure d'hiver)", () => {
    // 25 octobre 2026, 02:30 à Paris existe deux fois : 00:30Z (été), puis 01:30Z (hiver).
    const at = wallTimeToInstant({ ...wall(10, 25, 2), minute: 30 }, "Europe/Paris");
    expect(at?.toISOString()).toBe("2026-10-25T00:30:00.000Z");
  });

  it("rend null pour un fuseau inconnu", () => {
    expect(wallTimeToInstant(wall(1, 15, 9), "Mars/Olympus")).toBeNull();
  });
});
