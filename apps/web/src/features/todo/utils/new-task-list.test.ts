import type { TodoListOutput } from "@planifier/api-contract";
import { describe, expect, it } from "vitest";

import { defaultTaskList, writableLists } from "./new-task-list";

function list(id: string, fields: Partial<TodoListOutput> = {}): TodoListOutput {
  return {
    id,
    name: id,
    tint: "general",
    version: 1,
    openTaskCount: 0,
    space: null,
    readOnlySpace: null,
    can: { write: true, delete: true, share: true },
    ...fields,
  };
}

const shared = list("partagee", { space: { id: "s1", name: "Couple" } });
const readOnly = list("lecture", { can: { write: false, delete: false, share: false } });
const perso = list("perso");

describe("liste d'une nouvelle tâche", () => {
  it("ne propose pas les listes en lecture seule", () => {
    expect(writableLists([shared, readOnly, perso])).toEqual([shared, perso]);
  });

  it("propose la liste ouverte si on peut y écrire", () => {
    expect(defaultTaskList([shared, perso], "partagee")).toBe(shared);
  });

  it("sinon la première liste perso, sinon la première liste écrivable", () => {
    expect(defaultTaskList([shared, perso], "lecture")).toBe(perso);
    expect(defaultTaskList([shared], null)).toBe(shared);
  });

  it("n'en propose aucune quand il n'y en a pas", () => {
    expect(defaultTaskList([], null)).toBeNull();
  });
});
