import type { CommentKind, EventRole } from "@planifier/constants/events";

export const EVENT_ACTIONS = [
  "view",
  "update",
  "react",
  "comment",
  "propose_invite",
  "invite",
  "validate_proposal",
  "activate_brick",
  "deactivate_brick",
  "delete",
  "take_ownership",
  "manage_roles",
  "remove_guest",
  "mark_important",
  "see_guest_list",
  "change_space",
] as const;
export type EventAction = (typeof EVENT_ACTIONS)[number];

/** Ce que l'on sait de l'appelant et d'un événement pour décider d'un droit. */
export interface EventAccess {
  /** Rôle de participant de l'appelant ; null s'il ne participe pas. */
  role: EventRole | null;
  /** false : le propriétaire a supprimé son compte (`ownerLeftAt`). */
  hasOwner: boolean;
  /** Réglage de l'événement : un invité invite directement au lieu de proposer. */
  allowGuestInvite: boolean;
  /** Réglage de l'événement : les invités voient qui vient (les organisateurs, toujours). */
  isGuestListVisible: boolean;
  /** Membre de l'Espace de l'événement, visibilité accordée : voit l'événement sans y participer. */
  viaSpace: boolean;
  /** Invitation en attente pour l'adresse e-mail de la session, sans participation : voit l'événement et y répond. */
  invitedByEmail: boolean;
}

/**
 * Actions fixes par rôle ; `invite`, `propose_invite`, `see_guest_list` et `take_ownership` dépendent du contexte
 * (voir `canAccessEvent`).
 */
const ROLE_ACTIONS: Record<EventRole, readonly EventAction[]> = {
  OWNER: [
    "view",
    "update",
    "react",
    "comment",
    "invite",
    "validate_proposal",
    "activate_brick",
    "deactivate_brick",
    "delete",
    "manage_roles",
    "remove_guest",
    "mark_important",
    "change_space",
  ],
  ORGANIZER: [
    "view",
    "update",
    "react",
    "comment",
    "invite",
    "validate_proposal",
    "activate_brick",
    "remove_guest",
    "mark_important",
  ],
  GUEST: ["view", "react", "comment"],
};

/**
 * Sans rôle de participant : un membre de l'Espace voit l'événement (et la liste des invités si elle est visible) ;
 * un invité par e-mail le voit et y répond ; rien d'autre.
 */
function canAccessWithoutRole(access: EventAccess, action: EventAction): boolean {
  if (action === "view") return access.viaSpace || access.invitedByEmail;
  if (action === "react") return access.invitedByEmail;
  return action === "see_guest_list" && access.viaSpace && access.isGuestListVisible;
}

/** Participant : droits du rôle, sauf les actions qui dépendent du contexte. */
function canAccessAsParticipant(
  role: EventRole,
  access: EventAccess,
  action: EventAction,
): boolean {
  // Reprise de propriété : seulement un co-organisateur, et seulement si le propriétaire est parti.
  if (action === "take_ownership") return role === "ORGANIZER" && !access.hasOwner;
  // Les organisateurs voient toujours qui vient ; un invité, seulement si l'événement le permet.
  if (action === "see_guest_list") return role !== "GUEST" || access.isGuestListVisible;
  // Invité : invite directement si le réglage l'autorise, sinon il propose et un organisateur valide.
  if (role === "GUEST" && action === "invite") return access.allowGuestInvite;
  if (role === "GUEST" && action === "propose_invite") return !access.allowGuestInvite;
  return ROLE_ACTIONS[role].includes(action);
}

/** `view` faux ⇒ l'API répond NOT_FOUND. */
export function canAccessEvent(access: EventAccess, action: EventAction): boolean {
  return access.role === null
    ? canAccessWithoutRole(access, action)
    : canAccessAsParticipant(access.role, access, action);
}

/**
 * Retrait d'un participant (`remove_guest` déjà accordé à l'appelant) : le propriétaire retire un co-organisateur ou
 * un invité, un co-organisateur retire un invité. Personne ne retire le propriétaire, ni soi-même (on part par
 * « Non » ; la suppression du compte a son propre parcours).
 */
export function canRemoveParticipant({
  callerRole,
  targetRole,
  isSelf,
}: {
  callerRole: EventRole;
  targetRole: EventRole;
  isSelf: boolean;
}): boolean {
  if (isSelf || targetRole === "OWNER") return false;
  if (callerRole === "OWNER") return true;
  return callerRole === "ORGANIZER" && targetRole === "GUEST";
}

/**
 * Suppression d'un commentaire : l'auteur retire le sien, un organisateur retire n'importe lequel. Un message
 * automatique de changement (`CHANGE`) n'est retiré que par un organisateur : son « auteur » est celui qui a modifié.
 */
export function canDeleteComment({
  role,
  isAuthor,
  kind,
}: {
  role: EventRole | null;
  isAuthor: boolean;
  kind: CommentKind;
}): boolean {
  if (role === null) return false;
  if (role === "OWNER" || role === "ORGANIZER") return true;
  return kind === "TEXT" && isAuthor;
}
