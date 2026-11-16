import { ORPCError } from "@orpc/server";
import type {
  ParticipantsOutput,
  RemoveParticipantInput,
  SetRoleInput,
} from "@planifier/api-contract";
import { EVENT_MAX_GUESTS, type ParticipantStatus } from "@planifier/constants/events";
import type { Db } from "@planifier/db";
import { canAccessEvent, canRemoveParticipant, canSetRole } from "@planifier/domain-access/event";

import { toPerson } from "../../_shared/list-access";
import type { EventCaller } from "../event-access";

function emptyCounts(): Record<ParticipantStatus, number> {
  return { GOING: 0, MAYBE: 0, NOT_GOING: 0, PENDING: 0 };
}

/**
 * Participants et invitations d'un événement, comme l'appelant a le droit de les voir : les comptes par réponse pour
 * tous, les personnes si la liste des invités lui est ouverte, les adresses des invitations aux organisateurs seulement.
 */
export async function listParticipants(
  db: Db,
  { access }: EventCaller,
  eventId: string,
): Promise<ParticipantsOutput> {
  const event = await db.event.findUniqueOrThrow({
    where: { id: eventId },
    select: {
      participants: {
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        take: EVENT_MAX_GUESTS,
        select: { role: true, status: true, user: { select: { id: true, name: true } } },
      },
      invites: {
        orderBy: { createdAt: "asc" },
        take: EVENT_MAX_GUESTS,
        select: { id: true, email: true, response: true, sentAt: true, expiresAt: true },
      },
    },
  });
  const counts = emptyCounts();
  for (const { status } of event.participants) counts[status] += 1;
  for (const { response } of event.invites) counts[response] += 1;
  const now = new Date();
  return {
    counts,
    participants: canAccessEvent(access, "see_guest_list")
      ? event.participants.map(({ role, status, user }) => ({ ...toPerson(user), role, status }))
      : [],
    invitations: canAccessEvent(access, "see_invite_emails")
      ? event.invites.map(({ id, email, response, sentAt, expiresAt }) => ({
          id,
          email,
          response,
          sentAt,
          linkExpired: expiresAt <= now,
        }))
      : [],
  };
}

/** Participant visé par une action sur une personne : il participe, sinon il n'existe pas pour l'action. */
async function findTarget(db: Db, eventId: string, userId: string) {
  const target = await db.eventParticipant.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { id: true, role: true },
  });
  if (target === null) throw new ORPCError("NOT_FOUND");
  return target;
}

/** Propriétaire seulement (garde) : nomme ou retire un co-organisateur. Jamais le propriétaire ni soi-même. */
export async function setRole(
  db: Db,
  callerId: string,
  { eventId, userId, role }: SetRoleInput,
): Promise<void> {
  const target = await findTarget(db, eventId, userId);
  if (!canSetRole({ targetRole: target.role, isSelf: userId === callerId })) {
    throw new ORPCError("FORBIDDEN");
  }
  await db.eventParticipant.update({ where: { id: target.id }, data: { role } });
}

/**
 * Retire un participant (sa place se libère). Le propriétaire retire un co-organisateur ou un invité, un co-organisateur
 * un invité ; jamais le propriétaire ni soi-même.
 */
export async function removeParticipant(
  db: Db,
  { callerId, access }: { callerId: string; access: EventCaller["access"] },
  { eventId, userId }: RemoveParticipantInput,
): Promise<void> {
  const target = await findTarget(db, eventId, userId);
  const allowed = canRemoveParticipant({
    callerRole: access.role,
    targetRole: target.role,
    isSelf: userId === callerId,
  });
  if (!allowed) throw new ORPCError("FORBIDDEN");
  await db.eventParticipant.delete({ where: { id: target.id } });
}
