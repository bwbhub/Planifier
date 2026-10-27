import type { SendMail } from "@planifier/mails";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createAuthMails } from "./auth-mails";

const LINKS = {
  secret: "secret-de-test-0123456789abcdef-0123456789",
  webOrigin: "https://planifier.test",
};
const USER = { email: "eve@example.test", name: "Eve", emailVerified: false };
const URL = "https://planifier.test/lien";

function capture() {
  const sendMail = vi.fn<SendMail>(() => Promise.resolve());
  const lastMail = () => sendMail.mock.calls.at(-1)?.[0];
  /** Attend l'envoi, lancé en arrière-plan. */
  const sent = () =>
    vi.waitFor(() => {
      expect(sendMail).toHaveBeenCalled();
    });
  return { mails: createAuthMails(sendMail, LINKS), lastMail, sent };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createAuthMails", () => {
  it("envoie l'e-mail de vérification à l'adresse du compte, lien compris, sans le nom", async () => {
    const { mails, lastMail, sent } = capture();
    await mails.sendVerificationEmail({ user: { ...USER, name: "Nom piégé" }, url: URL });
    await sent();

    expect(lastMail()?.to).toBe(USER.email);
    expect(lastMail()?.text).toContain(URL);
    expect(lastMail()?.html).not.toContain("Nom piégé");
  });

  it("renvoie un compte déjà vérifié vers la connexion", async () => {
    const { mails, lastMail, sent } = capture();
    await mails.sendExistingAccount({ user: { ...USER, emailVerified: true } });
    await sent();

    expect(lastMail()?.text).toContain("https://planifier.test/connexion");
  });

  it("donne un nouveau lien de vérification à un compte pas encore vérifié", async () => {
    const { mails, lastMail, sent } = capture();
    await mails.sendExistingAccount({ user: USER });
    await sent();

    expect(lastMail()?.text).toMatch(
      /https:\/\/planifier\.test\/api\/auth\/verify-email\?token=\S+&callbackURL=%2Fconnexion/,
    );
  });

  it("répond sans attendre l'envoi, et journalise un échec sans l'adresse ni le lien", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const sendMail = vi.fn<SendMail>(() => Promise.reject(new Error("HTTP 500")));
    await expect(
      createAuthMails(sendMail, LINKS).sendResetPassword({ user: USER, url: URL }),
    ).resolves.toBeUndefined();
    await vi.waitFor(() => {
      expect(log).toHaveBeenCalledOnce();
    });
    const entry = String(log.mock.calls[0]?.[0]);
    expect(entry).toContain("reset-password");
    expect(entry).not.toContain(USER.email);
    expect(entry).not.toContain(URL);
  });
});
