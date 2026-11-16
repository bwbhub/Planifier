import { describe, expect, it } from "vitest";

import { importantChanges } from "./changes";
import type { EventWhen } from "./when";

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

const evening = timed("2026-11-22T19:30:00Z", "2026-11-22T23:30:00Z");

describe("importantChanges", () => {
  it("ne rend rien quand ni la date ni le lieu ne changent", () => {
    expect(
      importantChanges(
        { when: evening, location: "Chez Julien" },
        { when: { ...evening }, location: "Chez Julien" },
      ),
    ).toEqual([]);
  });

  it("signale un changement d'heure", () => {
    const later = timed("2026-11-22T20:00:00Z", "2026-11-22T23:30:00Z");
    expect(
      importantChanges({ when: evening, location: null }, { when: later, location: null }),
    ).toEqual([{ field: "when", from: evening, to: later }]);
  });

  it("signale un changement de jours pour un événement à la journée", () => {
    const before = allDay("2026-12-06", "2026-12-07");
    const after = allDay("2026-12-13", "2026-12-14");
    expect(
      importantChanges({ when: before, location: null }, { when: after, location: null }),
    ).toEqual([{ field: "when", from: before, to: after }]);
  });

  it("signale le passage d'une fin choisie à « fin du jour », à fin identique", () => {
    const chosen = timed("2026-11-22T19:30:00Z", "2026-11-23T00:00:00Z", false);
    const open = timed("2026-11-22T19:30:00Z", "2026-11-23T00:00:00Z", true);
    expect(
      importantChanges({ when: chosen, location: null }, { when: open, location: null }),
    ).toHaveLength(1);
  });

  it("signale le passage de l'horaire à la journée", () => {
    expect(
      importantChanges(
        { when: evening, location: null },
        { when: allDay("2026-11-22", "2026-11-22"), location: null },
      ),
    ).toHaveLength(1);
  });

  it("signale un lieu ajouté, changé ou retiré", () => {
    const at = (location: string | null) => ({ when: evening, location });
    expect(importantChanges(at(null), at("Chez Julien"))).toEqual([
      { field: "location", from: null, to: "Chez Julien" },
    ]);
    expect(importantChanges(at("Chez Julien"), at("Au parc"))).toEqual([
      { field: "location", from: "Chez Julien", to: "Au parc" },
    ]);
    expect(importantChanges(at("Au parc"), at(null))).toEqual([
      { field: "location", from: "Au parc", to: null },
    ]);
  });

  it("rend un changement par champ, la date d'abord", () => {
    const later = timed("2026-11-22T20:00:00Z", "2026-11-22T23:30:00Z");
    expect(
      importantChanges({ when: evening, location: "A" }, { when: later, location: "B" }).map(
        ({ field }) => field,
      ),
    ).toEqual(["when", "location"]);
  });
});
