import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";

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

const MAX_LOGGED_PATH_LENGTH = 200;

/** Chemin seul, sans la query (qui porte l'entrée RPC). Ne lève jamais, même sur une cible mal formée. */
function pathOf(request: IncomingMessage): string {
  const [path = ""] = (request.url ?? "").split("?");
  return path.slice(0, MAX_LOGGED_PATH_LENGTH);
}

function endWith(response: ServerResponse, status: number) {
  if (!response.headersSent) response.statusCode = status;
  response.end();
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
    // « close » et non « finish » : une requête abandonnée par le client est journalisée aussi.
    response.on("close", () => {
      log({
        level: "info",
        requestId,
        method: request.method ?? "",
        path: pathOf(request),
        status: response.writableFinished ? response.statusCode : "aborted",
        durationMs: Math.round(performance.now() - startedAt),
      });
    });

    // Cible de requête inanalysable (ex. « http://[ ») : refusée avant le routeur.
    if (!URL.canParse(request.url ?? "", "http://api")) {
      endWith(response, 400);
      return;
    }

    handler
      .handle(request, response, { prefix: RPC_PREFIX, context: { requestId } })
      .then(({ matched }) => {
        if (!matched) endWith(response, 404);
      })
      .catch((error: unknown) => {
        log({
          level: "error",
          requestId,
          name: error instanceof Error ? error.name : "UnknownError",
        });
        endWith(response, 500);
      });
  });
}
