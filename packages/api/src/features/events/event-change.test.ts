import { eventChangeSchema } from "@planifier/api-contract";
import { describe, expect, it } from "vitest";

import { toChangeJson } from "./event-change";

describe("toChangeJson", () => {
  it("écrit un changement de date horaire avec des instants en texte", () => {
    const json = toChangeJson({
      field: "when",
      from: {
        allDay: false,
        startsAt: new Date("2026-11-22T19:00:00Z"),
        endsAt: new Date("2026-11-22T23:00:00Z"),
        openEnd: false,
      },
      to: { allDay: true, startDay: "2026-11-23", endDay: "2026-11-23" },
    });
    expect(json).toEqual({
      schemaVersion: 1,
      field: "when",
      from: {
        allDay: false,
        startsAt: "2026-11-22T19:00:00.000Z",
        endsAt: "2026-11-22T23:00:00.000Z",
        openEnd: false,
      },
      to: { allDay: true, startDay: "2026-11-23", endDay: "2026-11-23" },
    });
    expect(eventChangeSchema.safeParse(json).success).toBe(true);
  });

  it("écrit un lieu ajouté, changé ou retiré", () => {
    expect(toChangeJson({ field: "location", from: null, to: "Chez Julien" })).toEqual({
      schemaVersion: 1,
      field: "location",
      from: null,
      to: "Chez Julien",
    });
  });
});
