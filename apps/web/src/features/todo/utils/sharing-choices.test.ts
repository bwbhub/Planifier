import { describe, expect, it } from "vitest";

import { sharingChoices } from "./sharing-choices";

const coloc = { id: "s-1", name: "Coloc" };
const couple = { id: "s-2", name: "Couple" };

describe("sharingChoices", () => {
  it("propose les Espaces où Todo est activé", () => {
    expect(sharingChoices([coloc, couple], null)).toEqual([coloc, couple]);
    expect(sharingChoices([coloc, couple], couple)).toEqual([coloc, couple]);
  });

  it("garde l'Espace actuel de la liste en tête, même si Todo y est désactivé", () => {
    expect(sharingChoices([coloc], couple)).toEqual([couple, coloc]);
  });
});
