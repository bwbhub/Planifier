import { describe, expect, it } from "vitest";

import { normalizeWhen, toEventWhen, whenColumns } from "./event-when";

const NO_COLUMNS = { startsAt: null, endsAt: null, startDay: null, endDay: null, openEnd: false };

describe("normalizeWhen", () => {
  it("donne un seul jour à un événement à la journée sans dernier jour", () => {
    expect(normalizeWhen({ allDay: true, startDay: "2026-12-13" })).toEqual({
      allDay: true,
      startDay: "2026-12-13",
      endDay: "2026-12-13",
    });
  });

  it("garde le dernier jour choisi", () => {
    expect(normalizeWhen({ allDay: true, startDay: "2026-12-13", endDay: "2026-12-14" })).toEqual({
      allDay: true,
      startDay: "2026-12-13",
      endDay: "2026-12-14",
    });
  });

  it("garde l'horaire et le fait que la fin n'a pas été choisie", () => {
    const startsAt = new Date("2026-11-28T20:00:00Z");
    const endsAt = new Date("2026-11-29T00:00:00Z");
    expect(normalizeWhen({ allDay: false, startsAt, endsAt, openEnd: true })).toEqual({
      allDay: false,
      startsAt,
      endsAt,
      openEnd: true,
    });
  });
});

describe("whenColumns", () => {
  it("écrit les jours et vide l'horaire, avec la clé de tri à minuit UTC du premier jour", () => {
    expect(whenColumns({ allDay: true, startDay: "2026-12-13", endDay: "2026-12-14" })).toEqual({
      ...NO_COLUMNS,
      startDay: new Date("2026-12-13T00:00:00Z"),
      endDay: new Date("2026-12-14T00:00:00Z"),
      startKey: new Date("2026-12-13T00:00:00Z"),
    });
  });

  it("écrit l'horaire et vide les jours, avec la clé de tri au début", () => {
    const startsAt = new Date("2026-11-22T19:30:00Z");
    const endsAt = new Date("2026-11-22T23:30:00Z");
    expect(whenColumns({ allDay: false, startsAt, endsAt, openEnd: true })).toEqual({
      ...NO_COLUMNS,
      startsAt,
      endsAt,
      openEnd: true,
      startKey: startsAt,
    });
  });
});

describe("toEventWhen", () => {
  it("relit les deux formes", () => {
    const startsAt = new Date("2026-11-22T19:30:00Z");
    const endsAt = new Date("2026-11-22T23:30:00Z");
    expect(toEventWhen({ ...NO_COLUMNS, startsAt, endsAt })).toEqual({
      allDay: false,
      startsAt,
      endsAt,
      openEnd: false,
    });
    expect(
      toEventWhen({
        ...NO_COLUMNS,
        startDay: new Date("2026-12-13T00:00:00Z"),
        endDay: new Date("2026-12-14T00:00:00Z"),
      }),
    ).toEqual({ allDay: true, startDay: "2026-12-13", endDay: "2026-12-14" });
  });

  it("refuse une ligne sans date : donnée corrompue", () => {
    expect(() => toEventWhen(NO_COLUMNS)).toThrow("sans date");
  });
});
