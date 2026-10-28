import type { SpaceDetailOutput, SpaceMemberOutput } from "@planifier/api-contract";
import { describe, expect, it } from "vitest";

import { membershipOf, myMembershipOf, overviewOf } from "./space-membership";

const JOINED = new Date(2026, 9, 1);

function member(userId: string, role: SpaceMemberOutput["role"], isCreator = false) {
  return { userId, name: userId, role, isCreator, joinedAt: JOINED };
}

const SPACE: SpaceDetailOutput = {
  id: "0199f3a2-7c4e-7d10-9a51-3b2f6c8e1d40",
  name: "Coloc rue Pasteur",
  modules: [],
  restrictVisibility: false,
  version: 1,
  myRole: "OWNER",
  members: [member("camille", "OWNER", true), member("leo", "OWNER"), member("sam", "MEMBER")],
};

describe("overviewOf", () => {
  it("compte les propriétaires et les membres", () => {
    expect(overviewOf(SPACE)).toEqual({ myRole: "OWNER", ownerCount: 2, memberCount: 3 });
  });
});

describe("membershipOf", () => {
  it("décrit un membre avec les effectifs de l'Espace", () => {
    expect(membershipOf(SPACE, member("sam", "MEMBER"))).toEqual({
      role: "MEMBER",
      isCreator: false,
      ownerCount: 2,
      memberCount: 3,
    });
  });
});

describe("myMembershipOf", () => {
  it("reconnaît l'appelant créateur", () => {
    expect(myMembershipOf(SPACE, "camille").isCreator).toBe(true);
  });

  it("prend le rôle de l'appelant tel que l'API le donne", () => {
    expect(myMembershipOf({ ...SPACE, myRole: "MEMBER" }, "sam")).toMatchObject({
      role: "MEMBER",
      isCreator: false,
    });
  });
});
