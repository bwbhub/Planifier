import { CLIENT_IP_HEADER } from "@planifier/constants/http";
import { createTestDatabase } from "@planifier/db/testing";
import type { Mail, SendMail } from "@planifier/mails";
import { createEmailVerificationToken } from "better-auth/api";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createAuth } from "./auth";
import { parseAuthEnv } from "./env";

const SECRET = "secret-de-test-integration-0123456789abcdef";
const PASSWORD = "mot-de-passe-actuel-1";
const OLD = "ancienne@example.test";
const NEW = "nouvelle@example.test";
const TAKEN = "prise@example.test";

const { db, reset } = createTestDatabase();
const sent: (Mail & { to: string })[] = [];
const sendMail: SendMail = (mail) => {
  sent.push(mail);
  return Promise.resolve();
};
const auth = createAuth(
  db,
  parseAuthEnv({
    NODE_ENV: "test",
    BETTER_AUTH_SECRET: SECRET,
    BETTER_AUTH_URL: "http://localhost:3000",
  }),
  sendMail,
);

/** Un compte vérifié et sa session (en-têtes avec cookie), sur une IP propre à l'appel. */
async function signedIn(email: string, ip: string) {
  await auth.api.signUpEmail({ body: { email, password: PASSWORD, name: "Eve" } });
  await db.user.update({ where: { email }, data: { emailVerified: true } });
  const { headers } = await auth.api.signInEmail({
    body: { email, password: PASSWORD },
    headers: new Headers({ [CLIENT_IP_HEADER]: ip }),
    returnHeaders: true,
  });
  const cookie = headers
    .getSetCookie()
    .map((line) => line.split(";")[0] ?? "")
    .join("; ");
  return new Headers({ cookie, [CLIENT_IP_HEADER]: ip });
}

/** Jeton du lien reçu à une adresse. */
function tokenSentTo(email: string): string {
  const mail = sent.findLast((candidate) => candidate.to === email);
  const token = /token=([^&\s]+)/.exec(mail?.text ?? "")?.[1];
  if (token === undefined) throw new Error("aucun lien reçu");
  return token;
}

const waitForMail = (to: string) =>
  vi.waitFor(() => {
    expect(sent.some((mail) => mail.to === to)).toBe(true);
  });

let headers: Headers;
let nextIp = 0;
const emailOnFile = async () => (await db.user.findFirstOrThrow({ where: { id: userId } })).email;
let userId: string;

beforeAll(async () => {
  await reset();
  await signedIn(TAKEN, "192.0.2.50");
});

beforeEach(async () => {
  sent.length = 0;
  await db.user.deleteMany({ where: { email: { in: [OLD, NEW] } } });
  // IP neuve à chaque test : la limitation de débit de Better Auth compte par IP.
  headers = await signedIn(OLD, `192.0.2.${String(60 + (nextIp += 1))}`);
  userId = (await db.user.findUniqueOrThrow({ where: { email: OLD } })).id;
  sent.length = 0;
});

afterAll(async () => {
  await db.$disconnect();
});

/** Par la route HTTP, comme le web : `currentPassword` n'est pas dans le type de l'API serveur. */
async function change(newEmail: string, currentPassword?: string) {
  const request = new Request("http://localhost:3000/api/auth/change-email", {
    method: "POST",
    headers: new Headers({
      cookie: headers.get("cookie") ?? "",
      [CLIENT_IP_HEADER]: headers.get(CLIENT_IP_HEADER) ?? "",
      "content-type": "application/json",
      origin: "http://localhost:3000",
    }),
    body: JSON.stringify({ newEmail, currentPassword }),
  });
  return auth.handler(request);
}

describe("changement d'adresse (base réelle)", () => {
  it("refuse sans le bon mot de passe actuel : rien ne part, rien ne change", async () => {
    expect((await change(NEW, "mauvais-mot-de-passe")).status).toBe(400);
    expect((await change(NEW)).status).toBe(400);

    expect(sent).toHaveLength(0);
    await expect(db.user.findUnique({ where: { email: OLD } })).resolves.not.toBeNull();
  });

  it("envoie le lien à la nouvelle adresse, et ne change l'adresse qu'au clic", async () => {
    // Casse mixte : Better Auth normalise en minuscules, l'avis à l'ancienne doit partir quand même.
    expect((await change(NEW.toUpperCase(), PASSWORD)).status).toBe(200);
    await waitForMail(NEW);

    expect(sent.map((mail) => mail.to)).toEqual([NEW]);
    await expect(db.user.findUnique({ where: { email: OLD } })).resolves.not.toBeNull();

    await auth.api.verifyEmail({ query: { token: tokenSentTo(NEW) }, headers });
    await waitForMail(OLD);

    await expect(db.user.findUnique({ where: { email: NEW } })).resolves.toMatchObject({
      emailVerified: true,
    });
    await expect(db.user.findUnique({ where: { email: OLD } })).resolves.toBeNull();
    const notice = sent.find((mail) => mail.to === OLD);
    expect(notice?.text).not.toContain("http");
  });

  it("répond comme pour un succès à une adresse déjà prise, sans rien envoyer ni changer", async () => {
    const response = await change(TAKEN, PASSWORD);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: true });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(sent).toHaveLength(0);
    expect(await emailOnFile()).toBe(OLD);
  });

  it("refuse un lien expiré", async () => {
    const expired = await createEmailVerificationToken(SECRET, OLD, NEW, -10, {
      requestType: "change-email-verification",
    });

    await expect(auth.api.verifyEmail({ query: { token: expired }, headers })).rejects.toThrow();
    expect(await emailOnFile()).toBe(OLD);
    expect(sent).toHaveLength(0);
  });
});
