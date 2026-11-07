import { addDays, weekdayOf } from "@planifier/constants/days";
import { describe, expect, it } from "vitest";

import { nextDueDate, type Recurrence, seriesAnchor } from "./recurrence";

const daily: Recurrence = { frequency: "DAILY", interval: 1 };
const weekly: Recurrence = { frequency: "WEEKLY", interval: 1 };
const everyTwoWeeks: Recurrence = { frequency: "WEEKLY", interval: 2 };
const monthly: Recurrence = { frequency: "MONTHLY", interval: 1 };
const yearly: Recurrence = { frequency: "YEARLY", interval: 1 };

/** Série neuve : rien n'a encore été fait, l'échéance sert d'ancre. */
const fresh = (due: string | null) => ({ anchor: null, due });

/** Coche les occurrences une à une, le jour prévu, comme le ferait le serveur (ancre gardée). */
function checkedOnTime(rule: Recurrence, firstDue: string, times: number): string[] {
  const dues = [];
  let due = firstDue;
  for (let i = 0; i < times; i += 1) {
    due = nextDueDate(rule, { anchor: firstDue, due }, due);
    dues.push(due);
  }
  return dues;
}

describe("nextDueDate : cas d'or", () => {
  it("cochée le jour prévu : occurrence suivante", () => {
    expect(nextDueDate(weekly, fresh("2026-10-28"), "2026-10-28")).toBe("2026-11-04");
    expect(nextDueDate(everyTwoWeeks, fresh("2026-10-28"), "2026-10-28")).toBe("2026-11-11");
    expect(nextDueDate(daily, fresh("2026-12-31"), "2026-12-31")).toBe("2027-01-01");
  });

  it("cochée en avance : occurrence suivante l'échéance, pas aujourd'hui + intervalle", () => {
    expect(nextDueDate(weekly, fresh("2026-11-04"), "2026-10-30")).toBe("2026-11-11");
  });

  it("cochée en retard : saute les occurrences passées", () => {
    expect(nextDueDate(weekly, fresh("2026-10-01"), "2026-10-28")).toBe("2026-10-29");
    expect(nextDueDate(daily, fresh("2020-01-01"), "2026-10-28")).toBe("2026-10-29");
  });

  it("sans échéance : aujourd'hui + intervalle", () => {
    expect(nextDueDate(weekly, fresh(null), "2026-10-28")).toBe("2026-11-04");
  });

  it("mois plus court : dernier jour du mois, puis retour au jour d'origine, coche après coche", () => {
    expect(checkedOnTime(monthly, "2026-01-31", 4)).toEqual([
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
      "2026-05-31",
    ]);
    expect(checkedOnTime(yearly, "2024-02-29", 4)).toEqual([
      "2025-02-28",
      "2026-02-28",
      "2027-02-28",
      "2028-02-29",
    ]);
  });

  it("ancre : celle gardée, sinon l'échéance, sinon aujourd'hui", () => {
    expect(seriesAnchor(weekly, { anchor: "2026-01-31", due: "2026-02-28" }, "2026-02-28")).toBe(
      "2026-01-31",
    );
    expect(seriesAnchor(weekly, fresh("2026-02-28"), "2026-03-01")).toBe("2026-02-28");
    expect(seriesAnchor(weekly, fresh(null), "2026-03-01")).toBe("2026-03-01");
  });

  it("ancre d'une règle à jours, sans échéance : la première occurrence, pas le jour de la coche", () => {
    const tuesdays: Recurrence = { frequency: "WEEKLY", interval: 2, weekdays: ["TUESDAY"] };
    // Mercredi 28 octobre : la première occurrence est le mardi 3 novembre, et c'est elle qui fixe la parité.
    expect(seriesAnchor(tuesdays, fresh(null), "2026-10-28")).toBe("2026-11-03");
  });
});

describe("nextDueDate : propriétés", () => {
  const rules: Recurrence[] = [
    daily,
    weekly,
    everyTwoWeeks,
    monthly,
    yearly,
    { frequency: "MONTHLY", interval: 3 },
    { frequency: "DAILY", interval: 99 },
  ];
  const days = ["2024-02-29", "2026-01-31", "2026-10-28", "2026-12-31", "2027-03-01"];

  it("toujours strictement après aujourd'hui, et après l'échéance", () => {
    for (const rule of rules) {
      for (const due of days) {
        for (const today of days) {
          const next = nextDueDate(rule, fresh(due), today);
          expect(next > today).toBe(true);
          expect(next > due).toBe(true);
        }
      }
    }
  });

  it("aucune occurrence sautée : cochée n'importe quel jour avant la suivante, même résultat", () => {
    for (const rule of rules) {
      for (const due of days) {
        const next = nextDueDate(rule, fresh(due), due);
        expect(nextDueDate(rule, fresh(due), addDays(next, -1))).toBe(next);
      }
    }
  });

  it("aucun glissement : l'occurrence n est la même, cochée une à une ou d'un coup", () => {
    for (const rule of rules) {
      for (const due of days) {
        const dues = checkedOnTime(rule, due, 6);
        const last = dues.at(-1) ?? due;
        expect(nextDueDate(rule, { anchor: due, due }, addDays(last, -1))).toBe(last);
      }
    }
  });
});

describe("nextDueDate : jours de la semaine", () => {
  // 2026-10-28 est un mercredi.
  const tuesdays: Recurrence = { frequency: "WEEKLY", interval: 1, weekdays: ["TUESDAY"] };
  const monThu: Recurrence = { frequency: "WEEKLY", interval: 1, weekdays: ["MONDAY", "THURSDAY"] };
  const everyOtherMonday: Recurrence = { frequency: "WEEKLY", interval: 2, weekdays: ["MONDAY"] };

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

  it("propriétés : toujours un jour voulu, strictement après aujourd'hui et l'échéance", () => {
    const rules = [tuesdays, monThu, everyOtherMonday];
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
