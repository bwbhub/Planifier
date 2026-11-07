import { addDays } from "@planifier/constants/days";
import { describe, expect, it } from "vitest";

import { nextDueDate, type Recurrence, seriesAnchor } from "./recurrence";
import { checkedOnTime, fresh } from "./recurrence.testing";

const daily: Recurrence = { frequency: "DAILY", interval: 1 };
const weekly: Recurrence = { frequency: "WEEKLY", interval: 1 };
const everyTwoWeeks: Recurrence = { frequency: "WEEKLY", interval: 2 };
const monthly: Recurrence = { frequency: "MONTHLY", interval: 1 };
const yearly: Recurrence = { frequency: "YEARLY", interval: 1 };

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
