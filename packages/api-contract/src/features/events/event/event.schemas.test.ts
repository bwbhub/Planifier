import { describe, expect, it } from "vitest";

import {
  createEventInputSchema,
  eventWhenInputSchema,
  updateEventInputSchema,
} from "./event.schemas";

const EVENT_ID = "0199f3a2-7c4e-7d10-9a51-000000000001";
const timed = (startsAt: string, endsAt: string, openEnd?: boolean) => ({
  allDay: false,
  startsAt: new Date(startsAt),
  endsAt: new Date(endsAt),
  ...(openEnd === undefined ? {} : { openEnd }),
});

describe("eventWhenInputSchema", () => {
  it("accepte un horaire, avec fin choisie par défaut", () => {
    const parsed = eventWhenInputSchema.parse(
      timed("2026-11-22T19:30:00Z", "2026-11-22T23:30:00Z"),
    );
    expect(parsed).toMatchObject({ allDay: false, openEnd: false });
  });

  it("accepte une fin non choisie qui ne dépasse pas un jour", () => {
    expect(
      eventWhenInputSchema.safeParse(timed("2026-11-22T19:30:00Z", "2026-11-23T19:30:00Z", true))
        .success,
    ).toBe(true);
    expect(
      eventWhenInputSchema.safeParse(timed("2026-11-22T19:30:00Z", "2026-11-23T19:30:01Z", true))
        .success,
    ).toBe(false);
  });

  it("laisse une fin choisie dépasser un jour", () => {
    expect(
      eventWhenInputSchema.safeParse(timed("2026-11-22T19:30:00Z", "2026-11-25T19:30:00Z", false))
        .success,
    ).toBe(true);
  });

  it("refuse une fin qui ne suit pas le début", () => {
    expect(
      eventWhenInputSchema.safeParse(timed("2026-11-22T19:30:00Z", "2026-11-22T19:30:00Z")).success,
    ).toBe(false);
  });

  it("accepte un événement à la journée sans dernier jour, et refuse un dernier jour avant le premier", () => {
    expect(eventWhenInputSchema.safeParse({ allDay: true, startDay: "2026-12-13" }).success).toBe(
      true,
    );
    expect(
      eventWhenInputSchema.safeParse({ allDay: true, startDay: "2026-12-14", endDay: "2026-12-13" })
        .success,
    ).toBe(false);
  });
});

describe("createEventInputSchema", () => {
  const base = {
    title: "Anniversaire",
    tint: "couple",
    when: { allDay: true, startDay: "2026-12-13" },
  };

  it("accepte le minimum : titre, teinte, date", () => {
    expect(createEventInputSchema.safeParse(base).success).toBe(true);
  });

  it("refuse un titre vide, une teinte inconnue et des places hors bornes", () => {
    expect(createEventInputSchema.safeParse({ ...base, title: "  " }).success).toBe(false);
    expect(createEventInputSchema.safeParse({ ...base, tint: "rouge" }).success).toBe(false);
    expect(createEventInputSchema.safeParse({ ...base, maxParticipants: 0 }).success).toBe(false);
    expect(createEventInputSchema.safeParse({ ...base, maxParticipants: 201 }).success).toBe(false);
  });

  it("refuse un champ inconnu", () => {
    expect(createEventInputSchema.safeParse({ ...base, ownerId: EVENT_ID }).success).toBe(false);
  });
});

describe("updateEventInputSchema", () => {
  it("exige au moins un champ à modifier", () => {
    expect(updateEventInputSchema.safeParse({ eventId: EVENT_ID, version: 1 }).success).toBe(false);
    expect(
      updateEventInputSchema.safeParse({ eventId: EVENT_ID, version: 1, title: "Nouveau" }).success,
    ).toBe(true);
  });

  it("efface la description, le lieu et les places avec null", () => {
    const input = {
      eventId: EVENT_ID,
      version: 2,
      description: null,
      location: null,
      maxParticipants: null,
    };
    expect(updateEventInputSchema.safeParse(input).success).toBe(true);
  });

  it("ne change pas l'Espace : c'est la procédure du propriétaire", () => {
    expect(
      updateEventInputSchema.safeParse({ eventId: EVENT_ID, version: 1, spaceId: EVENT_ID })
        .success,
    ).toBe(false);
  });
});
