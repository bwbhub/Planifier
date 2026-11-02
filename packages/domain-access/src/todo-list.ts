import type { AppModule, SpaceRole } from "@planifier/constants/spaces";

import type { ResourceAction } from "./resource";

/** Ce que l'on sait d'une liste Todo et de l'appelant. */
export interface TodoListAccess {
  userId: string;
  ownerId: string;
  /**
   * Liste partagée : rôle de l'appelant dans son Espace (null s'il n'en est pas membre). Liste perso : null.
   */
  space: { callerRole: SpaceRole | null } | null;
  /** Liste perso montrée en lecture seule à un Espace dont l'appelant est membre. */
  isReader: boolean;
}

/**
 * Liste perso : privée, tout à son propriétaire ; montrée à un Espace, ses membres la lisent, sans plus. Liste partagée : la rattacher à l'Espace, c'est la partager avec
 * lui, même quand il restreint sa visibilité ; elle appartient alors à l'Espace (décisions du 2026-10-29) :
 * - `read`, `write` (nom, teinte, tâches) : tout membre ;
 * - `delete` : son créateur, ou un propriétaire de l'Espace ;
 * - `share` (changer d'Espace, la rendre perso) : son créateur.
 * Seuls les membres comptent : le créateur parti ne la voit plus, elle reste à l'Espace. `read` faux ⇒ NOT_FOUND.
 */
export function canAccessTodoList(
  { userId, ownerId, space, isReader }: TodoListAccess,
  action: ResourceAction,
): boolean {
  const isOwner = userId === ownerId;
  if (space === null) return isOwner || (isReader && action === "read");
  if (space.callerRole === null) return false;
  switch (action) {
    case "read":
    case "write":
      return true;
    case "delete":
      return isOwner || space.callerRole === "OWNER";
    case "share":
      return isOwner;
  }
}

/**
 * Une tâche s'assigne à un membre de l'Espace de sa liste ; une liste perso n'en a aucun. Vrai à l'écriture comme à
 * la lecture : parti de l'Espace, ou liste rendue perso, l'ancien assigné ne se montre plus.
 */
export function canBeAssigned(userId: string, spaceMemberIds: ReadonlySet<string>): boolean {
  return spaceMemberIds.has(userId);
}

/** Espace où l'appelant veut partager une liste : son rôle (null s'il n'en est pas membre) et ses modules. */
export interface SharingSpace {
  callerRole: SpaceRole | null;
  modules: readonly AppModule[];
}

/**
 * Peut-on partager une liste avec cet Espace ? Introuvable ou appelant non membre ⇒ `NOT_FOUND` (l'Espace n'existe
 * pas pour lui) ; Todo non activé ⇒ `TODO_DISABLED` ; sinon `OK`.
 */
export function sharingSpaceVerdict(
  space: SharingSpace | null,
): "OK" | "NOT_FOUND" | "TODO_DISABLED" {
  if (space === null || space.callerRole === null) return "NOT_FOUND";
  return space.modules.includes("TODO") ? "OK" : "TODO_DISABLED";
}
