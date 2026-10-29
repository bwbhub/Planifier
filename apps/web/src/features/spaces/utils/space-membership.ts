import type { SpaceDetailOutput, SpaceMemberOutput } from "@planifier/api-contract";
import type { SpaceMembership, SpaceOverview } from "@planifier/domain-access/space";

/**
 * Passerelle entre l'Espace lu par l'API et les règles de `domain-access` : l'interface applique les mêmes fonctions
 * que le serveur, sans les réécrire. Le serveur reste juge ; l'interface n'affiche que ce qu'il accepterait.
 */
function ownerCountOf(space: SpaceDetailOutput): number {
  return space.members.filter((member) => member.role === "OWNER").length;
}

/** L'Espace vu par l'appelant. */
export function overviewOf(space: SpaceDetailOutput): SpaceOverview {
  return {
    myRole: space.myRole,
    ownerCount: ownerCountOf(space),
    memberCount: space.members.length,
  };
}

/** Situation d'un membre, pour les règles de rôle et de retrait. */
export function membershipOf(
  space: SpaceDetailOutput,
  member: Pick<SpaceMemberOutput, "role" | "isCreator">,
): SpaceMembership {
  return {
    role: member.role,
    isCreator: member.isCreator,
    ownerCount: ownerCountOf(space),
    memberCount: space.members.length,
  };
}

/** Situation de l'appelant (`meId`), pour la règle de départ. */
export function myMembershipOf(space: SpaceDetailOutput, meId: string): SpaceMembership {
  const isCreator = space.members.some((member) => member.userId === meId && member.isCreator);
  return membershipOf(space, { role: space.myRole, isCreator });
}
