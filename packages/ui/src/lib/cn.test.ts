import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it("garde une taille des tokens à côté d'une couleur, et la remplace par une autre taille", () => {
    expect(cn("text-control text-ink")).toBe("text-control text-ink");
    expect(cn("text-control", "text-sm")).toBe("text-sm");
  });
});
