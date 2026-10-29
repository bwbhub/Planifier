import type { AppModule, SpaceRole } from "@planifier/constants/spaces";

import { canAccessResource, type ResourceAccess, type ResourceAction } from "./resource";

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
 * Une liste partagée s'ouvre en écriture à tous les membres de son Espace, même quand l'Espace restreint sa
 * visibilité : la rattacher à l'Espace, c'est la partager avec lui (décision du 2026-10-29). Liste perso : privée.
 */
function asResource({ userId, ownerId, space }: TodoListAccess): ResourceAccess {
  return {
    userId,
    ownerId,
    spaceRole: space?.callerRole ?? null,
    spaceLevel: space === null ? "NONE" : "WRITE",
    shareLevel: "NONE",
  };
}

/**
 * `read` faux ⇒ NOT_FOUND. `write` : nom, teinte, tâches. `delete` : propriétaire, ou propriétaire de l'Espace.
 * `share` : rattacher la liste à un Espace ou l'en retirer, propriétaire seulement.
 */
export function canAccessTodoList(access: TodoListAccess, action: ResourceAction): boolean {
  return canAccessResource(asResource(access), action);
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
