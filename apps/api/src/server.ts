import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { IncomingHttpHeaders, IncomingMessage, Server, ServerResponse } from "node:http";
import { isIP } from "node:net";

import { onError, ORPCError } from "@orpc/server";
import { BodyLimitPlugin, RPCHandler } from "@orpc/server/node";
import type { ApiContext } from "@planifier/api";
import { createRateLimiter, PLAN_RATE_LIMIT, router } from "@planifier/api";
import type { SessionUser } from "@planifier/auth";
import { AUTH_BASE_PATH, CLIENT_IP_HEADER, REQUEST_ID_HEADER } from "@planifier/constants/http";

import type { Env } from "./config/env";

const RPC_PREFIX = "/rpc";
const MAX_BODY_BYTES = 1024 * 1024;
/** Identifiant transmis par le proxy du web ; tout autre format est remplacé. */
const REQUEST_ID_PATTERN = /^[\w-]{1,64}$/;

function requestIdOf(request: IncomingMessage): string {
  const header = request.headers[REQUEST_ID_HEADER];
  return typeof header === "string" && REQUEST_ID_PATTERN.test(header) ? header : randomUUID();
}

/** IP posée par le proxy du web (`CLIENT_IP_HEADER`) ; toute valeur qui n'est pas une IP unique est ignorée. */
function proxiedClientIpOf(request: IncomingMessage): string | null {
  const header = request.headers[CLIENT_IP_HEADER];
  return typeof header === "string" && isIP(header) !== 0 ? header : null;
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

/** Dépendances du serveur, injectées pour tester sans base (`main.ts` passe celles de `@planifier/auth`). */
export interface ApiServerDeps {
  env: Pick<Env, "NODE_ENV">;
  /** Routes de Better Auth, servies sous `AUTH_BASE_PATH`. */
  authHandler: (request: IncomingMessage, response: ServerResponse) => Promise<void>;
  getSessionUser: (headers: IncomingHttpHeaders) => Promise<SessionUser | null>;
}

type Route = "auth" | "rpc" | null;

function routeOf(path: string): Route {
  if (path.startsWith(`${AUTH_BASE_PATH}/`)) return "auth";
  if (path.startsWith(`${RPC_PREFIX}/`)) return "rpc";
  return null;
}

/**
 * Serveur HTTP de l'API : Better Auth sous /api/auth, oRPC sous /rpc, 404 ailleurs. Toute requête routée doit porter
 * l'IP posée par le proxy du web (400 sinon) : la limitation de débit n'a jamais de compteur commun.
 */
export function createApiServer({ env, authHandler, getSessionUser }: ApiServerDeps): Server {
  // Un limiteur par serveur : aucun état partagé entre deux instances (tests compris).
  const consumeRateLimit = createRateLimiter(PLAN_RATE_LIMIT);
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

    const failWith500 = (error: unknown) => {
      log({
        level: "error",
        requestId,
        name: error instanceof Error ? error.name : "UnknownError",
      });
      endWith(response, 500);
    };

    const route = routeOf(pathOf(request));
    if (route === null) {
      endWith(response, 404);
      return;
    }
    const clientIp = proxiedClientIpOf(request);
    if (clientIp === null) {
      endWith(response, 400);
      return;
    }

    if (route === "auth") {
      authHandler(request, response).catch(failWith500);
      return;
    }

    const context: ApiContext = {
      requestId,
      clientIp,
      consumeRateLimit,
      getSessionUser: () => getSessionUser(request.headers),
    };
    handler
      .handle(request, response, { prefix: RPC_PREFIX, context })
      .then(({ matched }) => {
        if (!matched) endWith(response, 404);
      })
      .catch(failWith500);
  });
}
