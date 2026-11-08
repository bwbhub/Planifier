/** Hôtes dont on accepte les liens d'agenda (Google, Outlook, iCloud). Tout autre hôte est refusé (liste blanche). */
export const FEED_HOSTS: readonly string[] = [
  "calendar.google.com",
  "outlook.office365.com",
  "outlook.live.com",
];

/** Hôtes à numéro d'iCloud (`p12-caldav.icloud.com`) : un motif strict plutôt que tout `*.icloud.com`. */
const FEED_HOST_PATTERNS: readonly RegExp[] = [/^p\d{1,3}-caldav\.icloud\.com$/];

const MAX_URL_LENGTH = 2048;

export type FeedUrlResult =
  { ok: true; url: URL } | { ok: false; reason: "INVALID" | "HOST_NOT_ALLOWED" };

/** L'hôte (en minuscules, sans point final) est-il dans la liste blanche, `extraHosts` compris ? */
export function isAllowedFeedHost(host: string, extraHosts: readonly string[] = []): boolean {
  return (
    FEED_HOSTS.includes(host) ||
    extraHosts.includes(host) ||
    FEED_HOST_PATTERNS.some((pattern) => pattern.test(host))
  );
}

/** `webcal://` et `webcals://` sont des liens d'abonnement : même adresse, en `https://`. */
function withHttps(text: string): string {
  return text.replace(/^webcals?:\/\//i, "https://");
}

/**
 * Lien privé d'agenda saisi par l'utilisateur ⇒ URL `https` d'un hôte autorisé. Refuse : texte trop long, autre schéma
 * que `https`/`webcal`, identifiants dans l'URL, port autre que 443, hôte hors liste blanche (adresses IP comprises).
 * Ne lit rien du réseau. `extraHosts` : hôtes ajoutés par l'appelant (environnement de test seulement).
 */
export function parseFeedUrl(input: string, extraHosts: readonly string[] = []): FeedUrlResult {
  const text = input.trim();
  if (text === "" || text.length > MAX_URL_LENGTH) return { ok: false, reason: "INVALID" };
  let url: URL;
  try {
    url = new URL(withHttps(text));
  } catch {
    return { ok: false, reason: "INVALID" };
  }
  const plain =
    url.protocol === "https:" && url.username === "" && url.password === "" && url.port === "";
  if (!plain) return { ok: false, reason: "INVALID" };
  const host = url.hostname.replace(/\.$/, "").toLowerCase();
  return isAllowedFeedHost(host, extraHosts)
    ? { ok: true, url }
    : { ok: false, reason: "HOST_NOT_ALLOWED" };
}
