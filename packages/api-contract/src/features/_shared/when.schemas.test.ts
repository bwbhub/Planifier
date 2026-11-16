import { WHEN_MAX_DAYS } from "@planifier/constants/days";
import { describe, expect, it } from "vitest";

import { whenInputSchema, whenOutputSchema } from "./when.schemas";

const timed = (startsAt: string, endsAt: string) => ({
  allDay: false,
  startsAt: new Date(startsAt),
  endsAt: new Date(endsAt),
});
const allDay = (startDay: string, endDay: string) => ({ allDay: true, startDay, endDay });

describe("whenInputSchema", () => {
  it("accepte un horaire dont la fin suit le début", () => {
    expect(
      whenInputSchema.safeParse(timed("2026-11-22T19:30:00Z", "2026-11-22T23:30:00Z")).success,
    ).toBe(true);
  });

  it("refuse un horaire dont la fin ne suit pas le début", () => {
    expect(
      whenInputSchema.safeParse(timed("2026-11-22T19:30:00Z", "2026-11-22T19:30:00Z")).success,
    ).toBe(false);
    expect(
      whenInputSchema.safeParse(timed("2026-11-22T19:30:00Z", "2026-11-22T18:00:00Z")).success,
    ).toBe(false);
  });

  it("accepte un seul jour, ou plusieurs, à la journée", () => {
    expect(whenInputSchema.safeParse(allDay("2026-12-13", "2026-12-13")).success).toBe(true);
    expect(whenInputSchema.safeParse(allDay("2026-12-13", "2026-12-14")).success).toBe(true);
  });

  it("refuse un dernier jour avant le premier", () => {
    expect(whenInputSchema.safeParse(allDay("2026-12-14", "2026-12-13")).success).toBe(false);
  });

  it("borne la durée à WHEN_MAX_DAYS, horaire ou à la journée", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = (days: number) => new Date(start.getTime() + days * 86_400_000).toISOString();
    expect(whenInputSchema.safeParse(timed(start.toISOString(), end(WHEN_MAX_DAYS))).success).toBe(
      true,
    );
    expect(
      whenInputSchema.safeParse(timed(start.toISOString(), end(WHEN_MAX_DAYS + 1))).success,
    ).toBe(false);
    // Jours comptés des deux bouts : du 2026-01-01 au 2027-01-01, 366 jours, c'est le maximum.
    expect(whenInputSchema.safeParse(allDay("2026-01-01", "2027-01-01")).success).toBe(true);
    expect(whenInputSchema.safeParse(allDay("2026-01-01", "2027-01-02")).success).toBe(false);
  });

  it("refuse un mélange d'horaire et de jours", () => {
    expect(
      whenInputSchema.safeParse({
        ...timed("2026-11-22T19:30:00Z", "2026-11-22T20:30:00Z"),
        startDay: "2026-11-22",
      }).success,
    ).toBe(false);
  });
});

describe("whenOutputSchema", () => {
  it("relit sans borne de durée un élément plus long que l'écriture ne le permet (importé)", () => {
    expect(whenOutputSchema.safeParse(allDay("2020-01-01", "2026-12-31")).success).toBe(true);
  });
});
