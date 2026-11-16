import { randomUUID } from "node:crypto";

import { call } from "@orpc/server";
import type { CreateEventInput } from "@planifier/api-contract";
import type { SessionUser } from "@planifier/auth";
import type { EventRole, ParticipantStatus } from "@planifier/constants/events";
import type { Db } from "@planifier/db";

import { router } from "../../router";
import { requestAs } from "../todo/todo.testing";

// Aide des tests d'intégration des événements : requêtes, données de départ et dates de référence.
export const { event } = router.events;

/** « Maintenant » et le jour civil de l'appareil, fixés pour les listes. */
export const NOW = new Date("2026-11-20T12:00:00Z");
export const TODAY = "2026-11-20";

export const EVENING = {
  allDay: false,
  startsAt: new Date("2026-11-22T19:30:00Z"),
  endsAt: new Date("2026-11-22T23:30:00Z"),
  openEnd: false,
} as const;

export const WEEKEND = { allDay: true, startDay: "2026-12-13", endDay: "2026-12-14" } as const;

export function asUser(db: Db, user: SessionUser) {
  return requestAs(db, user);
}

/** Événement créé par `owner` avec la procédure (il en est propriétaire et y va). */
export function makeEvent(db: Db, owner: SessionUser, fields: Partial<CreateEventInput> = {}) {
  return call(
    event.create,
    { title: "Anniversaire", tint: "couple", when: EVENING, ...fields },
    asUser(db, owner),
  );
}

export function addParticipant(
  db: Db,
  eventId: string,
  user: SessionUser,
  fields: { role: EventRole; status?: ParticipantStatus },
) {
  return db.eventParticipant.create({
    data: { eventId, userId: user.id, role: fields.role, status: fields.status ?? "GOING" },
  });
}

/** Invitation posée en base (l'envoi arrive avec l'API des invitations) ; lien valable un jour par défaut. */
export function addInvite(
  db: Db,
  eventId: string,
  inviter: SessionUser,
  fields: { email: string; response?: ParticipantStatus; expiresAt?: Date },
) {
  return db.invite.create({
    data: {
      eventId,
      inviterId: inviter.id,
      email: fields.email,
      tokenHash: randomUUID(),
      expiresAt: fields.expiresAt ?? new Date(Date.now() + 86_400_000),
      ...(fields.response === undefined ? {} : { response: fields.response }),
    },
  });
}
