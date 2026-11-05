import { afterEach, describe, expect, it, vi } from "vitest";

import { itemWith } from "../testing/agenda-fixtures";
import {
  type AgendaItem,
  dayContent,
  hoursRange,
  itemLabel,
  localMidnight,
  whenLabel,
  windowOf,
} from "./agenda-items";

function item(id: string, when: AgendaItem["when"]): AgendaItem {
  return itemWith({ id, title: id, when });
}

const timed = (id: string, start: string, end: string) =>
  item(id, { allDay: false, startsAt: new Date(start), endsAt: new Date(end) });

describe("windowOf", () => {
  it("couvre le premier jour et le lendemain du dernier, en heure de l'appareil", () => {
    expect(windowOf(["2026-11-02", "2026-11-08"])).toEqual({
      from: localMidnight("2026-11-02"),
      to: localMidnight("2026-11-09"),
      fromDay: "2026-11-02",
      toDay: "2026-11-08",
    });
  });
});

describe("dayContent", () => {
  it("place côte à côte deux créneaux qui se chevauchent", () => {
    const { slots } = dayContent(
      [
        timed("a", "2026-11-05T09:00", "2026-11-05T10:00"),
        timed("b", "2026-11-05T09:30", "2026-11-05T11:00"),
      ],
      "2026-11-05",
    );
    expect(slots.map(({ start, column, columns }) => [start, column, columns])).toEqual([
      [540, 0, 2],
      [570, 1, 2],
    ]);
  });

  it("coupe à minuit un créneau sur deux jours", () => {
    const overnight = timed("a", "2026-11-05T23:00", "2026-11-06T01:00");
    expect(dayContent([overnight], "2026-11-05").slots[0]).toMatchObject({
      start: 1380,
      end: 1440,
    });
    expect(dayContent([overnight], "2026-11-06").slots[0]).toMatchObject({ start: 0, end: 60 });
    expect(dayContent([overnight], "2026-11-07").slots).toEqual([]);
  });

  it("n'affiche pas au lendemain un créneau qui finit à minuit", () => {
    const untilMidnight = timed("a", "2026-11-05T22:00", "2026-11-06T00:00");
    expect(dayContent([untilMidnight], "2026-11-06").slots).toEqual([]);
  });

  it("garde une hauteur lisible à un créneau très court", () => {
    const short = timed("a", "2026-11-05T09:00", "2026-11-05T09:05");
    expect(dayContent([short], "2026-11-05").slots[0]).toMatchObject({ start: 540, end: 570 });
  });

  it("montre une entrée à la journée chaque jour qu'elle couvre", () => {
    const weekend = item("a", { allDay: true, startDay: "2026-11-14", endDay: "2026-11-15" });
    expect(dayContent([weekend], "2026-11-13").allDay).toEqual([]);
    expect(dayContent([weekend], "2026-11-15").allDay).toEqual([weekend]);
    expect(dayContent([weekend], "2026-11-15").slots).toEqual([]);
  });
});

describe("hoursRange", () => {
  it("va de 8 h à 22 h par défaut", () => {
    expect(hoursRange([{ allDay: [], slots: [] }])).toEqual({ first: 8, last: 22 });
  });

  it("s'élargit aux créneaux qui en sortent", () => {
    const content = dayContent([timed("a", "2026-11-05T06:30", "2026-11-05T23:15")], "2026-11-05");
    expect(hoursRange([content])).toEqual({ first: 6, last: 24 });
  });
});

describe("whenLabel", () => {
  it("dit toute la journée", () => {
    expect(whenLabel({ allDay: true, startDay: "2026-11-05", endDay: "2026-11-05" })).toBe(
      "Toute la journée",
    );
  });

  it("donne les heures", () => {
    const when = {
      allDay: false,
      startsAt: new Date("2026-11-05T09:00"),
      endsAt: new Date("2026-11-05T10:30"),
    } as const;
    expect(whenLabel(when)).toBe("09:00 – 10:30");
  });
});

describe("créneaux en bord de journée", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("place l'entrée à son heure d'horloge le jour du changement d'heure", () => {
    vi.stubEnv("TZ", "Europe/Paris");
    const { slots } = dayContent(
      [timed("a", "2026-10-25T10:00:00+01:00", "2026-10-25T11:00:00+01:00")],
      "2026-10-25",
    );
    expect(slots[0]).toMatchObject({ start: 600, end: 660 });
  });

  it("garde une entrée de fin de soirée dans la journée, ce jour-là aussi", () => {
    vi.stubEnv("TZ", "Europe/Paris");
    const { slots } = dayContent(
      [timed("a", "2026-10-25T23:00:00+01:00", "2026-10-26T00:00:00+01:00")],
      "2026-10-25",
    );
    expect(slots[0]).toMatchObject({ start: 1380, end: 1440 });
  });

  it("coupe à minuit une entrée sur deux jours", () => {
    const entry = timed("a", "2026-11-05T22:00", "2026-11-06T02:00");
    expect(dayContent([entry], "2026-11-05").slots[0]).toMatchObject({ start: 1320, end: 1440 });
    expect(dayContent([entry], "2026-11-06").slots[0]).toMatchObject({ start: 0, end: 120 });
  });

  it("ne fait pas déborder minuit à un créneau très court", () => {
    const entry = timed("a", "2026-11-05T23:50", "2026-11-05T23:55");
    expect(dayContent([entry], "2026-11-05").slots[0]).toMatchObject({ start: 1410, end: 1440 });
  });
});

describe("whenLabel sur plusieurs jours", () => {
  it("donne les dates d'une entrée horaire", () => {
    const { when } = timed("a", "2026-11-05T22:00", "2026-11-06T02:00");
    expect(whenLabel(when)).toBe("5 novembre 22:00 – 6 novembre 02:00");
  });

  it("donne les dates d'une entrée à la journée", () => {
    const when = { allDay: true, startDay: "2026-11-05", endDay: "2026-11-07" } as const;
    expect(whenLabel(when)).toBe("Du 5 novembre au 7 novembre");
  });
});

describe("itemLabel", () => {
  it("dit l'horaire, le lieu et la personne", () => {
    const owner = { userId: "bob", name: "Bob" };
    const entry = { ...timed("Dentiste", "2026-11-05T09:00", "2026-11-05T10:00"), owner };
    expect(itemLabel({ ...entry, location: "Cabinet", participants: ["Marie", "Léo"] })).toBe(
      "Dentiste, 09:00 – 10:00, Cabinet, avec Marie, Léo, Bob",
    );
  });
});
