import { describe, expect, it } from "vitest";

import { PERSONAL, sharingChoices, sharingFields } from "./sharing-choices";

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

describe("sharingFields", () => {
  const privateList = { space: null, readOnlySpace: null };
  const sharedList = { space: coloc, readOnlySpace: null };
  const shownList = { space: null, readOnlySpace: coloc };

  it("n'envoie rien à la création d'une liste perso", () => {
    expect(sharingFields(PERSONAL, "WRITE", undefined)).toEqual({});
  });

  it("n'envoie que le champ choisi à la création", () => {
    expect(sharingFields(coloc.id, "WRITE", undefined)).toEqual({ spaceId: coloc.id });
    expect(sharingFields(coloc.id, "READ", undefined)).toEqual({ readOnlySpaceId: coloc.id });
  });

  it("n'envoie rien quand le partage ne change pas", () => {
    expect(sharingFields(PERSONAL, "WRITE", privateList)).toEqual({});
    expect(sharingFields(coloc.id, "WRITE", sharedList)).toEqual({});
    expect(sharingFields(coloc.id, "READ", shownList)).toEqual({});
  });

  it("change de niveau dans le même Espace", () => {
    expect(sharingFields(coloc.id, "READ", sharedList)).toEqual({
      spaceId: null,
      readOnlySpaceId: coloc.id,
    });
    expect(sharingFields(coloc.id, "WRITE", shownList)).toEqual({
      spaceId: coloc.id,
      readOnlySpaceId: null,
    });
  });

  it("retire le partage", () => {
    expect(sharingFields(PERSONAL, "READ", shownList)).toEqual({
      spaceId: null,
      readOnlySpaceId: null,
    });
  });
});
