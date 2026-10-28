import type { AddressInfo } from "node:net";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { PLAN_RATE_LIMIT } from "@planifier/api";
import { AUTH_ERROR_CODES, AUTH_ROUTES, type ApiClient } from "@planifier/api-contract";
import {
  AUTH_COOKIE_PREFIX,
  createAuth,
  createAuthNodeHandler,
  getSessionUser,
  parseAuthEnv,
} from "@planifier/auth";
import { AUTH_PAGES } from "@planifier/constants/account";
import { AUTH_BASE_PATH, CLIENT_IP_HEADER } from "@planifier/constants/http";
import { createTestDatabase } from "@planifier/db/testing";
import type { Mail } from "@planifier/mails";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { createApiServer } from "./server";

// Intégration sur un vrai PostgreSQL : base locale dédiée en `_test`, migrations appliquées, vidée avant le fichier
// (`createTestDatabase` refuse toute autre base). Lancement : `pnpm test:integration`.
const WEB_ORIGIN = "http://localhost:3000";
const { db, reset } = createTestDatabase();
/** E-mails « envoyés » par Better Auth, dans l'ordre. */
const sentMails: Mail[] = [];
const auth = createAuth(
  db,
  parseAuthEnv({
    NODE_ENV: "test",
    BETTER_AUTH_SECRET: "secret-de-test-integration-0123456789abcdef",
    BETTER_AUTH_URL: WEB_ORIGIN,
  }),
  (mail) => {
    sentMails.push(mail);
    return Promise.resolve();
  },
);
const server = createApiServer({
  env: { NODE_ENV: "test", RPC_RATE_LIMIT_PER_MINUTE: PLAN_RATE_LIMIT.max },
  authHandler: createAuthNodeHandler(auth),
  getSessionUser: (headers) => getSessionUser(auth, headers),
  getDb: () => db,
});

const EMAIL = "integration@example.test";
const PASSWORD = "mot-de-passe-de-test";
let baseUrl = "";

