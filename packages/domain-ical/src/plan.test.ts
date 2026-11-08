import { describe, expect, it } from "vitest";

import { planUpsert } from "./plan";
import type { ImportedEntry } from "./types";

const entry = (uid: string, title = uid): ImportedEntry => ({
  uid,
  title,
  description: null,
  location: null,
  time: { allDay: true, startDay: "2026-11-10", endDay: "2026-11-10" },
});

describe("planUpsert", () => {
  it("crée les nouvelles, met à jour les modifiées, garde les identiques et retire les disparues", () => {
    const plan = planUpsert(
      [entry("garde"), entry("change", "avant"), entry("disparue")],
      [entry("garde"), entry("change", "après"), entry("nouvelle")],
    );

    expect(plan.create.map((e) => e.uid)).toEqual(["nouvelle"]);
    expect(plan.update.map((e) => e.title)).toEqual(["après"]);
    expect(plan.unchanged).toEqual(["garde"]);
    expect(plan.removed).toEqual(["disparue"]);
  });

  it("ne crée aucun doublon quand le flux est relu deux fois", () => {
    const received = [entry("a"), entry("b")];

    const plan = planUpsert(received, received);

    expect(plan).toEqual({ create: [], update: [], unchanged: ["a", "b"], removed: [] });
  });

  it("compte une fois un uid répété dans le flux : le dernier l'emporte", () => {
    const plan = planUpsert([], [entry("a", "premier"), entry("a", "dernier")]);

    expect(plan.create).toHaveLength(1);
    expect(plan.create[0]?.title).toBe("dernier");
  });

  it("voit un changement d'heure, de lieu ou de passage en jour entier", () => {
    const base = entry("a");
    const timed: ImportedEntry = {
      ...base,
      time: {
        allDay: false,
        startsAt: new Date("2026-11-10T09:00:00Z"),
        endsAt: new Date("2026-11-10T10:00:00Z"),
      },
    };

    expect(planUpsert([base], [timed]).update).toHaveLength(1);
    expect(planUpsert([base], [{ ...base, location: "Ici" }]).update).toHaveLength(1);
    expect(planUpsert([timed], [{ ...timed }]).unchanged).toEqual(["a"]);
  });
});
