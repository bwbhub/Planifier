import { describe, expect, it } from "vitest";

import { canAccessTodoList, sharingSpaceVerdict, type TodoListAccess } from "./todo-list";

const ME = "user-me";
const OTHER = "user-other";

const myPersonalList: TodoListAccess = { userId: ME, ownerId: ME, space: null };
const othersPersonalList: TodoListAccess = { ...myPersonalList, ownerId: OTHER };
const othersSharedList = (callerRole: "MEMBER" | "OWNER" | null): TodoListAccess => ({
  userId: ME,
  ownerId: OTHER,
  space: { callerRole },
});

describe("canAccessTodoList", () => {
  it("ouvre tout au propriétaire, liste perso ou partagée dont il est membre", () => {
    const mySharedList: TodoListAccess = { ...myPersonalList, space: { callerRole: "MEMBER" } };
    for (const list of [myPersonalList, mySharedList]) {
      for (const action of ["read", "write", "delete", "share"] as const) {
        expect(canAccessTodoList(list, action)).toBe(true);
      }
    }
  });

  it("garde privée la liste perso d'un autre", () => {
    for (const action of ["read", "write", "delete", "share"] as const) {
      expect(canAccessTodoList(othersPersonalList, action)).toBe(false);
    }
  });

  it("ouvre la liste partagée en lecture et écriture à tout membre de l'Espace", () => {
    for (const callerRole of ["MEMBER", "OWNER"] as const) {
      expect(canAccessTodoList(othersSharedList(callerRole), "read")).toBe(true);
      expect(canAccessTodoList(othersSharedList(callerRole), "write")).toBe(true);
    }
  });

  it("cache la liste partagée à qui n'est pas membre de l'Espace", () => {
    expect(canAccessTodoList(othersSharedList(null), "read")).toBe(false);
  });

  it("laisse la liste à l'Espace quand son créateur le quitte", () => {
    const left: TodoListAccess = { userId: ME, ownerId: ME, space: { callerRole: null } };
    for (const action of ["read", "write", "delete", "share"] as const) {
      expect(canAccessTodoList(left, action)).toBe(false);
    }
  });

  it("réserve la suppression au propriétaire de la liste ou de l'Espace", () => {
    expect(canAccessTodoList(othersSharedList("MEMBER"), "delete")).toBe(false);
    expect(canAccessTodoList(othersSharedList("OWNER"), "delete")).toBe(true);
  });

  it("réserve le rattachement à un Espace au propriétaire de la liste", () => {
    expect(canAccessTodoList(othersSharedList("OWNER"), "share")).toBe(false);
  });
});

describe("sharingSpaceVerdict", () => {
  it("accepte un Espace dont l'appelant est membre et où Todo est activé", () => {
    for (const callerRole of ["MEMBER", "OWNER"] as const) {
      expect(sharingSpaceVerdict({ callerRole, modules: ["TODO"] })).toBe("OK");
    }
  });

  it("ne révèle pas un Espace introuvable ou dont l'appelant n'est pas membre", () => {
    expect(sharingSpaceVerdict(null)).toBe("NOT_FOUND");
    expect(sharingSpaceVerdict({ callerRole: null, modules: ["TODO"] })).toBe("NOT_FOUND");
  });

  it("refuse un Espace sans le module Todo", () => {
    expect(sharingSpaceVerdict({ callerRole: "MEMBER", modules: ["AGENDA"] })).toBe(
      "TODO_DISABLED",
    );
  });
});
