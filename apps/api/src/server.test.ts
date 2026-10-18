import type { AddressInfo } from "node:net";
import { connect } from "node:net";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ApiClient } from "@planifier/api-contract";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApiServer } from "./server";

const server = createApiServer({ NODE_ENV: "test" });
let baseUrl = "";
let port = 0;

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
    const client: ApiClient = createORPCClient(new RPCLink({ url: `${baseUrl}/rpc` }));
    await expect(client.system.health.get({})).resolves.toEqual({ status: "ok" });
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
});
