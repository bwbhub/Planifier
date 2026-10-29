import { ORPCError, os } from "@orpc/server";
import { canAccessResource, type ResourceAction } from "@planifier/domain-access/resource";

import type { UserContext } from "../../procedures";

/**
 * Droit de l'appelant sur une liste dont `ownerId` est le propriétaire (null : liste introuvable). Listes perso
 * seulement pour l'instant : ni Espace ni partage. Sans lecture ⇒ NOT_FOUND ; visible mais action refusée ⇒ FORBIDDEN.
 */
function assertListAccess(userId: string, ownerId: string | null, action: ResourceAction) {
  if (ownerId === null) throw new ORPCError("NOT_FOUND");
  const access = {
    userId,
    ownerId,
    spaceRole: null,
    spaceLevel: "NONE",
    shareLevel: "NONE",
  } as const;
  if (canAccessResource(access, action)) return;
  throw new ORPCError(canAccessResource(access, "read") ? "FORBIDDEN" : "NOT_FOUND");
}

/** Garde de liste, après la validation d'entrée : droit `action` de l'appelant sur la liste `listId`. */
export function listGuard(action: ResourceAction) {
  return os
    .$context<UserContext>()
    .middleware(async ({ context, next }, input: { listId: string }) => {
      const list = await context.getDb().todoList.findUnique({
        where: { id: input.listId },
        select: { ownerId: true },
      });
      assertListAccess(context.user.id, list?.ownerId ?? null, action);
      return next();
    });
}

/** Garde de tâche, après la validation d'entrée : droit `action` de l'appelant sur la liste de la tâche `taskId`. */
export function taskGuard(action: ResourceAction) {
  return os
    .$context<UserContext>()
    .middleware(async ({ context, next }, input: { taskId: string }) => {
      const task = await context.getDb().task.findUnique({
        where: { id: input.taskId },
        select: { list: { select: { ownerId: true } } },
      });
      assertListAccess(context.user.id, task?.list.ownerId ?? null, action);
      return next();
    });
}
