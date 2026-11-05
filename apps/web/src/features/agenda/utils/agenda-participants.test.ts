import { describe, expect, it } from "vitest";

import { participantsFromText, participantsLabel } from "./agenda-participants";

describe("participantsFromText", () => {
  it("lit les noms séparés par des virgules, sans vide", () => {
    expect(participantsFromText(", Léo ,, Marie ")).toEqual(["Léo", "Marie"]);
  });

  it("garde un nom une fois, quelle que soit la casse", () => {
    expect(participantsFromText("Marie, marie, MARIE")).toEqual(["Marie"]);
  });

  it("ne donne personne pour un champ vide", () => {
    expect(participantsFromText("  ")).toEqual([]);
  });
});

describe("participantsLabel", () => {
  it("écrit « avec … », ou rien", () => {
    expect(participantsLabel(["Marie", "Léo"])).toBe("avec Marie, Léo");
    expect(participantsLabel([])).toBeNull();
  });
});
