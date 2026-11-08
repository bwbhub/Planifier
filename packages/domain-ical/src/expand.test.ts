import { describe, expect, it } from "vitest";

import { expandFeed } from "./expand";
import { parseFeed } from "./parse";

const WINDOW = { from: "2026-11-01", to: "2026-12-31" };

/** Flux de `VEVENT` bruts, lus par `parseFeed` comme en production. */
function expand(events: string[][], window = WINDOW) {
  const text = [
    "BEGIN:VCALENDAR",
    ...events.flatMap((props) => ["BEGIN:VEVENT", ...props, "END:VEVENT"]),
    "END:VCALENDAR",
  ].join("\r\n");
  return expandFeed(parseFeed(text).events, window);
}

const uids = (events: string[][], window = WINDOW) =>
  expand(events, window).entries.map((e) => e.uid);
const days = (events: string[][], window = WINDOW) =>
  expand(events, window).entries.map((e) =>
    e.time.allDay ? e.time.startDay : e.time.startsAt.toISOString(),
  );

describe("expandFeed : événements simples", () => {
  it("garde un événement simple, même hors de la fenêtre", () => {
    const { entries } = expand([["UID:a", "DTSTART;VALUE=DATE:20200101", "SUMMARY:ancien"]]);

    expect(entries.map((e) => e.uid)).toEqual(["a"]);
  });

  it("garde l'étendue d'un événement sur plusieurs jours entiers", () => {
    const { entries } = expand([
      [
        "UID:s",
        "DTSTART;VALUE=DATE:20261110",
        "DTEND;VALUE=DATE:20261113",
        "RRULE:FREQ=WEEKLY;COUNT=2",
        "SUMMARY:s",
      ],
    ]);

    expect(entries.map((e) => e.time)).toEqual([
      { allDay: true, startDay: "2026-11-10", endDay: "2026-11-12" },
      { allDay: true, startDay: "2026-11-17", endDay: "2026-11-19" },
    ]);
  });
});

describe("expandFeed : règles", () => {
  const series = (rule: string, start = "20261102") => [
    ["UID:r", `DTSTART;VALUE=DATE:${start}`, `RRULE:${rule}`, "SUMMARY:r"],
  ];

  it("développe un quotidien borné par COUNT", () => {
    expect(days(series("FREQ=DAILY;COUNT=3"))).toEqual(["2026-11-02", "2026-11-03", "2026-11-04"]);
  });

  it("développe un hebdomadaire sur deux jours, une semaine sur deux", () => {
    expect(days(series("FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=4"))).toEqual([
      "2026-11-02",
      "2026-11-04",
      "2026-11-16",
      "2026-11-18",
    ]);
  });

  it("saute les mois trop courts pour un 31", () => {
    expect(
      days(series("FREQ=MONTHLY;COUNT=3", "20260831"), { from: "2026-08-01", to: "2027-03-01" }),
    ).toEqual(["2026-08-31", "2026-10-31", "2026-12-31"]);
  });

  it("saute les années sans 29 février", () => {
    expect(
      days(series("FREQ=YEARLY;COUNT=2", "20240229"), { from: "2024-01-01", to: "2030-01-01" }),
    ).toEqual(["2024-02-29", "2028-02-29"]);
  });

  it("s'arrête à UNTIL, jour compris", () => {
    expect(days(series("FREQ=DAILY;UNTIL=20261104"))).toEqual([
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
    ]);
  });

  it("compte COUNT depuis le début de la série, pas depuis la fenêtre", () => {
    const old = series("FREQ=DAILY;COUNT=40", "20261001");

    // 40 jours depuis le 1er octobre : jusqu'au 9 novembre.
    expect(days(old).at(-1)).toBe("2026-11-09");
    expect(days(old)[0]).toBe("2026-11-01");
  });

  it("borne une série sans fin à la fenêtre", () => {
    const { entries } = expand(series("FREQ=DAILY"));

    expect(entries).toHaveLength(60);
    expect(entries.at(-1)?.time).toMatchObject({ startDay: "2026-12-31" });
  });
});

