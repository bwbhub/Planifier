import { describe, expect, it } from "vitest";

import { sharingChoices } from "./sharing-choices";

const coloc = { id: "s-1", name: "Coloc" };
const couple = { id: "s-2", name: "Couple" };
const spaces = [
  { ...coloc, modules: ["TODO", "AGENDA"] as const },
  { ...couple, modules: ["AGENDA"] as const },
];

describe("sharingChoices", () => {
  it("propose les Espaces où Todo est activé", () => {
    expect(sharingChoices(spaces, null)).toEqual([coloc]);
    expect(sharingChoices(spaces, coloc)).toEqual([coloc]);
  });

  it("garde l'Espace actuel de la liste en tête, même si Todo y est désactivé", () => {
    expect(sharingChoices(spaces, couple)).toEqual([couple, coloc]);
  });
});
