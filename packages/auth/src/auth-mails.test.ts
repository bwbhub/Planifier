import type { SendMail } from "@planifier/mails";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createAuthMails } from "./auth-mails";

const DATA = {
  user: { email: "eve@example.test", name: "Eve" },
  url: "https://planifier.test/lien",
};

/** Laisse passer les envois lancés en arrière-plan. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createAuthMails", () => {
  it("envoie l'e-mail de vérification à l'adresse du compte, lien compris", async () => {
    const sendMail = vi.fn<SendMail>(() => Promise.resolve());
    await createAuthMails(sendMail).sendVerificationEmail(DATA);
    await flush();

    const [mail] = sendMail.mock.calls[0] ?? [];
    expect(mail?.to).toBe(DATA.user.email);
    expect(mail?.text).toContain(DATA.url);
  });

  it("répond sans attendre l'envoi, et journalise un échec sans l'adresse ni le lien", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const sendMail = vi.fn<SendMail>(() => Promise.reject(new Error("HTTP 500")));
    await expect(createAuthMails(sendMail).sendResetPassword(DATA)).resolves.toBeUndefined();
    await flush();

    expect(log).toHaveBeenCalledOnce();
    const entry = String(log.mock.calls[0]?.[0]);
    expect(entry).toContain("reset-password");
    expect(entry).not.toContain(DATA.user.email);
    expect(entry).not.toContain(DATA.url);
  });
});