describe("expandFeed : exceptions, remplacements et cas limites", () => {
  it("retire les EXDATE", () => {
    const events = [
      [
        "UID:r",
        "DTSTART;VALUE=DATE:20261102",
        "RRULE:FREQ=DAILY;COUNT=3",
        "EXDATE;VALUE=DATE:20261103",
        "SUMMARY:r",
      ],
    ];

    expect(days(events)).toEqual(["2026-11-02", "2026-11-04"]);
  });

  it("remplace une occurrence par sa version modifiée, sans doublon", () => {
    const events = [
      ["UID:r", "DTSTART:20261102T090000Z", "RRULE:FREQ=DAILY;COUNT=3", "SUMMARY:série"],
      ["UID:r", "RECURRENCE-ID:20261103T090000Z", "DTSTART:20261103T140000Z", "SUMMARY:déplacé"],
    ];

    const { entries } = expand(events);

    expect(entries.map((e) => [e.uid, e.title])).toEqual([
      ["r#2026-11-02T09:00:00.000Z", "série"],
      ["r#2026-11-04T09:00:00.000Z", "série"],
      ["r#2026-11-03T09:00:00.000Z", "déplacé"],
    ]);
    expect(new Set(entries.map((e) => e.uid)).size).toBe(3);
  });

  it("garde l'heure murale d'un changement d'heure à l'autre", () => {
    const events = [
      [
        "UID:p",
        "DTSTART;TZID=Europe/Paris:20261019T090000",
        "RRULE:FREQ=WEEKLY;COUNT=2",
        "SUMMARY:p",
      ],
      [
        "UID:q",
        "DTSTART;TZID=Europe/Paris:20261026T090000",
        "RRULE:FREQ=WEEKLY;COUNT=1",
        "SUMMARY:q",
      ],
    ];

    // 25 octobre 2026 : retour à l'heure d'hiver. Le lundi 9 h reste 9 h locales (07:00Z puis 08:00Z).
    expect(days(events, { from: "2026-10-01", to: "2026-12-31" })).toEqual([
      "2026-10-19T07:00:00.000Z",
      "2026-10-26T08:00:00.000Z",
      "2026-10-26T08:00:00.000Z",
    ]);
  });

  it("garde la première occurrence d'une règle non prise en charge, et le dit", () => {
    const events = [
      ["UID:u", "DTSTART;VALUE=DATE:20261102", "RRULE:FREQ=MONTHLY;BYDAY=2MO", "SUMMARY:u"],
      [
        "UID:v",
        "DTSTART;VALUE=DATE:20261102",
        "RRULE:FREQ=MONTHLY;BYSETPOS=1;BYDAY=MO",
        "SUMMARY:v",
      ],
    ];

    const result = expand(events);

    expect(result.unsupported).toBe(2);
    expect(result.entries.map((e) => e.uid)).toEqual(["u", "v"]);
  });
});

describe("expandFeed : bornes", () => {
  it("coupe à l'instant exact d'un UNTIL horodaté", () => {
    const events = [
      ["UID:u", "DTSTART:20261102T090000Z", "RRULE:FREQ=DAILY;UNTIL=20261104T080000Z", "SUMMARY:u"],
    ];

    expect(days(events)).toEqual(["2026-11-02T09:00:00.000Z", "2026-11-03T09:00:00.000Z"]);
  });

  it("ne développe pas, et le dit, une série qui n'atteint pas la fenêtre dans le plafond", () => {
    const result = expand([
      ["UID:o", "DTSTART;VALUE=DATE:19600101", "RRULE:FREQ=DAILY", "SUMMARY:o"],
    ]);

    expect(result.unsupported).toBe(1);
    expect(result.entries.map((e) => e.uid)).toEqual(["o"]);
  });

  it("ne boucle pas sur une règle démesurée", () => {
    const far = { from: "2026-11-01", to: "9999-12-31" };

    expect(
      uids([["UID:z", "DTSTART;VALUE=DATE:20261102", "RRULE:FREQ=DAILY", "SUMMARY:z"]], far).length,
    ).toBeLessThanOrEqual(20_000);
  });
});
