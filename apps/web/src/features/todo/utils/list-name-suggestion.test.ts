import { TODO_LIST_NAME_MAX_LENGTH } from "@planifier/constants/todo";
import { describe, expect, it } from "vitest";

import { nameAfterSpaceChange, suggestedListName } from "./list-name-suggestion";

describe("suggestedListName", () => {
  it("nomme la liste d'après l'Espace, dans la longueur permise", () => {
    expect(suggestedListName("Coloc")).toBe("Liste Coloc");
    expect(suggestedListName("x".repeat(60))).toHaveLength(TODO_LIST_NAME_MAX_LENGTH);
  });
});

describe("nameAfterSpaceChange", () => {
  it("propose le nom de l'Espace dans un champ vide, et le suit d'un Espace à l'autre", () => {
    expect(nameAfterSpaceChange("", "", "Coloc")).toBe("Liste Coloc");
    expect(nameAfterSpaceChange("Liste Coloc", "Liste Coloc", "Couple")).toBe("Liste Couple");
  });

  it("vide la proposition quand on revient à une liste perso", () => {
    expect(nameAfterSpaceChange("Liste Coloc", "Liste Coloc", null)).toBe("");
  });

  it("garde le nom écrit par l'utilisateur", () => {
    expect(nameAfterSpaceChange("Courses", "", "Coloc")).toBe("Courses");
    expect(nameAfterSpaceChange("Liste Coloc 2", "Liste Coloc", "Couple")).toBe("Liste Coloc 2");
  });
});
