import { afterEach, describe, expect, it, vi } from "vitest";

import { shiftedWhen } from "./move";

const timed = (start: string, end: string) =>
  ({ allDay: false, startsAt: new Date(start), endsAt: new Date(end) }) as const;

describe("shiftedWhen", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("décale d'autant que la main a bougé, durée gardée", () => {
    const when = timed("2026-11-05T09:00", "2026-11-05T11:00");
    // Prise à 10:00 (son milieu), posée à 14:00 deux jours plus tard : elle commence à 13:00.
    const from = { day: "2026-11-05", minute: 600 };
    expect(shiftedWhen(when, from, { day: "2026-11-07", minute: 840 })).toEqual(
      timed("2026-11-07T13:00", "2026-11-07T15:00"),
    );
  });

  it("garde l'heure d'horloge le jour d'un changement d'heure", () => {
    vi.stubEnv("TZ", "Europe/Paris");
    const when = timed("2026-10-24T10:00:00+02:00", "2026-10-24T11:00:00+02:00");
    const from = { day: "2026-10-24", minute: 600 };
    expect(shiftedWhen(when, from, { day: "2026-10-25", minute: 600 })).toEqual(
      timed("2026-10-25T10:00:00+01:00", "2026-10-25T11:00:00+01:00"),
    );
  });

  it("pose à l'heure suivante une heure qui n'existe pas", () => {
    vi.stubEnv("TZ", "Europe/Paris");
    const when = timed("2026-03-28T02:30:00+01:00", "2026-03-28T03:30:00+01:00");
    const from = { day: "2026-03-28", minute: 150 };
    expect(shiftedWhen(when, from, { day: "2026-03-29", minute: 150 })).toMatchObject({
      startsAt: new Date("2026-03-29T03:30:00+02:00"),
    });
  });

  it("décale une entrée à la journée prise par son deuxième jour", () => {
    const when = { allDay: true, startDay: "2026-11-05", endDay: "2026-11-07" } as const;
    const from = { day: "2026-11-06", minute: null };
    expect(shiftedWhen(when, from, { day: "2026-11-10", minute: null })).toEqual({
      allDay: true,
      startDay: "2026-11-09",
      endDay: "2026-11-11",
    });
  });

  it("refuse de changer la forme, et ne fait rien sur place", () => {
    const when = timed("2026-11-05T09:00", "2026-11-05T10:00");
    const from = { day: "2026-11-05", minute: 540 };
    expect(shiftedWhen(when, from, { day: "2026-11-05", minute: null })).toBeNull();
    expect(shiftedWhen(when, from, from)).toBeNull();
    const allDay = { allDay: true, startDay: "2026-11-05", endDay: "2026-11-05" } as const;
    expect(
      shiftedWhen(allDay, { day: "2026-11-05", minute: null }, { day: "2026-11-06", minute: 600 }),
    ).toBeNull();
  });
});
