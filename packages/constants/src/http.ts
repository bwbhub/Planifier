// Protocole entre le proxy du web et l'API (ADR 0015) : partagé pour que les deux côtés ne divergent pas.

/** Préfixe des routes de Better Auth, servies par l'API et relayées par le web sous la même origine. */
export const AUTH_BASE_PATH = "/api/auth";

/**
 * IP du client posée par le proxy du web, seule source d'IP crue par l'API (limitation de débit). Le proxy
 * l'écrit toujours lui-même : une valeur envoyée par le navigateur n'est jamais relayée.
 */
export const CLIENT_IP_HEADER = "x-planifier-client-ip";
