import type { SpaceRole } from "@planifier/constants/spaces";

export const SPACE_ACTIONS = [
  "view",
  "leave",
  "update",
  "delete",
  "invite",
  "manage_members",
] as const;
export type SpaceAction = (typeof SPACE_ACTIONS)[number];

/** Un membre voit l'Espace et peut le quitter ; le reste (réglages, invitations, membres, suppression) est aux propriétaires. */
const ROLE_ACTIONS: Record<SpaceRole, readonly SpaceAction[]> = {
  OWNER: SPACE_ACTIONS,
  MEMBER: ["view", "leave"],
};

/** `role` : rôle de l'appelant dans l'Espace, null s'il n'en est pas membre. `view` faux ⇒ l'API répond NOT_FOUND. */
export function canAccessSpace(role: SpaceRole | null, action: SpaceAction): boolean {
  return role !== null && ROLE_ACTIONS[role].includes(action);
}

/**
 * Rôle de qui rejoint un Espace de `memberCount` membres : le créateur et le deuxième membre sont propriétaires
 * (double propriétaire à 2, CONTEXT.md), les suivants sont membres. Stocké à l'arrivée : l'arrivée d'un troisième
 * ne retire rien au deuxième.
 */
export function roleOfNewMember(memberCount: number): SpaceRole {
  return memberCount < 2 ? "OWNER" : "MEMBER";
}

/** Ce que l'on sait de l'Espace quand un membre en part ou change de rôle. */
export interface SpaceMembership {
  /** Rôle actuel du membre concerné. */
  role: SpaceRole;
  ownerCount: number;
  memberCount: number;
}

export type DepartureOutcome = "leave" | "delete_space" | "last_owner";

/**
 * Départ volontaire d'un membre. Le dernier membre emporte l'Espace ; le dernier propriétaire est refusé
 * (`last_owner`) tant qu'il reste des membres : rien n'est transmis à son insu, il nomme un autre propriétaire ou
 * supprime l'Espace.
 */
export function departureOutcome({
  role,
  ownerCount,
  memberCount,
}: SpaceMembership): DepartureOutcome {
  if (memberCount <= 1) return "delete_space";
  if (role === "OWNER" && ownerCount <= 1) return "last_owner";
  return "leave";
}

/** Changement de rôle : refusé s'il laisse l'Espace sans propriétaire. */
export function canChangeRole({ role, ownerCount }: SpaceMembership, nextRole: SpaceRole): boolean {
  return !(role === "OWNER" && nextRole === "MEMBER" && ownerCount <= 1);
}
