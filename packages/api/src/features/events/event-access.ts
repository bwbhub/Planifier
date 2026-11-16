import type { EventAccess } from "@planifier/domain-access/event";
import { canAccessEvent } from "@planifier/domain-access/event";
import type { Prisma } from "@planifier/db";

/**
 * Ce qu'il faut lire d'un événement pour décider des droits de `userId` (e-mail de sa session : `email`, en minuscules
 * comme en base) : propriétaire, réglages, sa participation, son invitation, son appartenance à l'Espace.
 */
export function eventAccessSelect(userId: string, email: string) {
  return {
    ownerId: true,
    allowGuestInvite: true,
    isGuestListVisible: true,
    participants: { where: { userId }, select: { role: true, status: true } },
    invites: { where: { email }, select: { id: true, response: true } },
    space: {
      select: {
        id: true,
        name: true,
        modules: true,
        restrictVisibility: true,
        members: { where: { userId }, select: { role: true } },
      },
    },
  } as const satisfies Prisma.EventSelect;
}

export type EventAccessRow = Prisma.EventGetPayload<{
  select: ReturnType<typeof eventAccessSelect>;
}>;

/** Droits de l'appelant et ce qu'on sait de sa place dans l'événement. */
export interface EventCaller {
  access: EventAccess;
  /** Réponse de l'appelant : celle du participant, ou de l'invitation (`PENDING` tant qu'il n'a pas répondu). */
  status: EventAccessRow["participants"][number]["status"] | null;
  /** Invitation en attente pour l'adresse de sa session, sans participation. */
  inviteId: string | null;
}

/** Un Espace montre ses événements à ses membres quand Événements y est activé et que sa visibilité n'est pas restreinte. */
function seesViaSpace({ space }: EventAccessRow): boolean {
  return (
    space !== null &&
    space.members.length > 0 &&
    space.modules.includes("EVENTS") &&
    !space.restrictVisibility
  );
}

export function toEventCaller(row: EventAccessRow): EventCaller {
  const participant = row.participants[0];
  const invite = participant === undefined ? row.invites[0] : undefined;
  return {
    access: {
      role: participant?.role ?? null,
      hasOwner: row.ownerId !== null,
      allowGuestInvite: row.allowGuestInvite,
      isGuestListVisible: row.isGuestListVisible,
      viaSpace: seesViaSpace(row),
      invitedByEmail: invite !== undefined,
    },
    status: participant?.status ?? invite?.response ?? null,
    inviteId: invite?.id ?? null,
  };
}

/** Droits de l'appelant tels que l'interface les lit (`can` du détail). */
export function abilitiesOf(access: EventAccess) {
  return {
    edit: canAccessEvent(access, "update"),
    invite: canAccessEvent(access, "invite"),
    propose: canAccessEvent(access, "propose_invite"),
    delete: canAccessEvent(access, "delete"),
    react: canAccessEvent(access, "react"),
    comment: canAccessEvent(access, "comment"),
    seeGuests: canAccessEvent(access, "see_guest_list"),
    changeSpace: canAccessEvent(access, "change_space"),
  };
}
