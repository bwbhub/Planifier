import type { AddressInfo } from "node:net";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ApiClient } from "@planifier/api-contract";
import {
  AUTH_COOKIE_PREFIX,
  createAuth,
  createAuthNodeHandler,
  getSessionUser,
  parseAuthEnv,
} from "@planifier/auth";
import { CLIENT_IP_HEADER } from "@planifier/constants/http";
import { createTestDatabase } from "@planifier/db/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApiServer } from "./server";

// Intégration sur un vrai PostgreSQL : base locale dédiée en `_test`, migrations appliquées, vidée avant le fichier
// (`createTestDatabase` refuse toute autre base). Lancement : `pnpm test:integration`.
const WEB_ORIGIN = "http://localhost:3000";
const { db, reset } = createTestDatabase();
const auth = createAuth(
  db,
  parseAuthEnv({
    NODE_ENV: "test",
    BETTER_AUTH_SECRET: "secret-de-test-integration-0123456789abcdef",
    BETTER_AUTH_URL: WEB_ORIGIN,
  }),
);
const server = createApiServer({
  env: { NODE_ENV: "test" },
  authHandler: createAuthNodeHandler(auth),
  getSessionUser: (headers) => getSessionUser(auth, headers),
});

const EMAIL = "integration@example.test";
const PASSWORD = "mot-de-passe-de-test";
let baseUrl = "";

/** Appel d'une route de Better Auth comme le ferait le proxy du web (origine, IP du client). */
function authPost(path: string, body: object, ip: string, cookie?: string) {
  return fetch(`${baseUrl}/api/auth/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: WEB_ORIGIN,
      [CLIENT_IP_HEADER]: ip,
      ...(cookie === undefined ? {} : { cookie }),
    },
    body: JSON.stringify(body),
  });
}

/** Cookies `nom=valeur` posés par une réponse, prêts à renvoyer. */
function cookiesOf(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

function clientWith(cookie: string): ApiClient {
  return createORPCClient(
    new RPCLink({ url: `${baseUrl}/rpc`, headers: { cookie, [CLIENT_IP_HEADER]: "192.0.2.99" } }),
  );
}

beforeAll(async () => {
  await reset();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address: AddressInfo | string | null = server.address();
  if (address === null || typeof address === "string") throw new Error("adresse inattendue");
  baseUrl = `http://127.0.0.1:${String(address.port)}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.$disconnect();
});

describe("authentification (base réelle)", () => {
  it("inscrit, garde la session, déconnecte puis reconnecte", async () => {
    const signUp = await authPost(
      "sign-up/email",
      { email: EMAIL.toUpperCase(), password: PASSWORD, name: "Intégration" },
      "192.0.2.10",
    );
    expect(signUp.status).toBe(200);
    const setCookie = signUp.headers.getSetCookie().join("\n");
    expect(setCookie).toContain(`${AUTH_COOKIE_PREFIX}.session_token=`);
    expect(setCookie).toMatch(/HttpOnly/i);

    const session = cookiesOf(signUp);
    const me = await clientWith(session).account.me.get({});
    // E-mail ramené en minuscules à l'inscription.
    expect(me).toMatchObject({ name: "Intégration", email: EMAIL });

    const signOut = await authPost("sign-out", {}, "192.0.2.10", session);
    expect(signOut.status).toBe(200);
    await expect(clientWith(session).account.me.get({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    const signIn = await authPost(
      "sign-in/email",
      { email: EMAIL, password: PASSWORD },
      "192.0.2.11",
    );
    expect(signIn.status).toBe(200);
    await expect(clientWith(cookiesOf(signIn)).account.me.get({})).resolves.toMatchObject({
      email: EMAIL,
    });
  });

  it("refuse un mauvais mot de passe sans ouvrir de session", async () => {
    const response = await authPost(
      "sign-in/email",
      { email: EMAIL, password: "pas-le-bon-mot-de-passe" },
      "192.0.2.20",
    );
    expect(response.status).toBe(401);
    expect(cookiesOf(response)).not.toMatch(/session_token/);
  });

  it("limite les tentatives de connexion par IP", async () => {
    const attempt = (ip: string) =>
      authPost("sign-in/email", { email: EMAIL, password: "x".repeat(10) }, ip).then(
        (response) => response.status,
      );
    const statuses = [];
    for (let i = 0; i < 4; i += 1) statuses.push(await attempt("192.0.2.30"));
    expect(statuses.at(-1)).toBe(429);
    // Une autre IP n'est pas bloquée par la première.
    expect(await attempt("192.0.2.31")).toBe(401);
  });

  it("refuse une inscription venue d'une autre origine", async () => {
    const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://malveillant.example",
        [CLIENT_IP_HEADER]: "192.0.2.40",
      },
      body: JSON.stringify({ email: "autre-origine@example.test", password: PASSWORD, name: "X" }),
    });
    expect(response.status).toBe(403);
    await expect(db.user.count({ where: { email: "autre-origine@example.test" } })).resolves.toBe(
      0,
    );
  });

  it("refuse un nom affiché vide sans créer de compte", async () => {
    const email = "nom-vide@example.test";
    const response = await authPost(
      "sign-up/email",
      { email, password: PASSWORD, name: "   " },
      "192.0.2.50",
    );
    expect(response.status).toBe(400);
    await expect(db.user.count({ where: { email } })).resolves.toBe(0);
  });
});
