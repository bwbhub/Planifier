import type { AddressInfo } from "node:net";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ApiClient } from "@planifier/api-contract";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApiServer } from "./server";

const server = createApiServer({ NODE_ENV: "test" });
let baseUrl = "";

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address: AddressInfo | string | null = server.address();
  if (address === null || typeof address === "string") throw new Error("adresse inattendue");
  baseUrl = `http://127.0.0.1:${String(address.port)}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("serveur d'API", () => {
  it("répond à system.health.get via un client typé par le contrat", async () => {
    const client: ApiClient = createORPCClient(new RPCLink({ url: `${baseUrl}/rpc` }));
    await expect(client.system.health.get({})).resolves.toEqual({ status: "ok" });
  });

  it("répond 404 hors du préfixe /rpc", async () => {
    const response = await fetch(`${baseUrl}/autre`);
    expect(response.status).toBe(404);
  });
});
