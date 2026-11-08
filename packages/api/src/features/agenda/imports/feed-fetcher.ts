import { lookup } from "node:dns/promises";

import { FeedFetchError } from "./feed-errors";
import { parseFeedUrl } from "./feed-url";
import { isPublicAddress } from "./ip-policy";
import type { Transport } from "./feed-transport";

/** Redirections suivies au plus ; chacune est contrôlée comme le lien d'origine. */
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 5 * 1024 * 1024;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const FEED_CONTENT_TYPES = [
  "text/calendar",
  "text/plain",
  "application/octet-stream",
  "application/ics",
];

export interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

export type Resolve = (host: string) => Promise<ResolvedAddress[]>;

export interface FeedFetcherDeps {
  transport: Transport;
  resolve?: Resolve;
  /** Hôtes admis en plus de la liste blanche : environnement de test seulement. */
  extraHosts?: readonly string[];
  timeoutMs?: number;
  maxBytes?: number;
}

/** Résolution DNS du système : toutes les adresses de l'hôte. */
export const resolveHost: Resolve = async (host) => {
  const found = await lookup(host, { all: true, verbatim: true });
  return found.flatMap(({ address, family }) =>
    family === 4 || family === 6 ? [{ address, family }] : [],
  );
};

function isFeedContentType(contentType: string | null): boolean {
  const type = (contentType ?? "text/calendar").split(";")[0]?.trim().toLowerCase() ?? "";
  return FEED_CONTENT_TYPES.includes(type);
}

/** Échoue en `FEED_UNREACHABLE` si `promise` dépasse `ms`. */
async function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new FeedFetchError("FEED_UNREACHABLE"));
    }, ms);
  });
  try {
    return await Promise.race([promise, expired]);
  } finally {
    clearTimeout(timer);
  }
}

/** Cible d'une redirection (relative ou absolue) ; refuse une valeur illisible. */
function nextLink(location: string, from: URL): string {
  try {
    return new URL(location, from).toString();
  } catch {
    throw new FeedFetchError("LINK_INVALID");
  }
}

/**
 * Lecteur de flux iCal à partir d'un lien privé saisi par l'utilisateur. Pour chaque lien, puis pour chaque
 * redirection : schéma et hôte contrôlés (`parseFeedUrl`), toutes les adresses de l'hôte doivent être publiques
 * (`isPublicAddress`), la connexion part vers l'adresse contrôlée. Durée et taille bornées. Les erreurs sont typées
 * (`FeedFetchError`) et ne contiennent jamais le lien.
 */
export function createFeedFetcher({
  transport,
  resolve = resolveHost,
  extraHosts = [],
  timeoutMs = TIMEOUT_MS,
  maxBytes = MAX_BYTES,
}: FeedFetcherDeps): (link: string) => Promise<string> {
  async function addressOf(url: URL): Promise<ResolvedAddress> {
    const found = await resolve(url.hostname).catch(() => {
      throw new FeedFetchError("FEED_UNREACHABLE");
    });
    const [first] = found;
    if (first === undefined) throw new FeedFetchError("FEED_UNREACHABLE");
    // Une seule adresse non publique suffit à refuser : un hôte ne mélange pas public et interne.
    if (!found.every(({ address }) => isPublicAddress(address))) {
      throw new FeedFetchError("LINK_INVALID");
    }
    return first;
  }

  async function read(link: string, redirects: number): Promise<string> {
    const parsed = parseFeedUrl(link, extraHosts);
    if (!parsed.ok) throw new FeedFetchError("LINK_INVALID");
    const { address, family } = await addressOf(parsed.url);
    const response = await transport({ url: parsed.url, address, family, timeoutMs, maxBytes });
    if (REDIRECT_STATUSES.has(response.status) && response.location !== null) {
      if (redirects >= MAX_REDIRECTS) throw new FeedFetchError("FEED_UNREACHABLE");
      return read(nextLink(response.location, parsed.url), redirects + 1);
    }
    if (response.status !== 200 || !isFeedContentType(response.contentType)) {
      throw new FeedFetchError("FEED_UNREACHABLE");
    }
    return response.body;
  }

  // Plafond global (résolution DNS et redirections comprises) : chaque étape a le sien, mais pas leur somme.
  return (link) => withDeadline(read(link, 0), timeoutMs * 2);
}
