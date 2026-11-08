import { createServer, type Server } from "node:http";

import { afterEach, describe, expect, it } from "vitest";

import { FeedFetchError } from "./feed-errors";
import { createNodeTransport } from "./feed-transport";

let server: Server | undefined;

afterEach(async () => {
  const closing = server;
  server = undefined;
  if (closing === undefined) return;
  closing.closeAllConnections();
  await new Promise((resolve) => closing.close(resolve));
});

/** Serveur local ; le transport s'y connecte par `address` alors que l'URL porte un autre nom d'hôte. */
async function serve(handler: Parameters<typeof createServer>[1]) {
  server = createServer(handler);
  await new Promise<void>((resolve) => server?.listen(0, "127.0.0.1", resolve));
  const bound = server.address();
  if (bound === null || typeof bound === "string") throw new Error("Port introuvable.");
  const { port } = bound;
  return {
    request: (overrides: { timeoutMs?: number; maxBytes?: number } = {}) => ({
      url: new URL(`http://feeds.test:${String(port)}/p?q=1`),
      address: "127.0.0.1",
      family: 4 as const,
      timeoutMs: overrides.timeoutMs ?? 2000,
      maxBytes: overrides.maxBytes ?? 1024,
    }),
  };
}

const transport = createNodeTransport({ secure: false });

describe("createNodeTransport", () => {
  it("se connecte à l'adresse donnée, quel que soit le nom d'hôte, et lit corps, type et statut", async () => {
    let seen = { host: "", url: "", agent: "" };
    const { request } = await serve((req, res) => {
      seen = {
        host: req.headers.host ?? "",
        url: req.url ?? "",
        agent: req.headers["user-agent"] ?? "",
      };
      res.writeHead(200, { "content-type": "text/calendar" }).end("BEGIN:VCALENDAR");
    });

    const response = await transport(request());

    expect(response).toMatchObject({
      status: 200,
      contentType: "text/calendar",
      body: "BEGIN:VCALENDAR",
    });
    expect(seen).toMatchObject({ url: "/p?q=1", agent: "Planifier" });
    expect(seen.host.startsWith("feeds.test")).toBe(true);
  });

  it("rend la cible d'une redirection sans la suivre", async () => {
    const { request } = await serve((_req, res) => {
      res.writeHead(302, { location: "https://elsewhere.test/x" }).end();
    });

    await expect(transport(request())).resolves.toMatchObject({
      status: 302,
      location: "https://elsewhere.test/x",
    });
  });

  it("refuse un corps trop grand, annoncé ou non", async () => {
    const { request } = await serve((req, res) => {
      if (req.url?.startsWith("/p")) res.writeHead(200).end("x".repeat(5000));
    });

    await expect(transport(request())).rejects.toMatchObject({ code: "FEED_TOO_LARGE" });
  });

  it("refuse un corps qui dépasse en cours de route (sans longueur annoncée)", async () => {
    const { request } = await serve((_req, res) => {
      res.writeHead(200, { "transfer-encoding": "chunked" });
      res.write("x".repeat(800));
      res.write("x".repeat(800));
      res.end();
    });

    await expect(transport(request())).rejects.toBeInstanceOf(FeedFetchError);
    await expect(transport(request())).rejects.toMatchObject({ code: "FEED_TOO_LARGE" });
  });

  it("coupe un serveur trop lent, même s'il envoie goutte à goutte", async () => {
    const { request } = await serve((_req, res) => {
      res.writeHead(200);
      const timer = setInterval(() => res.write("x"), 50);
      res.on("close", () => {
        clearInterval(timer);
      });
    });

    await expect(transport(request({ timeoutMs: 300 }))).rejects.toMatchObject({
      code: "FEED_UNREACHABLE",
    });
  });

  it("signale un serveur injoignable", async () => {
    const { request } = await serve((_req, res) => {
      res.end();
    });
    await new Promise((resolve) => server?.close(resolve));
    server = undefined;

    await expect(transport(request())).rejects.toMatchObject({ code: "FEED_UNREACHABLE" });
  });
});
