import { describe, expect, it } from "vitest";

import { ROUTES } from "@/lib/routes";

import { agendaHref, parseAgendaParams } from "./agenda-params";

const SPACE = "00000000-0000-7000-8000-000000000010";

describe("parseAgendaParams", () => {
  it("lit la vue, le jour et l'Espace", () => {
    expect(parseAgendaParams({ vue: "mois", jour: "2026-11-05", espace: SPACE })).toEqual({
      view: "MONTH",
      day: "2026-11-05",
      spaceId: SPACE,
    });
  });

  it("ignore ce qu'il ne reconnaît pas", () => {
    expect(parseAgendaParams({ vue: "an", jour: "demain", espace: ["a", "b"] })).toEqual({
      view: null,
      day: null,
      spaceId: null,
    });
  });
});

describe("agendaHref", () => {
  it("n'écrit rien sans choix", () => {
    expect(agendaHref({ view: null, day: null, spaceId: null })).toBe(ROUTES.agenda);
  });

  it("relit ce qu'il a écrit", () => {
    const params = { view: "WEEK", day: "2026-11-05", spaceId: SPACE } as const;
    const search = new URLSearchParams(agendaHref(params).split("?")[1]);
    expect(parseAgendaParams(Object.fromEntries(search))).toEqual(params);
  });
});
