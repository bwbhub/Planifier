import type { SpaceDetailOutput, SpaceMemberOutput } from "@planifier/api-contract";

// Aide de test : un Espace de trois personnes, vu par Bob (propriétaire, pas créateur).
export const SPACE_ID = "0199f3a2-7c4e-7d10-9a51-3b2f6c8e1d40";

const JOINED_AT = new Date("2026-09-01T10:00:00Z");

export const CLAIRE: SpaceMemberOutput = {
  userId: "0199f3a2-7c4e-7d10-9a51-000000000001",
  name: "Claire",
  role: "OWNER",
  joinedAt: JOINED_AT,
  isCreator: true,
};
export const BOB: SpaceMemberOutput = {
  userId: "0199f3a2-7c4e-7d10-9a51-000000000002",
  name: "Bob",
  role: "OWNER",
  joinedAt: JOINED_AT,
  isCreator: false,
};
export const ALICE: SpaceMemberOutput = {
  userId: "0199f3a2-7c4e-7d10-9a51-000000000003",
  name: "Alice",
  role: "MEMBER",
  joinedAt: JOINED_AT,
  isCreator: false,
};

export function spaceWith(
  members: SpaceMemberOutput[],
  myRole: SpaceDetailOutput["myRole"] = "OWNER",
): SpaceDetailOutput {
  return {
    id: SPACE_ID,
    name: "Coloc rue Pasteur",
    modules: ["TODO"],
    restrictVisibility: false,
    version: 3,
    myRole,
    members,
  };
}
