import type { AddressInfo } from "node:net";
import { connect } from "node:net";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ApiClient } from "@planifier/api-contract";
import type { SessionUser } from "@planifier/auth";
import { CLIENT_IP_HEADER } from "@planifier/constants/http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApiServer } from "./server";

const ALICE: SessionUser = {
  id: "u-alice",
  name: "Alice",
  email: "alice@example.test",
  preferredTheme: "SYSTEM",
};
/** Cookie que la session factice reconnaît (la vraie session est testée dans server.integration.test.ts). */
const SESSION_COOKIE = "session-factice=alice";

const server = createApiServer({
  env: { NODE_ENV: "test" },
  authHandler: (_request, response) => {
    response.statusCode = 299;
    response.end();
    return Promise.resolve();
  },
  getSessionUser: (headers) => Promise.resolve(headers.cookie === SESSION_COOKIE ? ALICE : null),
});
/** En-tête que pose le proxy du web devant chaque requête. */
const PROXIED = { [CLIENT_IP_HEADER]: "192.0.2.1" };
let baseUrl = "";
let port = 0;

function clientWith(headers: Record<string, string>): ApiClient {
  return createORPCClient(
    new RPCLink({ url: `${baseUrl}/rpc`, headers: { ...PROXIED, ...headers } }),
  );
}

/** Envoie une requête HTTP brute (cible non normalisée par `fetch`) et rend la ligne de statut. */
function rawRequest(target: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = connect(port, "127.0.0.1", () => {
      socket.write(`GET ${target} HTTP/1.1\r\nHost: api\r\nConnection: close\r\n\r\n`);
    });
    let received = "";
    socket.on("data", (chunk: Buffer) => (received += chunk.toString()));
    socket.on("end", () => {
      resolve(received.split("\r\n")[0] ?? "");
    });
    socket.on("error", reject);
  });
}

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address: AddressInfo | string | null = server.address();
  if (address === null || typeof address === "string") throw new Error("adresse inattendue");
  port = address.port;
  baseUrl = `http://127.0.0.1:${String(port)}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("serveur d'API", () => {
  it("répond à system.health.get via un client typé par le contrat", async () => {
    await expect(clientWith({}).system.health.get({})).resolves.toEqual({ status: "ok" });
  });

  it("refuse une cible mal formée sans tomber", async () => {
    await expect(rawRequest("http://[")).resolves.toContain("400");
    const response = await fetch(`${baseUrl}/autre`);
    expect(response.status).toBe(404);
  });

  it("répond 404 hors du préfixe /rpc", async () => {
    const response = await fetch(`${baseUrl}/autre`);
    expect(response.status).toBe(404);
  });

  it("confie /api/auth/* à Better Auth", async () => {
    const response = await fetch(`${baseUrl}/api/auth/get-session`, { headers: PROXIED });
    expect(response.status).toBe(299);
    expect((await fetch(`${baseUrl}/api/authx`)).status).toBe(404);
  });

  it("lit la session depuis le cookie de la requête", async () => {
    await expect(clientWith({}).account.me.get({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(clientWith({ cookie: SESSION_COOKIE }).account.me.get({})).resolves.toEqual(ALICE);
  });

  it("refuse toute requête routée sans IP valide posée par le proxy", async () => {
    for (const path of ["/api/auth/get-session", "/rpc/system/health/get"]) {
      expect((await fetch(`${baseUrl}${path}`)).status).toBe(400);
      const invalid = { [CLIENT_IP_HEADER]: "pas-une-ip" };
      expect((await fetch(`${baseUrl}${path}`, { headers: invalid })).status).toBe(400);
    }
  });
});
