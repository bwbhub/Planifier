import { describe, expect, it, vi } from "vitest";

import { FeedFetchError } from "./feed-errors";
import { createFeedFetcher, type Resolve } from "./feed-fetcher";
import type { Transport, TransportResponse } from "./feed-transport";

const GOOGLE = "https://calendar.google.com/calendar/ical/x/private-secret123/basic.ics";
const ICS = "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n";
const PUBLIC: Resolve = () => Promise.resolve([{ address: "142.250.74.14", family: 4 }]);

const ok = (
  body = ICS,
  contentType: string | null = "text/calendar; charset=utf-8",
): TransportResponse => ({
  status: 200,
  location: null,
  contentType,
  body,
});
const redirect = (location: string): TransportResponse => ({
  status: 302,
  location,
  contentType: null,
  body: "",
});

function fetcher(responses: TransportResponse[], resolve: Resolve = PUBLIC) {
  const queue = [...responses];
  const transport = vi.fn<Transport>(() => {
    const next = queue.shift();
    return next === undefined
      ? Promise.reject(new Error("réponse manquante"))
      : Promise.resolve(next);
  });
  return { fetch: createFeedFetcher({ transport, resolve }), transport };
}

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    return error instanceof FeedFetchError ? `${error.code}|${error.message}` : "autre";
  }
  return "aucune erreur";
}

describe("createFeedFetcher : lecture", () => {
  it("lit le flux et se connecte à l'adresse contrôlée", async () => {
    const { fetch, transport } = fetcher([ok()]);

    await expect(fetch(GOOGLE)).resolves.toBe(ICS);
    expect(transport.mock.calls[0]?.[0]).toMatchObject({ address: "142.250.74.14", family: 4 });
  });

  it("suit une redirection absolue puis relative, vers des hôtes autorisés", async () => {
    const { fetch, transport } = fetcher([
      redirect("https://outlook.live.com/a.ics"),
      redirect("/b.ics"),
      ok(),
    ]);

    await expect(fetch(GOOGLE)).resolves.toBe(ICS);
    expect(transport.mock.calls.map(([req]) => req.url.pathname)).toEqual([
      "/calendar/ical/x/private-secret123/basic.ics",
      "/a.ics",
      "/b.ics",
    ]);
  });

  it("accepte un type de contenu absent et text/plain", async () => {
    await expect(fetcher([ok(ICS, null)]).fetch(GOOGLE)).resolves.toBe(ICS);
    await expect(fetcher([ok(ICS, "text/plain")]).fetch(GOOGLE)).resolves.toBe(ICS);
  });
});

describe("createFeedFetcher : refus", () => {
  it("refuse un lien invalide ou hors liste sans rien envoyer", async () => {
    const { fetch, transport } = fetcher([ok()]);

    expect(await codeOf(fetch("https://evil.example/x.ics"))).toMatch(/^LINK_INVALID/);
    expect(await codeOf(fetch("http://calendar.google.com/x.ics"))).toMatch(/^LINK_INVALID/);
    expect(transport).not.toHaveBeenCalled();
  });

  it("refuse un hôte autorisé qui se résout vers une adresse interne, même mêlée à une publique", async () => {
    for (const addresses of [
      [{ address: "127.0.0.1", family: 4 as const }],
      [{ address: "169.254.169.254", family: 4 as const }],
      [{ address: "::1", family: 6 as const }],
      [
        { address: "142.250.74.14", family: 4 as const },
        { address: "10.0.0.8", family: 4 as const },
      ],
    ]) {
      const { fetch, transport } = fetcher([ok()], () => Promise.resolve(addresses));

      expect(await codeOf(fetch(GOOGLE))).toMatch(/^LINK_INVALID/);
      expect(transport).not.toHaveBeenCalled();
    }
  });

  it("revérifie chaque redirection : hôte hors liste ou adresse interne refusés", async () => {
    const toEvil = fetcher([redirect("https://evil.example/x.ics"), ok()]);
    const toInternal = fetcher([redirect("https://outlook.live.com/x.ics"), ok()], (host) =>
      Promise.resolve([
        { address: host === "outlook.live.com" ? "10.0.0.1" : "142.250.74.14", family: 4 },
      ]),
    );
    const toHttp = fetcher([redirect("http://calendar.google.com/x.ics"), ok()]);

    expect(await codeOf(toEvil.fetch(GOOGLE))).toMatch(/^LINK_INVALID/);
    expect(await codeOf(toInternal.fetch(GOOGLE))).toMatch(/^LINK_INVALID/);
    expect(await codeOf(toHttp.fetch(GOOGLE))).toMatch(/^LINK_INVALID/);
    expect(toEvil.transport).toHaveBeenCalledTimes(1);
  });

  it("s'arrête après trois redirections", async () => {
    const { fetch } = fetcher(Array.from({ length: 5 }, () => redirect("/suite.ics")));

    expect(await codeOf(fetch(GOOGLE))).toMatch(/^FEED_UNREACHABLE/);
  });

  it.each([
    ["statut 404", { status: 404, location: null, contentType: "text/calendar", body: "" }],
    ["statut 500", { status: 500, location: null, contentType: "text/calendar", body: "" }],
    ["page HTML", ok("<html>", "text/html")],
    ["redirection sans cible", { status: 302, location: null, contentType: null, body: "" }],
  ])("signale un flux injoignable : %s", async (_, response) => {
    expect(await codeOf(fetcher([response]).fetch(GOOGLE))).toMatch(/^FEED_UNREACHABLE/);
  });

  it("signale un hôte qui ne se résout pas ou ne répond rien", async () => {
    const failing: Resolve = () => Promise.reject(new Error("ENOTFOUND"));

    expect(await codeOf(fetcher([ok()], failing).fetch(GOOGLE))).toMatch(/^FEED_UNREACHABLE/);
    expect(await codeOf(fetcher([ok()], () => Promise.resolve([])).fetch(GOOGLE))).toMatch(
      /^FEED_UNREACHABLE/,
    );
  });

  it("coupe une résolution DNS qui ne répond jamais", async () => {
    const transport = vi.fn<Transport>();
    const hanging: Resolve = () => new Promise(() => undefined);
    const fetch = createFeedFetcher({ transport, resolve: hanging, timeoutMs: 20 });

    expect(await codeOf(fetch(GOOGLE))).toMatch(/^FEED_UNREACHABLE/);
    expect(transport).not.toHaveBeenCalled();
  });

  it("ne met jamais le lien dans l'erreur", async () => {
    for (const result of [
      await codeOf(
        fetcher([{ status: 404, location: null, contentType: null, body: "" }]).fetch(GOOGLE),
      ),
      await codeOf(fetcher([ok()]).fetch("https://evil.example/private-secret123")),
    ]) {
      expect(result).not.toContain("secret123");
      expect(result).not.toContain("google");
    }
  });
});
