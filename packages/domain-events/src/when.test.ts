import { describe, expect, it } from "vitest";

import { isUpcoming, startKeyOf, type EventWhen } from "./when";

const timed = (start: string, end: string, openEnd = false): EventWhen => ({
  allDay: false,
  startsAt: new Date(start),
  endsAt: new Date(end),
  openEnd,
});
const allDay = (startDay: string, endDay: string): EventWhen => ({
  allDay: true,
  startDay,
  endDay,
});

describe("startKeyOf", () => {
  it("prend le début d'un événement horaire", () => {
    expect(startKeyOf(timed("2026-11-22T19:30:00Z", "2026-11-22T23:30:00Z"))).toEqual(
      new Date("2026-11-22T19:30:00Z"),
    );
  });

  it("prend minuit UTC du premier jour d'un événement à la journée", () => {
    expect(startKeyOf(allDay("2026-12-13", "2026-12-14"))).toEqual(
      new Date("2026-12-13T00:00:00Z"),
    );
  });
});

describe("isUpcoming", () => {
  const now = new Date("2026-11-22T20:00:00Z");
  const today = "2026-11-22";

  it("compte comme à venir un événement horaire qui n'a pas commencé", () => {
    expect(isUpcoming(timed("2026-11-22T21:00:00Z", "2026-11-22T23:00:00Z"), { now, today })).toBe(
      true,
    );
  });

  it("compte comme à venir un événement en cours", () => {
    expect(isUpcoming(timed("2026-11-22T19:30:00Z", "2026-11-22T23:30:00Z"), { now, today })).toBe(
      true,
    );
  });

  it("compte comme passé un événement horaire fini, à l'instant près", () => {
    expect(isUpcoming(timed("2026-11-22T18:00:00Z", "2026-11-22T20:00:00Z"), { now, today })).toBe(
      false,
    );
    expect(isUpcoming(timed("2026-11-22T18:00:00Z", "2026-11-22T20:00:01Z"), { now, today })).toBe(
      true,
    );
  });

  it("garde à venir un événement à la journée jusqu'à la fin de son dernier jour", () => {
    expect(isUpcoming(allDay("2026-11-21", "2026-11-22"), { now, today })).toBe(true);
    expect(isUpcoming(allDay("2026-11-22", "2026-11-22"), { now, today })).toBe(true);
    expect(isUpcoming(allDay("2026-11-20", "2026-11-21"), { now, today })).toBe(false);
  });
});