/** Appel d'une route de Better Auth comme le ferait le proxy du web (origine, IP du client). */
function authPost(route: string, body: object, ip: string, cookie?: string) {
  return fetch(`${baseUrl}${AUTH_BASE_PATH}${route}`, {
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

/** Lien du dernier e-mail reçu par `email` (version texte). */
function lastLinkSentTo(email: string): string {
  const mail = sentMails.findLast((sent) => sent.to === email);
  const link = /https?:\/\/\S+/.exec(mail?.text ?? "")?.[0];
  if (link === undefined) throw new Error(`aucun lien envoyé à ${email}`);
  return link;
}

/** Ouvre un lien d'e-mail (adressé au web) directement sur l'API, sans suivre la redirection. */
function openLink(link: string, ip: string, cookie?: string) {
  const url = new URL(link);
  return fetch(`${baseUrl}${url.pathname}${url.search}`, {
    redirect: "manual",
    headers: { [CLIENT_IP_HEADER]: ip, ...(cookie === undefined ? {} : { cookie }) },
  });
}

/** Inscrit `email`, puis ouvre le lien de vérification reçu : renvoie la session qu'il ouvre. */
async function signUpAndVerify(email: string, name: string, ip: string): Promise<string> {
  const signUp = await authPost(
    AUTH_ROUTES.signUp,
    { email, password: PASSWORD, name, callbackURL: AUTH_PAGES.signIn },
    ip,
  );
  expect(signUp.status).toBe(200);
  const verified = await openLink(lastLinkSentTo(email.toLowerCase()), ip);
  expect(verified.status).toBe(302);
  return cookiesOf(verified);
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

describe("session (base réelle)", () => {
  it("vérifie l'adresse par le lien reçu, qui ouvre la session, puis déconnecte et reconnecte", async () => {
    const signUp = await authPost(
      AUTH_ROUTES.signUp,
      {
        email: EMAIL.toUpperCase(),
        password: PASSWORD,
        name: "Intégration",
        callbackURL: AUTH_PAGES.signIn,
      },
      "192.0.2.10",
    );
    expect(signUp.status).toBe(200);
    // E-mail ramené en minuscules à l'inscription.
    const verified = await openLink(lastLinkSentTo(EMAIL), "192.0.2.10");
    expect(verified.status).toBe(302);
    expect(verified.headers.get("location")).toBe("/connexion");
    const setCookie = verified.headers.getSetCookie().join("\n");
    expect(setCookie).toContain(`${AUTH_COOKIE_PREFIX}.session_token=`);
    expect(setCookie).toMatch(/HttpOnly/i);

    const session = cookiesOf(verified);
    const me = await clientWith(session).account.me.get({});
    expect(me).toMatchObject({ name: "Intégration", email: EMAIL });

    const signOut = await authPost(AUTH_ROUTES.signOut, {}, "192.0.2.10", session);
    expect(signOut.status).toBe(200);
    await expect(clientWith(session).account.me.get({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    const signIn = await authPost(
      AUTH_ROUTES.signIn,
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
      AUTH_ROUTES.signIn,
      { email: EMAIL, password: "pas-le-bon-mot-de-passe" },
      "192.0.2.20",
    );
    expect(response.status).toBe(401);
    // Code lu par le web pour choisir son message (contrat `AUTH_ERROR_CODES`).
    await expect(response.json()).resolves.toMatchObject({
      code: AUTH_ERROR_CODES.invalidCredentials,
    });
    expect(cookiesOf(response)).not.toMatch(/session_token/);
  });

  it("limite les tentatives de connexion par IP", async () => {
    const attempt = (ip: string) =>
      authPost(AUTH_ROUTES.signIn, { email: EMAIL, password: "x".repeat(10) }, ip).then(
        (response) => response.status,
      );
    const statuses = [];
    for (let i = 0; i < 4; i += 1) statuses.push(await attempt("192.0.2.30"));
    expect(statuses.at(-1)).toBe(429);
    // Une autre IP n'est pas bloquée par la première.
    expect(await attempt("192.0.2.31")).toBe(401);
  });
});

describe("vérification d'adresse (base réelle)", () => {
  it("n'ouvre pas de session à l'inscription, et refuse la connexion avant la vérification", async () => {
    const email = "pas-encore-verifie@example.test";
    const signUp = await authPost(
      AUTH_ROUTES.signUp,
      { email, password: PASSWORD, name: "Pas vérifié" },
      "192.0.2.12",
    );
    expect(signUp.status).toBe(200);
    expect(cookiesOf(signUp)).not.toMatch(/session_token/);
    const sentTo = () => sentMails.filter((mail) => mail.to === email).length;
    expect(sentTo()).toBe(1);

    const signIn = await authPost(AUTH_ROUTES.signIn, { email, password: PASSWORD }, "192.0.2.12");
    expect(signIn.status).toBe(403);
    await expect(signIn.json()).resolves.toMatchObject({
      code: AUTH_ERROR_CODES.emailNotVerified,
    });
    // Un nouveau lien part à chaque tentative.
    expect(sentTo()).toBe(2);

    // Réinscription sur l'adresse non vérifiée : un lien de vérification, qui ouvre bien la session.
    await authPost(
      AUTH_ROUTES.signUp,
      { email, password: PASSWORD, name: "Pas vérifié", callbackURL: AUTH_PAGES.signIn },
      "192.0.2.13",
    );
    await vi.waitFor(() => {
      expect(sentTo()).toBe(3);
    });
    const verified = await openLink(lastLinkSentTo(email), "192.0.2.13");
    expect(verified.status).toBe(302);
    expect(cookiesOf(verified)).toMatch(/session_token/);
  });
});

describe("refus d'inscription (base réelle)", () => {
  it("répond comme une inscription neuve sur un e-mail déjà inscrit, et renvoie son propriétaire à la connexion", async () => {
    const response = await authPost(
      AUTH_ROUTES.signUp,
      { email: EMAIL, password: PASSWORD, name: "Doublon", callbackURL: AUTH_PAGES.signIn },
      "192.0.2.21",
    );
    expect(response.status).toBe(200);
    expect(cookiesOf(response)).not.toMatch(/session_token/);
    await expect(db.user.count({ where: { email: EMAIL } })).resolves.toBe(1);
    await vi.waitFor(() => {
      expect(lastLinkSentTo(EMAIL)).toBe(`${WEB_ORIGIN}${AUTH_PAGES.signIn}`);
    });
  });

  it("refuse une inscription venue d'une autre origine", async () => {
    const response = await fetch(`${baseUrl}${AUTH_BASE_PATH}${AUTH_ROUTES.signUp}`, {
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
      AUTH_ROUTES.signUp,
      { email, password: PASSWORD, name: "   " },
      "192.0.2.50",
    );
    expect(response.status).toBe(400);
    await expect(db.user.count({ where: { email } })).resolves.toBe(0);
  });
});

const PROFILE_EMAIL = "profil@example.test";

/** Compte de profil neuf, vérifié et connecté ; chaque test a son IP pour ne pas cumuler les limites de débit. */
async function signedUpProfile(ip: string): Promise<string> {
  await db.user.deleteMany({ where: { email: PROFILE_EMAIL } });
  return signUpAndVerify(PROFILE_EMAIL, "Profil", ip);
}

describe("profil (base réelle)", () => {
  const email = PROFILE_EMAIL;
  const signedUp = signedUpProfile;

  it("suit le thème de l'appareil par défaut, puis enregistre le nom et le thème choisis", async () => {
    const session = await signedUp("192.0.2.60");
    await expect(clientWith(session).account.me.get({})).resolves.toMatchObject({
      preferredTheme: "SYSTEM",
    });

    const update = await authPost(
      AUTH_ROUTES.updateUser,
      { name: "Profil modifié", preferredTheme: "DARK" },
      "192.0.2.60",
      session,
    );
    expect(update.status).toBe(200);
    await expect(clientWith(session).account.me.get({})).resolves.toMatchObject({
      name: "Profil modifié",
      preferredTheme: "DARK",
    });
  });

  it("refuse un thème inconnu, un changement d'e-mail et un avatar sans rien écrire", async () => {
    const session = await signedUp("192.0.2.61");
    for (const body of [
      { preferredTheme: "ROSE" },
      { email: "autre@example.test" },
      { name: "Profil", image: "https://malveillant.example/a.png" },
    ]) {
      const response = await authPost(AUTH_ROUTES.updateUser, body, "192.0.2.61", session);
      expect(response.status).toBe(400);
    }
    await expect(db.user.findUnique({ where: { email } })).resolves.toMatchObject({
      preferredTheme: "SYSTEM",
      avatarUrl: null,
    });
  });
});

describe("changement de mot de passe (base réelle)", () => {
  const email = PROFILE_EMAIL;
  const signedUp = signedUpProfile;

  it("change le mot de passe sans toucher aux autres sessions si on ne le demande pas", async () => {
    const other = await signedUp("192.0.2.65");
    const signIn = await authPost(AUTH_ROUTES.signIn, { email, password: PASSWORD }, "192.0.2.66");
    const change = await authPost(
      AUTH_ROUTES.changePassword,
      {
        currentPassword: PASSWORD,
        newPassword: "nouveau-mot-de-passe",
        revokeOtherSessions: false,
      },
      "192.0.2.66",
      cookiesOf(signIn),
    );
    expect(change.status).toBe(200);
    await expect(clientWith(other).account.me.get({})).resolves.toMatchObject({ email });
  });

  it("change le mot de passe avec l'actuel et ferme les autres sessions sur demande", async () => {
    const other = await signedUp("192.0.2.62");
    const signIn = await authPost(AUTH_ROUTES.signIn, { email, password: PASSWORD }, "192.0.2.63");
    const current = cookiesOf(signIn);
    const newPassword = "nouveau-mot-de-passe";

    const wrong = await authPost(
      AUTH_ROUTES.changePassword,
      { currentPassword: "pas-le-bon", newPassword, revokeOtherSessions: true },
      "192.0.2.63",
      current,
    );
    expect(wrong.status).toBe(400);
    await expect(wrong.json()).resolves.toMatchObject({ code: AUTH_ERROR_CODES.invalidPassword });

    const change = await authPost(
      AUTH_ROUTES.changePassword,
      { currentPassword: PASSWORD, newPassword, revokeOtherSessions: true },
      "192.0.2.63",
      current,
    );
    expect(change.status).toBe(200);
    await expect(clientWith(other).account.me.get({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    const again = await authPost(
      AUTH_ROUTES.signIn,
      { email, password: newPassword },
      "192.0.2.64",
    );
    expect(again.status).toBe(200);
  });
});

describe("mot de passe oublié (base réelle)", () => {
  const email = "oubli@example.test";
  const newPassword = "mot-de-passe-retrouve";

  it("n'envoie rien pour une adresse inconnue, avec la même réponse", async () => {
    const mailsBefore = sentMails.length;
    const response = await authPost(
      AUTH_ROUTES.requestPasswordReset,
      { email: "inconnu@example.test", redirectTo: AUTH_PAGES.resetPassword },
      "192.0.2.80",
    );
    expect(response.status).toBe(200);
    expect(sentMails.length).toBe(mailsBefore);
  });

  it("envoie un lien qui mène à la page du nouveau mot de passe, puis ferme les sessions ouvertes", async () => {
    const before = await signUpAndVerify(email, "Oubli", "192.0.2.81");
    const request = await authPost(
      AUTH_ROUTES.requestPasswordReset,
      { email, redirectTo: AUTH_PAGES.resetPassword },
      "192.0.2.81",
    );
    expect(request.status).toBe(200);

    const opened = await openLink(lastLinkSentTo(email), "192.0.2.81");
    expect(opened.status).toBe(302);
    const target = new URL(opened.headers.get("location") ?? "", WEB_ORIGIN);
    expect(target.pathname).toBe(AUTH_PAGES.resetPassword);
    const token = target.searchParams.get("token") ?? "";

    const reset = await authPost(AUTH_ROUTES.resetPassword, { newPassword, token }, "192.0.2.81");
    expect(reset.status).toBe(200);
    await expect(clientWith(before).account.me.get({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    const signIn = await authPost(
      AUTH_ROUTES.signIn,
      { email, password: newPassword },
      "192.0.2.82",
    );
    expect(signIn.status).toBe(200);
  });

  it("refuse un lien déjà servi avec le code du contrat", async () => {
    const response = await authPost(
      AUTH_ROUTES.resetPassword,
      { newPassword, token: "jeton-inconnu" },
      "192.0.2.83",
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ code: AUTH_ERROR_CODES.invalidToken });
  });
});
