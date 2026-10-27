// Un Espace réunit des personnes (couple, colocation, vacances) : une seule notion (ADR 0009).
// Les membres sont égaux par défaut ; OWNER est le propriétaire (deux à deux membres, voir CONTEXT.md).
export const SPACE_ROLES = ["OWNER", "MEMBER"] as const;
export type SpaceRole = (typeof SPACE_ROLES)[number];

// Partage d'une ressource (liste, agenda, événement) avec une personne ou un Espace.
export const SHARE_LEVELS = ["NONE", "READ", "WRITE"] as const;
export type ShareLevel = (typeof SHARE_LEVELS)[number];

// Modules activables à la carte, par utilisateur et par Espace.
export const MODULES = ["TODO", "AGENDA", "EVENTS"] as const;
export type AppModule = (typeof MODULES)[number];

/** Nom d'un Espace : non vide une fois nettoyé, 60 caractères au plus. */
export const SPACE_NAME_MAX_LENGTH = 60;

/** Membres d'un Espace au plus : borne la liste rendue par l'API et le coût d'un Espace. */
export const SPACE_MAX_MEMBERS = 50;

/** Durée de validité d'un lien d'invitation à un Espace (usage unique). */
export const SPACE_INVITE_TTL_DAYS = 7;

/** Liens d'invitation en cours au plus, par Espace. */
export const SPACE_MAX_ACTIVE_INVITES = 20;
