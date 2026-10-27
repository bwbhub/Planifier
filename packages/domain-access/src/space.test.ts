import { SPACE_ROLES, type SpaceRole } from "@planifier/constants/spaces";
import { describe, expect, it } from "vitest";

import {
  canAccessSpace,
  canChangeRole,
  canRemoveMember,
  departureOutcome,
  roleOfNewMember,
  SPACE_ACTIONS,
  type SpaceAction,
} from "./space";

function allowedActions(role: SpaceRole | null): SpaceAction[] {
  return SPACE_ACTIONS.filter((action) => canAccessSpace(role, action));
}

/** Matrice attendue (CONTEXT.md, décision du 2026-10-27), écrite indépendamment de l'implémentation. */
const expected: Record<SpaceRole, SpaceAction[]> = {
  OWNER: ["view", "leave", "update", "delete", "invite", "manage_members"],
  MEMBER: ["view", "leave"],
};

describe("canAccessSpace : matrice par rôle", () => {
  it.each(SPACE_ROLES)("accorde au rôle %s exactement ses actions", (role) => {
    expect(allowedActions(role)).toEqual(expected[role]);
  });

  it("ne donne rien à qui n'est pas membre", () => {
    expect(allowedActions(null)).toEqual([]);
  });
});

describe("roleOfNewMember", () => {
  it.each([
    [0, "OWNER"],
    [1, "OWNER"],
    [2, "MEMBER"],
    [10, "MEMBER"],
  ] as const)("à %i membre(s), le nouveau est %s", (memberCount, role) => {
    expect(roleOfNewMember(memberCount)).toBe(role);
  });
});

describe("departureOutcome", () => {
  it("supprime l'Espace quand le dernier membre part", () => {
    expect(departureOutcome({ role: "OWNER", ownerCount: 1, memberCount: 1 })).toBe("delete_space");
  });

  it("refuse le départ du dernier propriétaire tant qu'il reste des membres", () => {
    expect(departureOutcome({ role: "OWNER", ownerCount: 1, memberCount: 3 })).toBe("last_owner");
  });

  it("laisse partir un propriétaire qui n'est pas le dernier", () => {
    expect(departureOutcome({ role: "OWNER", ownerCount: 2, memberCount: 2 })).toBe("leave");
  });

  it("laisse partir un membre", () => {
    expect(departureOutcome({ role: "MEMBER", ownerCount: 1, memberCount: 3 })).toBe("leave");
  });
});

describe("canChangeRole", () => {
  it("refuse de rétrograder le dernier propriétaire", () => {
    expect(canChangeRole({ role: "OWNER", ownerCount: 1, memberCount: 3 }, "MEMBER")).toBe(false);
  });

  it("rétrograde un propriétaire s'il en reste un autre", () => {
    expect(canChangeRole({ role: "OWNER", ownerCount: 2, memberCount: 3 }, "MEMBER")).toBe(true);
  });

  it.each(SPACE_ROLES)("accepte toujours de nommer propriétaire (depuis %s)", (role) => {
    expect(canChangeRole({ role, ownerCount: 1, memberCount: 3 }, "OWNER")).toBe(true);
  });
});

describe("canRemoveMember", () => {
  it("refuse de retirer le dernier propriétaire", () => {
    expect(canRemoveMember({ role: "OWNER", ownerCount: 1, memberCount: 3 })).toBe(false);
  });

  it("retire un propriétaire s'il en reste un autre, et tout membre", () => {
    expect(canRemoveMember({ role: "OWNER", ownerCount: 2, memberCount: 3 })).toBe(true);
    expect(canRemoveMember({ role: "MEMBER", ownerCount: 1, memberCount: 3 })).toBe(true);
  });
});
