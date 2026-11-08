import { describe, expect, it } from "vitest";

import { parseRule } from "./recurrence-rule";

describe("parseRule", () => {
  it("lit fréquence, intervalle, jours et bornes", () => {
    expect(parseRule("FREQ=WEEKLY;INTERVAL=2;BYDAY=WE,MO;UNTIL=20261231T235959Z")).toEqual({
      frequency: "WEEKLY",
      interval: 2,
      count: null,
      until: "2026-12-31",
      byDay: [0, 2],
      byMonthDay: [],
    });
  });

  it.each([
    "",
    "FREQ=HOURLY",
    "FREQ=MONTHLY;BYDAY=2MO",
    "FREQ=MONTHLY;BYSETPOS=1;BYDAY=MO",
    "FREQ=DAILY;COUNT=0",
    "FREQ=DAILY;COUNT=abc",
    "FREQ=DAILY;INTERVAL=0",
    "FREQ=DAILY;FREQ=WEEKLY",
    "FREQ=MONTHLY;BYMONTHDAY=-1",
    "FREQ=DAILY;UNTIL=demain",
  ])("refuse %j", (rule) => {
    expect(parseRule(rule)).toBeNull();
  });
});
