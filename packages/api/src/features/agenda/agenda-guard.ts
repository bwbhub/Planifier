import { ORPCError, os } from "@orpc/server";
import { canAccessAgendaEntry } from "@planifier/domain-access/agenda";
import type { ResourceAction } from "@planifier/domain-access/resource";
import type { Db } from "@planifier/db";

import type { UserContext } from "../../procedures";

/** Un Espace réunit les deux personnes et sa vue fusionnée montre tout le monde (`spaceAgendaScope` : `MEMBERS`). */
async function sharesAgendaSpace(db: Db, userId: string, ownerId: string): Promise<boolean> {
  const shared = await db.space.count({
    where: {
      modules: { has: "AGENDA" },
      restrictVisibility: false,
      AND: [{ members: { some: { userId } } }, { members: { some: { userId: ownerId } } }],
    },
  });
  return shared > 0;
}

/**
 * Garde d'entrée, après la validation d'entrée : droit `action` de l'appelant sur l'entrée `entryId`. Sans lecture ⇒
 * NOT_FOUND ; visible par un Espace mais action refusée ⇒ FORBIDDEN.
 */
export function entryGuard(action: ResourceAction) {
  return os
    .$context<UserContext>()
    .middleware(async ({ context, next }, input: { entryId: string }) => {
      const userId = context.user.id;
      const db = context.getDb();
      const entry = await db.agendaEntry.findUnique({
        where: { id: input.entryId },
        select: { ownerId: true, hidden: true },
      });
      if (entry === null) throw new ORPCError("NOT_FOUND");
      const access = {
        ...entry,
        userId,
        sharesAgendaSpace:
          entry.ownerId !== userId && (await sharesAgendaSpace(db, userId, entry.ownerId)),
      };
      if (canAccessAgendaEntry(access, action)) return next();
      throw new ORPCError(canAccessAgendaEntry(access, "read") ? "FORBIDDEN" : "NOT_FOUND");
    });
}
