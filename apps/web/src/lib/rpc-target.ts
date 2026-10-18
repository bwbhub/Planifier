const DOT_SEGMENTS = new Set([".", ".."]);

/**
 * URL de l'API pour un chemin `/rpc/*` reçu par le proxy, ou `null` s'il sortirait du préfixe `/rpc/`.
 * Les segments arrivent décodés : `.` et `..` seraient normalisés par `URL` et remonteraient hors du préfixe.
 */
export function rpcTarget(path: readonly string[], search: string, apiOrigin: string): URL | null {
  if (path.length === 0 || path.some((segment) => DOT_SEGMENTS.has(segment))) return null;
  const target = new URL(`/rpc/${path.map(encodeURIComponent).join("/")}`, apiOrigin);
  if (!target.pathname.startsWith("/rpc/")) return null;
  target.search = search;
  return target;
}
