import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

import { FeedFetchError, type FeedFetchErrorCode } from "./feed-errors";

/** Une requête vers une adresse IP déjà contrôlée ; l'hôte de l'URL ne sert qu'au certificat et à l'en-tête `Host`. */
export interface TransportRequest {
  url: URL;
  address: string;
  family: 4 | 6;
  timeoutMs: number;
  maxBytes: number;
}

export interface TransportResponse {
  status: number;
  location: string | null;
  contentType: string | null;
  body: string;
}

/** Envoie la requête (sans suivre de redirection) et lit la réponse, bornée en taille et en durée. */
export type Transport = (request: TransportRequest) => Promise<TransportResponse>;

function header(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

interface Options {
  /** `false` : HTTP en clair, pour les tests sur un serveur local. Jamais en production. */
  secure?: boolean;
}

/**
 * Transport Node. La connexion part vers `address` (celle qu'on a vérifiée) et non vers une résolution refaite par la
 * requête : une réponse DNS qui change entre le contrôle et l'envoi (« DNS rebinding ») ne peut rien. Le certificat
 * est vérifié pour l'hôte de l'URL.
 */
export function createNodeTransport({ secure = true }: Options = {}): Transport {
  const send = secure ? httpsRequest : httpRequest;
  return ({ url, address, family, timeoutMs, maxBytes }) =>
    new Promise<TransportResponse>((resolve, reject) => {
      const fail = (code: FeedFetchErrorCode) => {
        request.destroy();
        reject(new FeedFetchError(code));
      };
      const request = send(
        {
          hostname: url.hostname,
          port: url.port === "" ? undefined : Number(url.port),
          servername: url.hostname,
          path: `${url.pathname}${url.search}`,
          method: "GET",
          // Pas de pool partagé : une connexion par lecture, jamais réutilisée vers un autre lien.
          agent: false,
          headers: {
            accept: "text/calendar, text/plain;q=0.5",
            "accept-encoding": "identity",
            "user-agent": "Planifier",
          },
          lookup: (_host, options, callback) => {
            if (options.all === true) callback(null, [{ address, family }]);
            else callback(null, address, family);
          },
        },
        (response) => {
          const declared = Number(header(response.headers["content-length"]) ?? 0);
          if (declared > maxBytes) {
            fail("FEED_TOO_LARGE");
            return;
          }
          const chunks: Buffer[] = [];
          let size = 0;
          response.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > maxBytes) {
              fail("FEED_TOO_LARGE");
              return;
            }
            chunks.push(chunk);
          });
          response.on("end", () => {
            resolve({
              status: response.statusCode ?? 0,
              location: header(response.headers.location),
              contentType: header(response.headers["content-type"]),
              body: Buffer.concat(chunks).toString("utf8"),
            });
          });
          response.on("error", () => {
            reject(new FeedFetchError("FEED_UNREACHABLE"));
          });
        },
      );
      // Durée totale, pas seulement l'inactivité : un serveur qui goutte-à-goutte ne retient pas la lecture.
      const timer = setTimeout(() => {
        fail("FEED_UNREACHABLE");
      }, timeoutMs);
      request.on("close", () => {
        clearTimeout(timer);
      });
      request.on("error", () => {
        reject(new FeedFetchError("FEED_UNREACHABLE"));
      });
      request.end();
    });
}
