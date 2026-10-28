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
  /** Créateur de l'Espace : propriétaire protégé, personne ne le rétrograde ni ne le retire. */
  isCreator: boolean;
  ownerCount: number;
  memberCount: number;
}

/** Vrai si ce membre, en cessant d'être propriétaire, laisserait l'Espace sans propriétaire. */
const isLastOwner = ({ role, ownerCount }: SpaceMembership) => role === "OWNER" && ownerCount <= 1;

export type DepartureOutcome = "leave" | "delete_space" | "last_owner";

/**
 * Départ volontaire d'un membre. Le dernier membre emporte l'Espace ; le dernier propriétaire est refusé
 * (`last_owner`) tant qu'il reste des membres : rien n'est transmis à son insu, il nomme un autre propriétaire ou
 * supprime l'Espace.
 */
export function departureOutcome(membership: SpaceMembership): DepartureOutcome {
  if (membership.memberCount <= 1) return "delete_space";
  if (isLastOwner(membership)) return "last_owner";
  return "leave";
}

/** Changement de rôle ou retrait d'un membre par un propriétaire : permis, ou refusé et pourquoi. */
export type MemberChangeOutcome = "allowed" | "creator" | "last_owner";

/** Rétrograder : jamais le créateur (même lui-même), jamais le dernier propriétaire. Nommer propriétaire : toujours. */
export function roleChangeOutcome(
  membership: SpaceMembership,
  nextRole: SpaceRole,
): MemberChangeOutcome {
  if (nextRole === "OWNER") return "allowed";
  if (membership.isCreator) return "creator";
  return isLastOwner(membership) ? "last_owner" : "allowed";
}

/**
 * Retirer un autre membre : jamais le créateur (il part seul s'il le veut), jamais le dernier propriétaire (n'arrive
 * que si l'appelant a perdu son rôle entre-temps).
 */
export function removalOutcome(membership: SpaceMembership): MemberChangeOutcome {
  if (membership.isCreator) return "creator";
  return isLastOwner(membership) ? "last_owner" : "allowed";
}

/** Ce que l'interface sait de l'Espace pour l'appelant. */
export interface SpaceOverview {
  myRole: SpaceRole;
  ownerCount: number;
  memberCount: number;
}

/**
 * Retombé à deux membres avec un seul propriétaire (après un départ) : l'interface propose à ce propriétaire de
 * nommer l'autre. Une proposition seulement, rien n'est changé sans son accord (principe produit).
 */
export function suggestsOwnerPromotion({
  myRole,
  ownerCount,
  memberCount,
}: SpaceOverview): boolean {
  return myRole === "OWNER" && memberCount === 2 && ownerCount === 1;
}
