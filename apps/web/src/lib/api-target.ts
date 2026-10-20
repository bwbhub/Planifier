import { AUTH_BASE_PATH } from "@planifier/constants/http";

/** Préfixes de l'API relayés par le web : oRPC et Better Auth (ADR 0015). */
export const API_PREFIXES = { rpc: "/rpc", auth: AUTH_BASE_PATH } as const;
export type ApiPrefix = (typeof API_PREFIXES)[keyof typeof API_PREFIXES];

const DOT_SEGMENTS = new Set([".", ".."]);

/**
 * URL de l'API pour un chemin reçu par le proxy sous `prefix`, ou `null` s'il sortirait du préfixe.
 * Les segments arrivent décodés : `.` et `..` seraient normalisés par `URL` et remonteraient hors du préfixe.
 */
export function apiTarget(
  prefix: ApiPrefix,
  path: readonly string[],
  search: string,
  apiOrigin: string,
): URL | null {
  if (path.length === 0 || path.some((segment) => DOT_SEGMENTS.has(segment))) return null;
  const target = new URL(`${prefix}/${path.map(encodeURIComponent).join("/")}`, apiOrigin);
  if (!target.pathname.startsWith(`${prefix}/`)) return null;
  target.search = search;
  return target;
}
