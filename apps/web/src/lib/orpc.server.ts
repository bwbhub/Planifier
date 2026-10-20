import "server-only";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ApiClient } from "@planifier/api-contract";
import { CLIENT_IP_HEADER } from "@planifier/constants/http";
import { headers } from "next/headers";

import { getEnv } from "@/config/env";

import { lastHopIpOf } from "./last-hop-ip";

/**
 * Client de l'API pour le rendu serveur : appelle l'API sur le réseau interne au nom du navigateur de la requête
 * (son cookie de session, son IP comme le ferait le proxy). Rien d'autre de la requête n'est relayé.
 */
export async function createServerApiClient(): Promise<ApiClient> {
  const incoming = await headers();
  const forwarded: Record<string, string> = { "x-request-id": crypto.randomUUID() };
  const cookie = incoming.get("cookie");
  if (cookie !== null) forwarded.cookie = cookie;
  const clientIp = lastHopIpOf(incoming);
  if (clientIp !== null) forwarded[CLIENT_IP_HEADER] = clientIp;

  const link = new RPCLink({ url: new URL("/rpc", getEnv().API_INTERNAL_URL), headers: forwarded });
  return createORPCClient(link);
}
