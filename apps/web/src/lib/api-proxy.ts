import "server-only";

import { getEnv } from "@/config/env";

import { type ApiPrefix, apiTarget } from "./api-target";
import { readLimitedBody } from "./limited-body";

/** En-têtes relayés vers l'API (liste blanche) : le reste de la requête du navigateur ne passe pas. */
const FORWARDED_REQUEST_HEADERS = ["accept", "content-type", "cookie"];
/** En-têtes recalculés par le runtime : `fetch` a déjà décompressé et lu le corps. */
const DROPPED_RESPONSE_HEADERS = [
  "connection",
  "content-encoding",
  "content-length",
  "transfer-encoding",
];
/** Même limite que l'API (`BodyLimitPlugin` de apps/api), appliquée avant de garder le corps en mémoire. */
const MAX_BODY_BYTES = 1024 * 1024;
/** Délai d'attente des en-têtes de l'API ; la lecture de la réponse n'est pas bornée (flux). */
const UPSTREAM_HEADERS_TIMEOUT_MS = 15_000;

function forwardedHeaders(request: Request): Headers {
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  headers.set("x-request-id", crypto.randomUUID());
  return headers;
}

async function fetchUpstream(target: URL, request: Request, body: Uint8Array<ArrayBuffer> | null) {
  const timeout = new AbortController();
  const timer = setTimeout(() => {
    timeout.abort();
  }, UPSTREAM_HEADERS_TIMEOUT_MS);
  try {
    return await fetch(target, {
      method: request.method,
      headers: forwardedHeaders(request),
      body,
      redirect: "manual",
      // Le départ du navigateur coupe aussi l'appel à l'API, y compris pendant la lecture de la réponse.
      signal: AbortSignal.any([request.signal, timeout.signal]),
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Relaie une requête du navigateur vers `prefix/*` de l'API (même origine pour le navigateur : cookies
 * first-party, pas de CORS). L'URL de l'API est lue à la requête, jamais au build (skill runtime-configuration).
 */
export async function proxyToApi(
  request: Request,
  prefix: ApiPrefix,
  path: readonly string[],
): Promise<Response> {
  const target = apiTarget(prefix, path, new URL(request.url).search, getEnv().API_INTERNAL_URL);
  if (target === null) return new Response(null, { status: 404 });

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await readLimitedBody(request.body, MAX_BODY_BYTES) : null;
  if (hasBody && body === null) return new Response(null, { status: 413 });

  try {
    const upstream = await fetchUpstream(target, request, body);
    const headers = new Headers(upstream.headers);
    for (const name of DROPPED_RESPONSE_HEADERS) headers.delete(name);
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    // API injoignable ou trop lente : le client oRPC reçoit une erreur réseau, sans détail interne.
    return new Response(null, { status: 502 });
  }
}
