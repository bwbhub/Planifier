import { SHARE_LEVELS, type ShareLevel, type SpaceRole } from "@planifier/constants/spaces";

export const RESOURCE_ACTIONS = ["read", "write", "delete", "share"] as const;
export type ResourceAction = (typeof RESOURCE_ACTIONS)[number];

/** Ce que l'on sait de l'appelant et d'une ressource (liste, entrée d'agenda) pour décider d'un droit. */
export interface ResourceAccess {
  /** Utilisateur de la session. */
  userId: string;
  ownerId: string;
  /** Rôle de l'appelant dans l'Espace de la ressource ; null si la ressource est personnelle ou s'il n'en est pas membre. */
  spaceRole: SpaceRole | null;
  /** Niveau accordé aux membres de l'Espace : READ par défaut, WRITE pour une liste partagée, NONE si l'Espace restreint. */
  spaceLevel: ShareLevel;
  /** Partage direct de la ressource avec l'appelant. */
  shareLevel: ShareLevel;
}

const rank = (level: ShareLevel) => SHARE_LEVELS.indexOf(level);

const maxLevel = (a: ShareLevel, b: ShareLevel) => (rank(a) >= rank(b) ? a : b);

/** Niveau effectif de l'appelant : propriétaire, ou le plus élevé du partage direct et de l'Espace. */
export function resourceLevel(access: ResourceAccess): ShareLevel {
  if (access.userId === access.ownerId) return "WRITE";
  // Le niveau de l'Espace ne vaut que pour un membre.
  const viaSpace = access.spaceRole === null ? "NONE" : access.spaceLevel;
  return maxLevel(access.shareLevel, viaSpace);
}

/**
 * `read` faux ⇒ l'API répond NOT_FOUND. Le propriétaire d'Espace supprime une ressource de l'Espace
 * seulement s'il la voit (un Espace restreint ne lui révèle rien).
 */
export function canAccessResource(access: ResourceAccess, action: ResourceAction): boolean {
  const isOwner = access.userId === access.ownerId;
  const level = resourceLevel(access);
  switch (action) {
    case "read":
      return rank(level) >= rank("READ");
    case "write":
      return level === "WRITE";
    case "delete":
      return isOwner || (access.spaceRole === "OWNER" && rank(level) >= rank("READ"));
    case "share":
      return isOwner;
  }
}
