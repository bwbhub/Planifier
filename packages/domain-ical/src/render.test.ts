import { describe, expect, it } from "vitest";

import { parseFeed } from "./parse";
import { renderFeed } from "./render";
import type { ExportEntry } from "./types";

/** Octets UTF-8 : chaque octet non ASCII devient un `%XX` de trois caractères, ramené à un. */
const utf8Octets = (text: string) =>
  encodeURIComponent(text).replaceAll(/%[0-9A-F]{2}/g, "_").length;
const NOW = new Date("2026-11-08T12:00:00Z");
const timed: ExportEntry = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Dentiste; rue Haute, 2e",
  description: "Ligne 1\nLigne 2",
  location: null,
  time: {
    allDay: false,
    startsAt: new Date("2026-11-10T09:00:00Z"),
    endsAt: new Date("2026-11-10T10:00:00Z"),
  },
};
const allDay: ExportEntry = {
  id: "22222222-2222-2222-2222-222222222222",
  title: "Congé",
  description: null,
  location: "Maison",
  time: { allDay: true, startDay: "2026-11-10", endDay: "2026-11-12" },
};

describe("renderFeed", () => {
  it("écrit un flux iCal avec des fins de ligne CRLF", () => {
    const text = renderFeed([timed, allDay], NOW);

    expect(text.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(text.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(text).toContain("DTSTART:20261110T090000Z\r\nDTEND:20261110T100000Z");
    expect(text).toContain("DTSTART;VALUE=DATE:20261110\r\nDTEND;VALUE=DATE:20261113");
    expect(text).toContain("SUMMARY:Dentiste\\; rue Haute\\, 2e");
    expect(text).toContain("DESCRIPTION:Ligne 1\\nLigne 2");
  });

  it("plie les lignes de plus de 75 octets sans couper un caractère", () => {
    const text = renderFeed([{ ...timed, title: "é".repeat(100) }], NOW);

    for (const line of text.split("\r\n")) {
      expect(utf8Octets(line)).toBeLessThanOrEqual(75);
    }
    expect(parseFeed(text).events).toHaveLength(0);
  });

  it("marque l'export : relu par Planifier, il est ignoré (anti-boucle)", () => {
    const parsed = parseFeed(renderFeed([timed, allDay], NOW));

    expect(parsed.events).toEqual([]);
    expect(parsed.ignored.ownExport).toBe(2);
  });

  it("se relit à l'identique une fois la marque retirée", () => {
    const text = renderFeed([timed, allDay], NOW)
      .replace("PRODID:-//Planifier//Planifier//FR", "PRODID:-//Autre//Outil//EN")
      .replaceAll("X-PLANIFIER-ORIGIN:export\r\n", "");

    const { events } = parseFeed(text);

    expect(
      events.map(({ title, description, location, time }) => ({
        title,
        description,
        location,
        time,
      })),
    ).toEqual([
      { title: timed.title, description: timed.description, location: null, time: timed.time },
      { title: "Congé", description: null, location: "Maison", time: allDay.time },
    ]);
  });
});
