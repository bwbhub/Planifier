import { ORPCError, os } from "@orpc/server";

import type { UserContext } from "../../../procedures";

/**
 * Garde d'agenda importé, après la validation d'entrée : il appartient à l'appelant, sinon NOT_FOUND. Un agenda importé
 * n'est ni partagé ni visible d'un autre : pas de FORBIDDEN, il n'existe pas pour les autres.
 */
export const importGuard = os
  .$context<UserContext>()
  .middleware(async ({ context, next }, input: { subscriptionId: string }) => {
    const found = await context.getDb().calendarSubscription.count({
      where: { id: input.subscriptionId, ownerId: context.user.id },
    });
    if (found === 0) throw new ORPCError("NOT_FOUND");
    return next();
  });
