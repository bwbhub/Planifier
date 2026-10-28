import { ORPCError, os } from "@orpc/server";
import { canAccessSpace, type SpaceAction } from "@planifier/domain-access/space";

import type { UserContext } from "../../procedures";

/**
 * Garde d'Espace, après la validation d'entrée : rôle de l'appelant dans l'Espace visé, puis droit de l'action
 * (`domain-access`). Non membre ⇒ NOT_FOUND (l'Espace n'existe pas pour lui) ; membre sans le droit ⇒ FORBIDDEN.
 * Ajoute `spaceRole` au contexte.
 */
export function spaceGuard(action: SpaceAction) {
  return os
    .$context<UserContext>()
    .middleware(async ({ context, next }, input: { spaceId: string }) => {
      const membership = await context.getDb().spaceMember.findUnique({
        where: { spaceId_userId: { spaceId: input.spaceId, userId: context.user.id } },
        select: { role: true },
      });
      const role = membership?.role ?? null;
      if (role === null || !canAccessSpace(role, action)) {
        throw new ORPCError(canAccessSpace(role, "view") ? "FORBIDDEN" : "NOT_FOUND");
      }
      return next({ context: { spaceRole: role } });
    });
}
