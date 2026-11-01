import { describe, expect, it } from "vitest";

import { assigneeFromForm, assigneeOptions } from "./assignees";

const alice = { userId: "a", name: "Alice" };
const bob = { userId: "b", name: "Bob" };

describe("assigneeOptions", () => {
  it("propose personne, puis chaque membre", () => {
    expect(assigneeOptions([alice], null)).toEqual([
      { value: "", label: "Personne" },
      { value: "a", label: "Alice" },
    ]);
  });

  it("garde l'assigné absent d'une liste périmée, sans doublon sinon", () => {
    expect(assigneeOptions([alice], bob).map(({ value }) => value)).toEqual(["", "a", "b"]);
    expect(assigneeOptions([alice], alice).map(({ value }) => value)).toEqual(["", "a"]);
  });
});

describe("assigneeFromForm", () => {
  it("distingue champ absent, personne et membre", () => {
    expect(assigneeFromForm(null)).toBeUndefined();
    expect(assigneeFromForm("")).toBeNull();
    expect(assigneeFromForm("a")).toBe("a");
  });
});
