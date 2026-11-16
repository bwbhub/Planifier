import type { RespondInput, RespondOutput } from "@planifier/api-contract";
import { ORPCError } from "@orpc/server";
import type { Db } from "@planifier/db";
import { hasRoomFor } from "@planifier/domain-events/capacity";

import { eventConflict } from "../event-errors";
import { lockEvent } from "../event-lock";
import { goingOf } from "./event-detail";
import type { Caller } from "./event.service";

/**
 * Réponse de l'appelant. Sous le verrou de l'événement : deux réponses simultanées ne dépassent pas les places. Un
 * invité par e-mail devient participant à sa réponse, et son invitation disparaît (la place qu'il tenait par son lien
 * passe à son compte). Qui y allait déjà garde sa place, même si l'événement est complet.
 */
export async function respondToEvent(
  db: Db,
  { userId, email }: Caller,
  { eventId, status }: RespondInput,
): Promise<RespondOutput> {
  return db.$transaction(async (tx) => {
    await lockEvent(tx, eventId);
    const event = await tx.event.findUniqueOrThrow({
      where: { id: eventId },
      select: {
        maxParticipants: true,
        participants: { where: { userId }, select: { id: true, role: true, status: true } },
        invites: { where: { email }, select: { id: true, role: true, response: true } },
        _count: {
          select: {
            participants: { where: { status: "GOING" } },
            invites: { where: { response: "GOING" } },
          },
        },
      },
    });
    const participant = event.participants[0];
    const invite = participant === undefined ? event.invites[0] : undefined;
    const wasGoing = (participant?.status ?? invite?.response) === "GOING";
    if (
      status === "GOING" &&
      !hasRoomFor({ max: event.maxParticipants, going: goingOf(event), wasGoing })
    ) {
      throw eventConflict("EVENT_FULL");
    }
    if (participant !== undefined) {
      await tx.eventParticipant.update({ where: { id: participant.id }, data: { status } });
      return { myRole: participant.role, myStatus: status };
    }
    // Ni participant ni invité : les droits ont changé entre la garde et la réponse.
    if (invite === undefined) throw new ORPCError("NOT_FOUND");
    await tx.eventParticipant.create({ data: { eventId, userId, role: invite.role, status } });
    await tx.invite.delete({ where: { id: invite.id } });
    return { myRole: invite.role, myStatus: status };
  });
}
