// Rôles d'un événement (ADR 0009 : toujours présents, au moins pour le propriétaire).
export const EVENT_ROLES = ["OWNER", "ORGANIZER", "GUEST"] as const;
export type EventRole = (typeof EVENT_ROLES)[number];

// Réponse d'un participant. Seules GOING et MAYBE placent l'événement dans l'agenda.
export const PARTICIPANT_STATUSES = ["GOING", "MAYBE", "NOT_GOING", "PENDING"] as const;
export type ParticipantStatus = (typeof PARTICIPANT_STATUSES)[number];

export const AGENDA_VISIBLE_STATUSES = [
  "GOING",
  "MAYBE",
] as const satisfies readonly ParticipantStatus[];

export const INVITE_STATUSES = ["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"] as const;
export type InviteStatus = (typeof INVITE_STATUSES)[number];

// Proposition d'un invité, validée par un organisateur.
export const PROPOSAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];
