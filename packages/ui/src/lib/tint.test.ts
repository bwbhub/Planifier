import { describe, expect, it } from "vitest";

import { initialOf, tintOf } from "./tint";

describe("tintOf", () => {
  it("donne toujours la même teinte au même identifiant", () => {
    const id = "0199f3a2-7c4e-7d10-9a51-3b2f6c8e1d40";
    expect(tintOf(id)).toEqual(tintOf(id));
  });

  it("répartit des identifiants différents sur plusieurs teintes", () => {
    const ids = Array.from({ length: 40 }, (_, index) => `espace-${String(index)}`);
    expect(new Set(ids.map((id) => tintOf(id).background)).size).toBeGreaterThan(1);
  });
});

describe("initialOf", () => {
  it("prend la première lettre en majuscule", () => {
    expect(initialOf("  élodie")).toBe("É");
  });

  it("montre un point d'interrogation sans nom", () => {
    expect(initialOf("   ")).toBe("?");
  });
});
