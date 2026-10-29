import { describe, expect, it } from "vitest";

import { canAccessTodoList, type TodoListAccess } from "./todo-list";

const ME = "user-me";
const OTHER = "user-other";

const myPersonalList: TodoListAccess = { userId: ME, ownerId: ME, inSpace: false, spaceRole: null };
const othersPersonalList: TodoListAccess = { ...myPersonalList, ownerId: OTHER };
const othersSharedList = (spaceRole: TodoListAccess["spaceRole"]): TodoListAccess => ({
  userId: ME,
  ownerId: OTHER,
  inSpace: true,
  spaceRole,
});

describe("canAccessTodoList", () => {
  it("ouvre tout au propriétaire, liste perso ou partagée", () => {
    for (const list of [myPersonalList, { ...myPersonalList, inSpace: true }]) {
      for (const action of ["read", "write", "delete", "share"] as const) {
        expect(canAccessTodoList(list, action)).toBe(true);
      }
    }
  });

  it("garde privée la liste perso d'un autre, même s'il partage un Espace avec l'appelant", () => {
    for (const spaceRole of [null, "MEMBER", "OWNER"] as const) {
      expect(canAccessTodoList({ ...othersPersonalList, spaceRole }, "read")).toBe(false);
    }
  });

  it("ouvre la liste partagée en lecture et écriture à tout membre de l'Espace", () => {
    for (const spaceRole of ["MEMBER", "OWNER"] as const) {
      expect(canAccessTodoList(othersSharedList(spaceRole), "read")).toBe(true);
      expect(canAccessTodoList(othersSharedList(spaceRole), "write")).toBe(true);
    }
  });

  it("cache la liste partagée à qui n'est pas membre de l'Espace", () => {
    expect(canAccessTodoList(othersSharedList(null), "read")).toBe(false);
  });

  it("réserve la suppression au propriétaire de la liste ou de l'Espace", () => {
    expect(canAccessTodoList(othersSharedList("MEMBER"), "delete")).toBe(false);
    expect(canAccessTodoList(othersSharedList("OWNER"), "delete")).toBe(true);
  });

  it("réserve le rattachement à un Espace au propriétaire de la liste", () => {
    expect(canAccessTodoList(othersSharedList("OWNER"), "share")).toBe(false);
  });
});
