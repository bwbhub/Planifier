import { addDays, weekdayOf } from "@planifier/constants/days";
import { describe, expect, it } from "vitest";

import { nextDueDate, type Recurrence } from "./recurrence";
import { checkedOnTime, fresh } from "./recurrence.testing";

// 2026-10-28 est un mercredi.
const tuesdays: Recurrence = { frequency: "WEEKLY", interval: 1, weekdays: ["TUESDAY"] };
const monThu: Recurrence = { frequency: "WEEKLY", interval: 1, weekdays: ["MONDAY", "THURSDAY"] };
const everyOtherMonday: Recurrence = { frequency: "WEEKLY", interval: 2, weekdays: ["MONDAY"] };

describe("nextDueDate : jours de la semaine", () => {
  it("sans échéance : le prochain jour voulu, strictement après aujourd'hui", () => {
    expect(nextDueDate(tuesdays, fresh(null), "2026-10-28")).toBe("2026-11-03");
    // Un mardi : l'occurrence d'aujourd'hui est faite, la suivante est dans sept jours.
    expect(nextDueDate(tuesdays, fresh(null), "2026-11-03")).toBe("2026-11-10");
  });

  it("plusieurs jours : le plus proche, puis le suivant, dans l'ordre de la semaine", () => {
    expect(nextDueDate(monThu, fresh("2026-10-26"), "2026-10-26")).toBe("2026-10-29");
    expect(nextDueDate(monThu, fresh("2026-10-29"), "2026-10-29")).toBe("2026-11-02");
    expect(checkedOnTime(monThu, "2026-10-26", 4)).toEqual([
      "2026-10-29",
      "2026-11-02",
      "2026-11-05",
      "2026-11-09",
    ]);
  });

  it("l'échéance n'a pas à tomber un jour voulu : on repart du prochain jour voulu", () => {
    expect(nextDueDate(tuesdays, fresh("2026-10-28"), "2026-10-28")).toBe("2026-11-03");
  });

  it("cochée en avance : après l'échéance, pas après aujourd'hui", () => {
    expect(nextDueDate(tuesdays, fresh("2026-11-10"), "2026-10-30")).toBe("2026-11-17");
  });

  it("cochée en retard : saute les occurrences passées", () => {
    expect(nextDueDate(tuesdays, fresh("2026-09-01"), "2026-10-28")).toBe("2026-11-03");
  });
});

describe("nextDueDate : jours de la semaine, rythme et propriétés", () => {
  it("toutes les deux semaines : une semaine sur deux, depuis la semaine de l'ancre", () => {
    expect(checkedOnTime(everyOtherMonday, "2026-10-26", 3)).toEqual([
      "2026-11-09",
      "2026-11-23",
      "2026-12-07",
    ]);
    // Ancre un jeudi : la semaine de l'ancre compte (lundi 26 octobre), le lundi suivant voulu est dans deux semaines.
    expect(
      nextDueDate(everyOtherMonday, { anchor: "2026-10-29", due: "2026-10-29" }, "2026-10-29"),
    ).toBe("2026-11-09");
  });

  it("aucun glissement : l'ancre garde la parité des semaines après une coche en retard", () => {
    const anchor = "2026-10-26";
    expect(nextDueDate(everyOtherMonday, { anchor, due: "2026-11-09" }, "2026-12-01")).toBe(
      "2026-12-07",
    );
  });

  it("la semaine va du lundi au dimanche : un dimanche et un lundi voisins sont de deux semaines", () => {
    const sunMon: Recurrence = { frequency: "WEEKLY", interval: 2, weekdays: ["SUNDAY", "MONDAY"] };
    // Ancre le lundi 26 octobre : le dimanche 1er novembre est de la même semaine, le lundi 2 novembre de la suivante.
    expect(checkedOnTime(sunMon, "2026-10-26", 4)).toEqual([
      "2026-11-01",
      "2026-11-09",
      "2026-11-15",
      "2026-11-23",
    ]);
  });

  it("deux jours dans la même semaine, une semaine sur deux", () => {
    const monThuEveryOther: Recurrence = {
      frequency: "WEEKLY",
      interval: 2,
      weekdays: ["MONDAY", "THURSDAY"],
    };
    expect(checkedOnTime(monThuEveryOther, "2026-10-26", 4)).toEqual([
      "2026-10-29",
      "2026-11-09",
      "2026-11-12",
      "2026-11-23",
    ]);
  });

  it("intervalle maximal : une occurrence tous les 99 semaines", () => {
    const rare: Recurrence = { frequency: "WEEKLY", interval: 99, weekdays: ["FRIDAY"] };
    const first = nextDueDate(rare, fresh(null), "2026-10-28");
    expect(first).toBe("2026-10-30");
    expect(nextDueDate(rare, { anchor: first, due: first }, first)).toBe(addDays(first, 99 * 7));
  });

  it("ancre dans le futur : la parité des semaines se compte aussi vers le passé", () => {
    // Ancre le lundi 9 novembre ; aujourd'hui le mercredi 28 octobre : les lundis de rythme sont 26 octobre
    // (4 semaines avant l'ancre, donc pair) et 9 novembre.
    const everyOtherMonday: Recurrence = { frequency: "WEEKLY", interval: 2, weekdays: ["MONDAY"] };
    expect(nextDueDate(everyOtherMonday, { anchor: "2026-11-09", due: null }, "2026-10-28")).toBe(
      "2026-11-09",
    );
  });

  it("propriétés : toujours un jour voulu, strictement après aujourd'hui et l'échéance", () => {
    const rules: Recurrence[] = [
      tuesdays,
      monThu,
      everyOtherMonday,
      { frequency: "WEEKLY", interval: 3, weekdays: ["SUNDAY", "WEDNESDAY"] },
      { frequency: "WEEKLY", interval: 99, weekdays: ["MONDAY", "FRIDAY"] },
    ];
    const days = ["2024-02-29", "2026-01-31", "2026-10-28", "2026-12-31", "2027-03-01"];
    const wanted = (rule: Recurrence, day: string) =>
      (rule.weekdays ?? []).some((weekday) => weekday === weekdayOf(day));
    for (const rule of rules) {
      for (const due of days) {
        for (const today of days) {
          const next = nextDueDate(rule, fresh(due), today);
          expect(next > today).toBe(true);
          expect(next > due).toBe(true);
          expect(wanted(rule, next)).toBe(true);
        }
      }
    }
  });
});
