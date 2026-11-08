import { describe, expect, it } from "vitest";

import { changeEmailMail } from "./change-email";
import { emailChangedNoticeMail } from "./email-changed-notice";
import { existingAccountMail } from "./existing-account";
import { resetPasswordMail } from "./reset-password";
import { verifyEmailMail } from "./verify-email";

const URL = "https://planifier.test/api/auth/verify-email?token=abc&callbackURL=%2Fconnexion";

describe.each([
  ["verifyEmailMail", verifyEmailMail({ url: URL })],
  ["changeEmailMail", changeEmailMail({ url: URL })],
  ["resetPasswordMail", resetPasswordMail({ name: "Eve", url: URL })],
  ["existingAccountMail (vérifiée)", existingAccountMail({ verified: true, signInUrl: URL })],
  [
    "existingAccountMail (non vérifiée)",
    existingAccountMail({ verified: false, verificationUrl: URL }),
  ],
])("%s", (_, mail) => {
  it("met le lien dans le bouton et dans la version texte", () => {
    expect(mail.html).toContain(`href="${URL.replaceAll("&", "&amp;")}"`);
    expect(mail.text).toContain(URL);
    expect(mail.html.startsWith("<!DOCTYPE html")).toBe(true);
  });
});

describe("verifyEmailMail", () => {
  it("dit combien de temps le lien reste valable", () => {
    expect(verifyEmailMail({ url: URL }).text).toContain("valable 60 minutes");
  });
});

describe("resetPasswordMail", () => {
  it("échappe le nom affiché dans le HTML", () => {
    const mail = resetPasswordMail({ name: "<b>Eve</b>", url: URL });
    expect(mail.html).not.toContain("<b>Eve</b>");
    expect(mail.html).toContain("&lt;b&gt;Eve&lt;/b&gt;");
  });
});

describe("emailChangedNoticeMail", () => {
  it("ne porte aucun lien ni bouton", () => {
    const mail = emailChangedNoticeMail();
    expect(mail.html).not.toContain("href=");
    expect(mail.text).not.toContain("http");
  });
});
