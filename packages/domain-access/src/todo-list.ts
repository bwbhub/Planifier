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
}

/**
 * Liste perso : privée, tout à son propriétaire. Liste partagée : la rattacher à l'Espace, c'est la partager avec
 * lui, même quand il restreint sa visibilité ; elle appartient alors à l'Espace (décisions du 2026-10-29) :
 * - `read`, `write` (nom, teinte, tâches) : tout membre ;
 * - `delete` : son créateur, ou un propriétaire de l'Espace ;
 * - `share` (changer d'Espace, la rendre perso) : son créateur.
 * Seuls les membres comptent : le créateur parti ne la voit plus, elle reste à l'Espace. `read` faux ⇒ NOT_FOUND.
 */
export function canAccessTodoList(
  { userId, ownerId, space }: TodoListAccess,
  action: ResourceAction,
): boolean {
  const isOwner = userId === ownerId;
  if (space === null) return isOwner;
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
