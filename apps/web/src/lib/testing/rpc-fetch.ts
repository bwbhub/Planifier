import type { ORPCError } from "@orpc/client";
import { StandardRPCJsonSerializer, StandardRPCSerializer } from "@orpc/client/standard";
import type { vi } from "vitest";

// Aide de test : simule la seule frontière réseau du web, le proxy `/rpc`, au format du client oRPC (dates comprises).
const serializer = new StandardRPCSerializer(new StandardRPCJsonSerializer());

type RpcReply = { data: unknown } | { error: ORPCError<string, unknown> };

/** Réponse d'une procédure, ou refus avec son code HTTP. */
function toResponse(reply: RpcReply): Response {
  if ("error" in reply) {
    return Response.json(serializer.serialize(reply.error.toJSON()), {
      status: reply.error.status,
    });
  }
  return Response.json(serializer.serialize(reply.data));
}

export interface RpcCall {
  /** Chemin de la procédure, par exemple `spaces/space/create`. */
  path: string;
  input: unknown;
}

type FetchMock = ReturnType<typeof vi.fn<typeof fetch>>;

/**
 * Programme le `fetch` simulé : chaque appel à `/rpc/<chemin>` reçoit la réponse prévue pour ce chemin. Rend la
 * liste des appels faits, entrées désérialisées. Le client oRPC lit `fetch` à son chargement : le test le remplace
 * avant tout import (`vi.hoisted(() => { const fetchMock = vi.fn<typeof fetch>(); vi.stubGlobal("fetch", fetchMock); … })`).
 */
export function replyRpc(fetchMock: FetchMock, replies: Record<string, RpcReply>): RpcCall[] {
  const calls: RpcCall[] = [];
  fetchMock.mockImplementation(async (resource) => {
    if (!(resource instanceof Request))
      throw new Error("Appel réseau inattendu hors du client oRPC.");
    const path = new URL(resource.url).pathname.replace(/^\/rpc\//, "");
    const body: unknown = await resource.json().catch(() => undefined);
    calls.push({ path, input: serializer.deserialize(body) });
    const reply = replies[path];
    if (reply === undefined) throw new Error(`Procédure non prévue par le test : ${path}`);
    return toResponse(reply);
  });
  return calls;
}
