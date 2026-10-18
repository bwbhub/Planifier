import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { IncomingMessage, Server } from "node:http";

import { onError, ORPCError } from "@orpc/server";
import { BodyLimitPlugin, RPCHandler } from "@orpc/server/node";
import { router } from "@planifier/api";

import type { Env } from "./config/env";

const RPC_PREFIX = "/rpc";
const MAX_BODY_BYTES = 1024 * 1024;
/** Identifiant transmis par le proxy du web ; tout autre format est remplacé. */
const REQUEST_ID_PATTERN = /^[\w-]{1,64}$/;

function requestIdOf(request: IncomingMessage): string {
  const header = request.headers["x-request-id"];
  return typeof header === "string" && REQUEST_ID_PATTERN.test(header) ? header : randomUUID();
}

/** Journal d'une ligne JSON. Jamais d'entrée ni de requête complète : le chemin seul (règle 12). */
function log(entry: Record<string, string | number>) {
  console.log(JSON.stringify(entry));
}

/** Serveur HTTP de l'API : oRPC sous /rpc, 404 ailleurs. */
export function createApiServer(env: Pick<Env, "NODE_ENV">): Server {
  const handler = new RPCHandler(router, {
    plugins: [new BodyLimitPlugin({ maxBodySize: MAX_BODY_BYTES })],
    clientInterceptors: [
      onError((error) => {
        // Les erreurs attendues (BAD_REQUEST, NOT_FOUND…) ne sont pas des pannes.
        if (error instanceof ORPCError && error.status < 500) return;
        const name = error instanceof Error ? error.name : "UnknownError";
        log({
          level: "error",
          name,
          ...(env.NODE_ENV === "production" ? {} : { detail: String(error) }),
        });
      }),
    ],
  });

  return createServer((request, response) => {
    const requestId = requestIdOf(request);
    const startedAt = performance.now();
    response.on("finish", () => {
      log({
        level: "info",
        requestId,
        method: request.method ?? "",
        path: new URL(request.url ?? "/", "http://api").pathname,
        status: response.statusCode,
        durationMs: Math.round(performance.now() - startedAt),
      });
    });

    void handler
      .handle(request, response, { prefix: RPC_PREFIX, context: { requestId } })
      .then(({ matched }) => {
        if (matched) return;
        response.statusCode = 404;
        response.end();
      });
  });
}
