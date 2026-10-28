import { describe, expect, it } from "vitest";

import { dayToUtcDate, utcDateToDay } from "@planifier/constants/days";

import { nextDueDate, type Recurrence } from "./recurrence";

const dayBefore = (day: string) => utcDateToDay(new Date(dayToUtcDate(day).getTime() - 86_400_000));

const daily: Recurrence = { frequency: "DAILY", interval: 1 };
const weekly: Recurrence = { frequency: "WEEKLY", interval: 1 };
const everyTwoWeeks: Recurrence = { frequency: "WEEKLY", interval: 2 };
const monthly: Recurrence = { frequency: "MONTHLY", interval: 1 };
const yearly: Recurrence = { frequency: "YEARLY", interval: 1 };

describe("nextDueDate : cas d'or", () => {
  it("cochée le jour prévu : occurrence suivante", () => {
    expect(nextDueDate(weekly, "2026-10-28", "2026-10-28")).toBe("2026-11-04");
    expect(nextDueDate(everyTwoWeeks, "2026-10-28", "2026-10-28")).toBe("2026-11-11");
    expect(nextDueDate(daily, "2026-12-31", "2026-12-31")).toBe("2027-01-01");
  });

  it("cochée en avance : occurrence suivante l'échéance, pas aujourd'hui + intervalle", () => {
    expect(nextDueDate(weekly, "2026-11-04", "2026-10-30")).toBe("2026-11-11");
  });

  it("cochée en retard : saute les occurrences passées", () => {
    expect(nextDueDate(weekly, "2026-10-01", "2026-10-28")).toBe("2026-10-29");
    expect(nextDueDate(daily, "2020-01-01", "2026-10-28")).toBe("2026-10-29");
  });

  it("sans échéance : aujourd'hui + intervalle", () => {
    expect(nextDueDate(weekly, null, "2026-10-28")).toBe("2026-11-04");
  });

  it("mois plus court : dernier jour du mois, puis retour au jour d'origine", () => {
    expect(nextDueDate(monthly, "2026-01-31", "2026-01-31")).toBe("2026-02-28");
    expect(nextDueDate(monthly, "2026-01-31", "2026-02-28")).toBe("2026-03-31");
    expect(nextDueDate(yearly, "2024-02-29", "2024-02-29")).toBe("2025-02-28");
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
          const next = nextDueDate(rule, due, today);
          expect(next > today).toBe(true);
          expect(next > due).toBe(true);
        }
      }
    }
  });

  it("aucune occurrence sautée : cochée n'importe quel jour avant la suivante, même résultat", () => {
    for (const rule of rules) {
      for (const due of days) {
        const next = nextDueDate(rule, due, due);
        expect(nextDueDate(rule, due, dayBefore(next))).toBe(next);
      }
    }
  });
});
