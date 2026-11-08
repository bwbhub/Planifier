import { describe, expect, it } from "vitest";

import { MAX_EVENTS, parseFeed } from "./parse";

const feed = (...events: string[]) =>
  [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Google Inc//Google Calendar//EN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
const event = (...props: string[]) => ["BEGIN:VEVENT", ...props, "END:VEVENT"].join("\r\n");

describe("parseFeed", () => {
  it("lit un événement en UTC avec titre, lieu et description échappés", () => {
    const { events } = parseFeed(
      feed(
        event(
          "UID:a@google.com",
          "DTSTART:20261110T090000Z",
          "DTEND:20261110T100000Z",
          "SUMMARY:Dentiste\\, rue Haute",
          "LOCATION:Cabinet",
          "DESCRIPTION:Ligne 1\\nLigne 2",
        ),
      ),
    );

    expect(events).toEqual([
      {
        uid: "a@google.com",
        title: "Dentiste, rue Haute",
        description: "Ligne 1\nLigne 2",
        location: "Cabinet",
        time: {
          allDay: false,
          startsAt: new Date("2026-11-10T09:00:00Z"),
          endsAt: new Date("2026-11-10T10:00:00Z"),
        },
        recurrence: null,
        replaces: null,
      },
    ]);
  });

  it("défait le pliage des lignes", () => {
    const { events } = parseFeed(
      feed(event("UID:a", "DTSTART:20261110T090000Z", "SUMMARY:Un titre", " très long")),
    );

    expect(events[0]?.title).toBe("Un titretrès long");
  });

  it("écarte une date hors plage au lieu de la décaler", () => {
    const { events, ignored } = parseFeed(
      feed(
        event("UID:m", "DTSTART:20261310T090000Z", "SUMMARY:mois 13"),
        event("UID:h", "DTSTART:20261110T250000Z", "SUMMARY:25 h"),
      ),
    );

    expect(events).toEqual([]);
    expect(ignored.invalid).toBe(2);
  });
});

describe("parseFeed : dates invalides et démesure", () => {
  it("écarte un jour qui n'existe pas", () => {
    const { events, ignored } = parseFeed(
      feed(event("UID:f", "DTSTART;VALUE=DATE:20260230", "SUMMARY:30 février")),
    );

    expect(events).toEqual([]);
    expect(ignored.invalid).toBe(1);
  });

  it("ne plante pas sur une durée démesurée : fin = début", () => {
    const { events } = parseFeed(
      feed(
        event(
          "UID:a",
          "DTSTART;VALUE=DATE:20261110",
          "DURATION:P99999999999999999999D",
          "SUMMARY:a",
        ),
        event("UID:b", "DTSTART:20261110T090000Z", "DURATION:P99999999999999999999D", "SUMMARY:b"),
      ),
    );

    expect(events.map((e) => e.time)).toEqual([
      { allDay: true, startDay: "2026-11-10", endDay: "2026-11-10" },
      {
        allDay: false,
        startsAt: new Date("2026-11-10T09:00:00Z"),
        endsAt: new Date("2026-11-10T09:00:00Z"),
      },
    ]);
  });

  it("convertit une heure avec fuseau, heure d'été comprise", () => {
    const { events } = parseFeed(
      feed(
        event("UID:hiver", "DTSTART;TZID=Europe/Paris:20261110T090000", "SUMMARY:h"),
        event("UID:ete", "DTSTART;TZID=Europe/Paris:20260710T090000", "SUMMARY:e"),
      ),
    );

    expect(events.map((e) => (e.time.allDay ? null : e.time.startsAt.toISOString()))).toEqual([
      "2026-11-10T08:00:00.000Z",
      "2026-07-10T07:00:00.000Z",
    ]);
  });

  it("ignore un événement dans un fuseau inconnu", () => {
    const { events, ignored } = parseFeed(
      feed(event("UID:x", "DTSTART;TZID=Mars/Olympus:20261110T090000", "SUMMARY:x")),
    );

    expect(events).toEqual([]);
    expect(ignored.invalid).toBe(1);
  });
});

describe("parseFeed : dates", () => {
  it("lit un jour entier : DTEND exclusif devient une fin incluse", () => {
    const { events } = parseFeed(
      feed(
        event("UID:un", "DTSTART;VALUE=DATE:20261110", "DTEND;VALUE=DATE:20261111", "SUMMARY:un"),
        event(
          "UID:trois",
          "DTSTART;VALUE=DATE:20261110",
          "DTEND;VALUE=DATE:20261113",
          "SUMMARY:trois",
        ),
        event("UID:sans", "DTSTART;VALUE=DATE:20261110", "SUMMARY:sans"),
      ),
    );

    expect(events.map((e) => e.time)).toEqual([
      { allDay: true, startDay: "2026-11-10", endDay: "2026-11-10" },
      { allDay: true, startDay: "2026-11-10", endDay: "2026-11-12" },
      { allDay: true, startDay: "2026-11-10", endDay: "2026-11-10" },
    ]);
  });

  it("calcule la fin d'une durée", () => {
    const { events } = parseFeed(
      feed(event("UID:d", "DTSTART:20261110T090000Z", "DURATION:PT1H30M", "SUMMARY:d")),
    );

    expect(events[0]?.time).toMatchObject({ endsAt: new Date("2026-11-10T10:30:00Z") });
  });

  it("ramène une fin avant le début au début", () => {
    const { events } = parseFeed(
      feed(event("UID:f", "DTSTART:20261110T090000Z", "DTEND:20261110T080000Z", "SUMMARY:f")),
    );

    expect(events[0]?.time).toMatchObject({ endsAt: new Date("2026-11-10T09:00:00Z") });
  });

  it("donne un titre à un événement sans titre et borne les champs longs", () => {
    const { events } = parseFeed(
      feed(
        event("UID:s", "DTSTART:20261110T090000Z"),
        event("UID:l", "DTSTART:20261110T090000Z", `SUMMARY:${"é".repeat(500)}`),
      ),
    );

    expect(events[0]?.title).toBe("Sans titre");
    expect(Array.from(events[1]?.title ?? "")).toHaveLength(200);
  });
});

describe("parseFeed : contenu et exclusions", () => {
  it("lit la répétition et ses exceptions sans la développer", () => {
    const { events } = parseFeed(
      feed(
        event(
          "UID:r",
          "DTSTART:20261110T090000Z",
          "RRULE:FREQ=WEEKLY;BYDAY=TU",
          "EXDATE:20261117T090000Z,20261124T090000Z",
          "SUMMARY:r",
        ),
        event(
          "UID:r",
          "RECURRENCE-ID:20261201T090000Z",
          "DTSTART:20261201T100000Z",
          "SUMMARY:déplacé",
        ),
      ),
    );

    expect(events[0]?.recurrence).toEqual({
      rule: "FREQ=WEEKLY;BYDAY=TU",
      exceptions: ["2026-11-17T09:00:00.000Z", "2026-11-24T09:00:00.000Z"],
    });
    expect(events[1]?.replaces).toBe("2026-12-01T09:00:00.000Z");
  });
});

describe("parseFeed : exclusions", () => {
  it("écarte les annulés et les illisibles, et compte chaque raison", () => {
    const { events, ignored } = parseFeed(
      feed(
        event("UID:c", "DTSTART:20261110T090000Z", "STATUS:CANCELLED", "SUMMARY:c"),
        event("DTSTART:20261110T090000Z", "SUMMARY:sans uid"),
        event("UID:d", "DTSTART:pas-une-date", "SUMMARY:d"),
      ),
    );

    expect(events).toEqual([]);
    expect(ignored).toEqual({ ownExport: 0, cancelled: 1, invalid: 2 });
  });

  it("ignore les alarmes imbriquées dans un événement", () => {
    const { events } = parseFeed(
      feed(
        event(
          "UID:a",
          "DTSTART:20261110T090000Z",
          "SUMMARY:vrai titre",
          "BEGIN:VALARM",
          "SUMMARY:alarme",
          "TRIGGER:-PT15M",
          "END:VALARM",
        ),
      ),
    );

    expect(events[0]?.title).toBe("vrai titre");
  });

  it("borne le nombre d'événements lus", () => {
    const many = Array.from({ length: MAX_EVENTS + 10 }, (_, index) =>
      event(`UID:u${String(index)}`, "DTSTART:20261110T090000Z", "SUMMARY:x"),
    );

    expect(parseFeed(feed(...many)).events).toHaveLength(MAX_EVENTS);
  });

  it("ne produit rien d'un texte qui n'est pas un flux", () => {
    expect(parseFeed("<html>pas un calendrier</html>")).toEqual({
      events: [],
      ignored: { ownExport: 0, cancelled: 0, invalid: 0 },
    });
  });

  it("ignore ce que Planifier a exporté, par PRODID ou par marque d'événement", () => {
    const own = [
      "BEGIN:VCALENDAR",
      "PRODID:-//Planifier//Planifier//FR",
      event("UID:1", "DTSTART:20261110T090000Z", "SUMMARY:x"),
      "END:VCALENDAR",
    ].join("\r\n");
    const suffixed = feed(
      event("UID:abc@planifier", "DTSTART:20261110T090000Z", "SUMMARY:réécrit par un service"),
    );
    expect(parseFeed(suffixed).ignored.ownExport).toBe(1);
    const marked = feed(
      event("UID:2", "DTSTART:20261110T090000Z", "X-PLANIFIER-ORIGIN:export", "SUMMARY:x"),
      event("UID:3", "DTSTART:20261110T090000Z", "SUMMARY:étranger"),
    );

    expect(parseFeed(own)).toMatchObject({ events: [], ignored: { ownExport: 1 } });
    const parsed = parseFeed(marked);
    expect(parsed.events.map((e) => e.uid)).toEqual(["3"]);
    expect(parsed.ignored.ownExport).toBe(1);
  });
});
