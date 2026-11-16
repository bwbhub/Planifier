import { ORPCError, os } from "@orpc/server";
import { canAccessEvent, type EventAction } from "@planifier/domain-access/event";

import type { UserContext } from "../../procedures";
import { type EventCaller, eventAccessSelect, toEventCaller } from "./event-access";

/**
 * Garde d'événement, après la validation d'entrée : place de l'appelant dans l'événement (participant, invité par
 * e-mail, membre de l'Espace), puis droit de l'action (`domain-access`). Sans droit de lecture ⇒ NOT_FOUND (l'événement
 * n'existe pas pour lui) ; visible mais action refusée ⇒ FORBIDDEN. Ajoute `eventCaller` au contexte.
 */
export function eventGuard(action: EventAction) {
  return os
    .$context<UserContext>()
    .middleware(async ({ context, next }, input: { eventId: string }) => {
      const { id: userId, email } = context.user;
      const event = await context.getDb().event.findUnique({
        where: { id: input.eventId },
        select: eventAccessSelect(userId, email),
      });
      if (event === null) throw new ORPCError("NOT_FOUND");
      const eventCaller: EventCaller = toEventCaller(event);
      if (!canAccessEvent(eventCaller.access, action)) {
        throw new ORPCError(canAccessEvent(eventCaller.access, "view") ? "FORBIDDEN" : "NOT_FOUND");
      }
      return next({ context: { eventCaller } });
    });
}
