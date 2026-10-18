import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { ApiClient } from "@planifier/api-contract";

/**
 * Client navigateur : passe par le proxy même origine `/rpc` (route handler), jamais directement par l'API.
 * L'URL est calculée à l'appel (`window` n'existe pas pendant le rendu serveur).
 */
const link = new RPCLink({ url: () => new URL("/rpc", window.location.origin) });

const client: ApiClient = createORPCClient(link);

/** Utilitaires TanStack Query typés par le contrat. À utiliser uniquement dans les `queries/` des modules. */
export const orpc = createTanstackQueryUtils(client);
