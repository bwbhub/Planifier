import { SPACE_ROLES, type SpaceRole } from "@planifier/constants/spaces";
import { describe, expect, it } from "vitest";

import {
  canAccessSpace,
  departureOutcome,
  removalOutcome,
  roleChangeOutcome,
  roleOfNewMember,
  SPACE_ACTIONS,
  type SpaceAction,
  type SpaceMembership,
  suggestsOwnerPromotion,
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

/** Propriétaire non créateur, dans un Espace de 3 avec 2 propriétaires. */
const owner: SpaceMembership = { role: "OWNER", isCreator: false, ownerCount: 2, memberCount: 3 };
const creator: SpaceMembership = { ...owner, isCreator: true };
const member: SpaceMembership = { ...owner, role: "MEMBER" };
const lastOwner: SpaceMembership = { ...owner, ownerCount: 1 };

describe("departureOutcome", () => {
  it("supprime l'Espace quand le dernier membre part", () => {
    expect(departureOutcome({ ...creator, ownerCount: 1, memberCount: 1 })).toBe("delete_space");
  });

  it("refuse le départ du dernier propriétaire tant qu'il reste des membres", () => {
    expect(departureOutcome(lastOwner)).toBe("last_owner");
  });

  it("laisse partir le créateur s'il reste un autre propriétaire", () => {
    expect(departureOutcome(creator)).toBe("leave");
  });

  it("laisse partir un membre", () => {
    expect(departureOutcome(member)).toBe("leave");
  });
});

describe("roleChangeOutcome", () => {
  it("refuse de rétrograder le créateur", () => {
    expect(roleChangeOutcome(creator, "MEMBER")).toBe("creator");
  });

  it("refuse de rétrograder le dernier propriétaire", () => {
    expect(roleChangeOutcome(lastOwner, "MEMBER")).toBe("last_owner");
  });

  it("rétrograde un propriétaire non créateur s'il en reste un autre", () => {
    expect(roleChangeOutcome(owner, "MEMBER")).toBe("allowed");
  });

  it("accepte toujours de nommer propriétaire", () => {
    expect(roleChangeOutcome(member, "OWNER")).toBe("allowed");
  });
});

describe("removalOutcome", () => {
  it("refuse de retirer le créateur", () => {
    expect(removalOutcome(creator)).toBe("creator");
  });

  it("refuse de retirer le dernier propriétaire", () => {
    expect(removalOutcome(lastOwner)).toBe("last_owner");
  });

  it("retire un propriétaire non créateur ou un membre", () => {
    expect(removalOutcome(owner)).toBe("allowed");
    expect(removalOutcome(member)).toBe("allowed");
  });
});

describe("suggestsOwnerPromotion", () => {
  it("propose au propriétaire seul d'un Espace à deux de nommer l'autre", () => {
    expect(suggestsOwnerPromotion({ myRole: "OWNER", ownerCount: 1, memberCount: 2 })).toBe(true);
  });

  it.each([
    { myRole: "MEMBER", ownerCount: 1, memberCount: 2 },
    { myRole: "OWNER", ownerCount: 2, memberCount: 2 },
    { myRole: "OWNER", ownerCount: 1, memberCount: 3 },
  ] as const)("ne propose rien sinon (%o)", (overview) => {
    expect(suggestsOwnerPromotion(overview)).toBe(false);
  });
});
