import type { EventRole } from "@planifier/constants/events";

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
  /** Membre de l'Espace de l'événement, visibilité accordée : voit l'événement sans y participer. */
  viaSpace: boolean;
}

/** Actions fixes par rôle ; `invite`, `propose_invite` et `take_ownership` dépendent du contexte (voir `canAccessEvent`). */
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
  ],
  ORGANIZER: [
    "view",
    "update",
    "react",
    "comment",
    "invite",
    "validate_proposal",
    "activate_brick",
  ],
  GUEST: ["view", "react", "comment"],
};

/** `view` faux ⇒ l'API répond NOT_FOUND. */
export function canAccessEvent(access: EventAccess, action: EventAction): boolean {
  // Un membre de l'Espace voit l'événement sans y participer ; rien d'autre.
  if (action === "view" && access.viaSpace) return true;
  // Sans rôle de participant, aucune autre action.
  if (access.role === null) return false;
  // Reprise de propriété : seulement un co-organisateur, et seulement si le propriétaire est parti.
  if (action === "take_ownership") return access.role === "ORGANIZER" && !access.hasOwner;
  // Invité : invite directement si le réglage l'autorise, sinon il propose et un organisateur valide.
  if (access.role === "GUEST" && action === "invite") return access.allowGuestInvite;
  if (access.role === "GUEST" && action === "propose_invite") return !access.allowGuestInvite;
  return ROLE_ACTIONS[access.role].includes(action);
}
