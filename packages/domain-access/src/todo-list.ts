import type { SpaceRole } from "@planifier/constants/spaces";

import { canAccessResource, type ResourceAccess, type ResourceAction } from "./resource";

/** Ce que l'on sait d'une liste Todo et de l'appelant. */
export interface TodoListAccess {
  userId: string;
  ownerId: string;
  /** Liste partagée, rattachée à un Espace. */
  inSpace: boolean;
  /** Rôle de l'appelant dans l'Espace de la liste ; null s'il n'en est pas membre ou si la liste est perso. */
  spaceRole: SpaceRole | null;
}

/**
 * Une liste partagée s'ouvre en écriture à tous les membres de son Espace, même quand l'Espace restreint sa
 * visibilité : la rattacher à l'Espace, c'est la partager avec lui (décision du 2026-10-29). Liste perso : privée.
 */
export function todoListResource({
  userId,
  ownerId,
  inSpace,
  spaceRole,
}: TodoListAccess): ResourceAccess {
  return {
    userId,
    ownerId,
    spaceRole: inSpace ? spaceRole : null,
    spaceLevel: inSpace ? "WRITE" : "NONE",
    shareLevel: "NONE",
  };
}

/**
 * `read` faux ⇒ NOT_FOUND. `write` : nom, teinte, tâches. `delete` : propriétaire, ou propriétaire de l'Espace.
 * `share` : rattacher la liste à un Espace ou l'en retirer, propriétaire seulement.
 */
export function canAccessTodoList(access: TodoListAccess, action: ResourceAction): boolean {
  return canAccessResource(todoListResource(access), action);
}
