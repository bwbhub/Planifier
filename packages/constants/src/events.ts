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

/** Réponses que l'on peut choisir ; `PENDING` veut dire « pas encore répondu ». */
export const RESPONSE_STATUSES = [
  "GOING",
  "MAYBE",
  "NOT_GOING",
] as const satisfies readonly ParticipantStatus[];
export type ResponseStatus = (typeof RESPONSE_STATUSES)[number];

// Proposition d'un invité, validée par un organisateur.
export const PROPOSAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

// Un commentaire écrit par une personne (`TEXT`) ou le message automatique d'un champ important modifié (`CHANGE`).
export const COMMENT_KINDS = ["TEXT", "CHANGE"] as const;
export type CommentKind = (typeof COMMENT_KINDS)[number];

export const EVENT_TITLE_MAX_LENGTH = 120;
export const EVENT_LOCATION_MAX_LENGTH = 200;
export const EVENT_DESCRIPTION_MAX_LENGTH = 5000;
export const EVENT_COMMENT_MAX_LENGTH = 2000;
export const EVENT_PROPOSAL_MESSAGE_MAX_LENGTH = 280;

/** Participants et invitations en attente au plus, pour un événement. */
export const EVENT_MAX_GUESTS = 200;
/** Places au plus que l'on peut fixer (même plafond que les invités). */
export const EVENT_MAX_PARTICIPANTS = EVENT_MAX_GUESTS;

/** Durée de validité d'un lien d'invitation, en heures ; un renvoi en crée un nouveau. */
export const EVENT_INVITE_LINK_HOURS = 48;
/** Envois et renvois d'invitations par organisateur et par jour (24 h glissantes). */
export const EVENT_INVITES_PER_DAY = 50;
