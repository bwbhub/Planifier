/** `fetch` injectable : les tests fournissent un faux, le reste du code passe le `fetch` global. */
export type Fetch = typeof fetch;

/** Délai au-delà duquel l'envoi est abandonné (le fournisseur ne répond pas). */
const TIMEOUT_MS = 10_000;

/**
 * POST JSON vers un fournisseur d'e-mail. Seul le statut d'un refus remonte : le corps de la réponse peut citer
 * l'adresse du destinataire, il n'est ni lu ni journalisé.
 */
export async function postJson(
  fetchFn: Fetch,
  url: string,
  body: object,
  headers: Record<string, string> = {},
): Promise<void> {
  const response = await fetchFn(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  await response.body?.cancel();
  if (!response.ok)
    throw new Error(`e-mail refusé par le fournisseur (HTTP ${String(response.status)})`);
}
