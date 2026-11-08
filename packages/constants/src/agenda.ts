/** Vues de l'écran Agenda. */
export const AGENDA_VIEWS = ["DAY", "WEEK", "MONTH"] as const;
export type AgendaView = (typeof AGENDA_VIEWS)[number];

/** Titre et lieu d'une entrée, 200 caractères au plus ; description, 2 000. */
export const AGENDA_TITLE_MAX_LENGTH = 200;
export const AGENDA_LOCATION_MAX_LENGTH = 200;
export const AGENDA_DESCRIPTION_MAX_LENGTH = 2000;

/** Participants en texte libre : de quoi noter une tablée, pas un annuaire (noms de tiers, données minimales). */
export const AGENDA_MAX_PARTICIPANTS = 20;
export const AGENDA_PARTICIPANT_MAX_LENGTH = 100;

/** Grille horaire par défaut (maquette) : elle s'élargit aux créneaux qui en sortent. */
export const AGENDA_GRID_FIRST_HOUR = 8;
export const AGENDA_GRID_LAST_HOUR = 22;

/** Entrées par utilisateur au plus : borne le coût d'un agenda, et d'un import à venir. */
export const AGENDA_MAX_ENTRIES = 5000;

/** Durée d'une entrée au plus, en jours. */
export const AGENDA_MAX_ENTRY_DAYS = 366;

/** Fenêtre lue en une fois au plus, en jours : un mois affiché tient en six semaines. */
export const AGENDA_MAX_WINDOW_DAYS = 62;

/** Agendas externes importés par lien privé, par utilisateur au plus. */
export const AGENDA_MAX_IMPORTS = 5;

/** Délai minimal entre deux lectures d'un même agenda importé, en secondes (le lien appartient à un tiers). */
export const AGENDA_IMPORT_COOLDOWN_SECONDS = 60;

/** Séries d'un agenda importé développées de 30 jours avant aujourd'hui à 365 jours après. */
export const AGENDA_IMPORT_PAST_DAYS = 30;
export const AGENDA_IMPORT_FUTURE_DAYS = 365;

/** `source` des entrées importées : `ical:<id de l'abonnement>`. */
export const AGENDA_IMPORT_SOURCE_PREFIX = "ical:";
